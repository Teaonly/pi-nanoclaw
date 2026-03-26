import { WeChatAuthInfo, wechat_login } from "./login.js";
import { 
  NewMessage,
  Channel, 
  ChannelOpts 
} from "../types.js";


export class WeChatChannel implements Channel {
    name = 'WeChat';
    jid = '';
    folder = '';
    private connected = false;

    private auth: WeChatAuthInfo;
    private opts: ChannelOpts;

    private constructor(auth: WeChatAuthInfo, opts: ChannelOpts) {
        this.auth = {
            WX_TOKEN: auth.WX_TOKEN,
            WX_ACCOUNT_ID: auth.WX_ACCOUNT_ID,
            WX_USER_ID: auth.WX_USER_ID
        };
        this.jid = `wx-${auth.WX_USER_ID}`;
        this.folder = auth.WX_ACCOUNT_ID.split('@')[0];
        this.opts = opts;
    }

    static async create(opts: ChannelOpts): Promise<WeChatChannel> {
        const auth = await wechat_login();
        const channel = new WeChatChannel(auth, opts);
        return channel;
    }

    async connect(): Promise<void> {
    }
    async disconnect(): Promise<void> {    
    }
    isConnected(): boolean {
        return this.connected;
    }
    async sendMessage(type:"text" | "image" | "file", content: string): Promise<void> {   
    }
    async setTyping(isTyping: boolean): Promise<void> {

    }

}