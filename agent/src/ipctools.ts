import type { AgentTool } from "@mariozechner/pi-agent-core";
import { type Static, Type } from "@sinclair/typebox";
import fs from 'fs';
import path from 'path';
import { CronExpressionParser } from 'cron-parser';

const IPC_DIR = '/workspace/ipc';
const MESSAGES_DIR = path.join(IPC_DIR, 'messages');
const TASKS_DIR = path.join(IPC_DIR, 'tasks');

const chatJid = process.env.VTCLAW_CHAT_JID!;
const groupFolder = process.env.VTCLAW_GROUP_FOLDER!;

function writeIpcFile(dir: string, data: object): string {
  fs.mkdirSync(dir, { recursive: true });

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`;
  const filepath = path.join(dir, filename);

  // Atomic write: temp file then rename
  const tempPath = `${filepath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2));
  fs.renameSync(tempPath, filepath);

  return filename;
}

const sendMessageSchema = Type.Object({
  text: Type.String({ description: "The message text to send, can't be empty." }),
})

export const sendMessageTool: AgentTool<typeof sendMessageSchema> = {
  name: "send_message",
  label: "Send Message to Channel",  // For UI display
  description: "Send a message to the user or group immediately while you're still running. Use this for progress updates or to send multiple messages. You can call this multiple times.",
  parameters: sendMessageSchema,

  execute: async (_toolCallId: string, {text}:{ text: string;}, _signal?: AbortSignal) => {
    const data: Record<string, string | undefined> = {
      type: 'message',
      chatJid,
      text: text,
      groupFolder,
      timestamp: new Date().toISOString(),
    };
    writeIpcFile(MESSAGES_DIR, data);
    return {
      content: [{ type: 'text' as const, text: 'Message sent.' }],
      details: undefined,
    };
  },
};
