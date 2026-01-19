import io from "socket.io-client";
import { ChatInterface } from "../chat";
import BotConversation from "../chat/botAgent/getBotConversation";
import Notification from "../notifications/notification";
import { presenceStart } from "../redux/actions/global.action";
import store from "../redux/store";
import { HistoryInterface } from "../history";

class WebSocketClient {
    constructor() {
        this.socket = null;
        this.url = null;
        this.options = null;
    }

    initialize({ url, options }) {
        if (this.socket) {
            console.warn("Socket already initialized");
            return;
        }
        this.url = url;
        this.options = {
            transports: ["websocket"],
            reconnection: false,
            forceNew: true,
            reconnect: false,
            reconnectionAttempts: 1000,
            reconnectionDelay: 1000,            
            ...options,
        };
    }

    connect() {
        if (!this.url || !this.options) {
            console.error("Socket configuration is not initialized.");
            return;
        }
        if (this.socket) {
            console.warn("Socket already connected");
            return;
        }

        try {
            this.socket = io(this.url, this.options);
            console.log("connected socket data: ", this.socket)
            this.socket.on("connect", () => {
                console.info(`Socket connected: ${this.socket.id}`);
            });
           
            this.socket.on("disconnect", async (reason) => {
                console.warn(`Socket disconnected: ${reason}`);
                // Get new sToken and reconnect with it
                await store.dispatch(presenceStart());
                this.reconnect();
            });

            this.socket.on("connect_error", async (error) => {
                console.error(`Socket connection Error: ${error.message}`);
                // Get new sToken and reconnect with it
                await store.dispatch(presenceStart());
                this.reconnect();
            });

            this.socket.on("message", (data) => {
                console.log("Socket message received:", data);
            });

            this.socket.on("botMessage", (data) => {
                console.log("bot message received:", data);
                BotConversation().setBotConversation(data)
            });

            this.socket.on('live', (msg) => {
                if(msg?.entity === "answerContext") {
                    /*In answer suggestion, will receive thoughts of agents, need to append to the question*/                    
                        ChatInterface().agentThoughts(msg)                                        
                }
                if (msg?.entity === "thoughts") {
                    ChatInterface().agentThoughts(msg)    
                }
                if(msg?.entity === "answerChunk"){
                    ChatInterface().contentStreaming(msg)
                }
                if (msg?.entity === "boardName") {
                    /*update the name in the history board */
                    HistoryInterface().updateHistoryBoardNameonSocketEvent(msg?.data)
                }
                if (msg?.entity === 'reqFlow') {
                    ChatInterface().responseFlowGeneration(msg)
                }
            });
            this.socket.on("notification", (msg) => {
                Notification().notifyLatestNotification(msg)
            })
        } catch (err) {
            console.error('AI for Work exception in socket connection', err?.message);
            return null;
        }

    }

    reconnect() {
        if (this.socket) {
            this.socket.query= {
                ...(this.options?.query || {}),
                sToken: store.getState().global?.presenceStart?.data?.sToken,
                rnd: new Date().getTime(),
            }
            this.socket.reconnect();
        } else {
            console.error("Socket is not able to reconnect.");
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            console.info("Socket disconnected.");
            this.socket = null;
        }
    }

    emit(event, data) {
        if (this.socket) {
            this.socket.emit(event, data);
        } else {
            console.error("Socket is not connected.");
        }
    }

    on(event, callback) {
        if (this.socket) {
            this.socket.on(event, callback);
        } else {
            console.error("Socket is not connected.");
        }
    }

    off(event) {
        if (this.socket) {
            this.socket.off(event);
        } else {
            console.error("Socket is not connected.");
        }
    }
}

export const WebSocketService = new WebSocketClient()