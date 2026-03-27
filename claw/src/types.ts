export interface NewMessage {
  id: string;
  jid: string;
  role: "bot" | "me";
  type: "text" | "image" | "file";
  content: string;
  timestamp: string;
}

export interface Channel {
  name: string;
  jid: string;
  folder: string;

  connect(): Promise<void>;
  sendMessage(type: "text" | "image" | "file", content: string): Promise<void>;
  isConnected(): boolean;
  disconnect(): Promise<void>;
  setTyping?(isTyping: boolean): Promise<void>;
}

export interface ChannelOpts {
  // Callback type that channels use to deliver inbound messages
  onMessage: (jid: string, message: NewMessage) => void;
}

export interface ChannelRuntime {
  lastTimestamp: string;
  lastAgentTimestamp: Record<string, string>;
  channels: Channel[];
  loadState(): void;
  saveState(): void;
}
