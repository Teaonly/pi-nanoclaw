import type { ChannelRuntime, ChannelOpts } from "./types.js";
import { isValidGroupFolder } from "./groups.js";
import { WeChatChannel } from "./wechat/index.js";

export async function buildChannels(
  runtime: ChannelRuntime,
  opts: ChannelOpts,
): Promise<void> {
  runtime.channels.push(await WeChatChannel.create(opts));
}

export async function connectChannels(runtime: ChannelRuntime): Promise<void> {
  for (const ch of runtime.channels) {
    await ch.connect();
  }
}
