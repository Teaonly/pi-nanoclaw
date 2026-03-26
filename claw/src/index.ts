import fs from "fs";
import path from "path";

import { logger } from "./logger.js";
import { 
  NewMessage,
  Channel, 
  ChannelOpts 
} from "./types.js";
import {buildChannels} from "./channel-factory.js";
import {
  cleanupOrphans,
  ensureContainerRuntimeRunning,
} from "./container-runtime.js";

// 全局变量以及处理入口
const channels: Channel[] = [];
const channelOpts: ChannelOpts = {
  onMessage: (jid:string, message: NewMessage) => {

  },
}

async function main(): Promise<void> {
  // Make sure we have container run time.
  ensureContainerRuntimeRunning();
  cleanupOrphans();

  // Graceful shutdown handlers
  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Shutdown signal received");
    process.exit(0);
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  await buildChannels(channels, channelOpts);
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
