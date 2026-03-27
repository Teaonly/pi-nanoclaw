import fs from "fs";
import path from "path";

import { logger } from "./logger.js";
import { TIMEZONE, IDLE_TIMEOUT } from "./config.js";
import { NewMessage, Channel, ChannelOpts, ChannelRuntime } from "./types.js";
import { buildChannels, connectChannels } from "./channel-factory.js";
import {
  cleanupOrphans,
  ensureContainerRuntimeRunning,
} from "./container-runtime.js";
import {
  initDatabase,
  getRouterState,
  setRouterState,
  storeMessage,
  getMessagesSince,
} from "./db.js";
import { startMessageLoop, formatMessages } from "./messages-loop.js";
import { GroupQueue, buildGroups } from "./groups.js";

// 全局变量以及处理入口
const groupQueue = new GroupQueue();
const runtime: ChannelRuntime = {
  lastTimestamp: "",
  lastAgentTimestamp: {},
  channels: [],
  loadState: () => {
    runtime.lastTimestamp = getRouterState("last_timestamp") || "";
    const agentTs = getRouterState("last_agent_timestamp");
    try {
      runtime.lastAgentTimestamp = agentTs ? JSON.parse(agentTs) : {};
    } catch {
      logger.warn("Corrupted last_agent_timestamp in DB, resetting");
      runtime.lastAgentTimestamp = {};
    }
  },
  saveState: () => {
    setRouterState("last_timestamp", runtime.lastTimestamp);
    setRouterState(
      "last_agent_timestamp",
      JSON.stringify(runtime.lastAgentTimestamp),
    );
  },
};

// Message entry and loop
const channelOpts: ChannelOpts = {
  onMessage: (jid: string, message: NewMessage) => {
    if (checkJidValid(jid)) {
      storeMessage(message);
    }
  },
};

function checkJidValid(jid: string): Channel | null {
  for (const ch of runtime.channels) {
    if (ch.jid == jid) {
      return ch;
    }
  }
  return null;
}

/**
 * Process all pending messages for a group.
 * Called by the GroupQueue when it's this group's turn.
 */
async function processGroupMessages(chatJid: string): Promise<boolean> {
  const targetChannel = checkJidValid(chatJid);
  if (targetChannel === null) {
    logger.error(`JID: ${chatJid} can't been found in channels.`);
    return false;
  }
  const sinceTimestamp = runtime.lastAgentTimestamp[chatJid] || "";
  const missedMessages = getMessagesSince(chatJid, sinceTimestamp);
  if (missedMessages.length === 0) return true;

  const prompt = formatMessages(missedMessages, TIMEZONE);

  // Advance cursor so the piping path in startMessageLoop won't re-fetch
  // these messages. Save the old cursor so we can roll back on error.
  const previousCursor = runtime.lastAgentTimestamp[chatJid] || "";
  runtime.lastAgentTimestamp[chatJid] =
    missedMessages[missedMessages.length - 1].timestamp;
  runtime.saveState();

  logger.info(
    { group: targetChannel.name, messageCount: missedMessages.length },
    "Processing messages",
  );

  // Track idle timer for closing stdin when agent is idle
  let idleTimer: ReturnType<typeof setTimeout> | null = null;

  const resetIdleTimer = () => {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      logger.debug(
        { group: targetChannel.name },
        "Idle timeout, closing container stdin",
      );
      groupQueue.closeStdin(chatJid);
    }, IDLE_TIMEOUT);
  };

  await targetChannel.setTyping?.(true);
  let hadError = false;
  let outputSentToUser = false;

  /*
  const output = await runAgent(group, prompt, chatJid, async (result) => {
    // Streaming output callback — called for each agent result
    if (result.result) {
      const raw =
        typeof result.result === 'string'
          ? result.result
          : JSON.stringify(result.result);
      // Strip <internal>...</internal> blocks — agent uses these for internal reasoning
      const text = raw.replace(/<internal>[\s\S]*?<\/internal>/g, '').trim();
      logger.info({ group: group.name }, `Agent output: ${raw.slice(0, 200)}`);
      if (text) {
        await channel.sendMessage(chatJid, text);
        outputSentToUser = true;
      }
      // Only reset idle timer on actual results, not session-update markers (result: null)
      resetIdleTimer();
    }

    if (result.status === 'success') {
      queue.notifyIdle(chatJid);
    }

    if (result.status === 'error') {
      hadError = true;
    }
  });
  */
  let output: "success" | "error" = "error";

  await targetChannel.setTyping?.(false);
  if (idleTimer) clearTimeout(idleTimer);

  if (output === "error" || hadError) {
    // If we already sent output to the user, don't roll back the cursor —
    // the user got their response and re-processing would send duplicates.
    if (outputSentToUser) {
      logger.warn(
        { group: targetChannel.name },
        "Agent error after output was sent, skipping cursor rollback to prevent duplicates",
      );
      return true;
    }
    // Roll back cursor so retries can re-process these messages
    runtime.lastAgentTimestamp[chatJid] = previousCursor;
    runtime.saveState();
    logger.warn(
      { group: targetChannel.name },
      "Agent error, rolled back message cursor for retry",
    );
    return false;
  }
  return true;
}

async function main(): Promise<void> {
  // Make sure we have container run time.
  ensureContainerRuntimeRunning();
  cleanupOrphans();

  // init database for chat messages
  initDatabase();
  runtime.loadState();

  // Graceful shutdown handlers
  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Shutdown signal received");
    process.exit(0);
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  // 设置好处理消息的函数
  // Group = Channel + Container
  groupQueue.setProcessMessagesFn(processGroupMessages);
  await buildChannels(runtime, channelOpts);
  await buildGroups(runtime);
  await connectChannels(runtime);

  startMessageLoop(runtime, groupQueue).catch((err: Error) => {
    logger.fatal({ err }, "Message loop crashed unexpectedly");
    process.exit(1);
  });
}

// Guard: only run when executed directly, not when imported by tests
const isDirectRun =
  process.argv[1] &&
  new URL(import.meta.url).pathname ===
    new URL(`file://${process.argv[1]}`).pathname;

if (isDirectRun) {
  main().catch((err) => {
    logger.error({ err }, "Failed to start pi-claw");
    process.exit(1);
  });
}
