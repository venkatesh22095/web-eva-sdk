import io from "socket.io-client";
import { ChatInterface } from "../chat";
import BotConversation from "../chat/botAgent/getBotConversation";
import Notification from "../notifications/notification";
import { presenceStart } from "../redux/actions/global.action";
import store from "../redux/store";
import { HistoryInterface } from "../history";

class WebSocketClient {
  socket = null;
  url = null;
  options = null;
  listenersRegistered = false;
  isRefreshingToken = false;
  isManuallyDisconnected = false;

  /* -------------------- INIT -------------------- */
  initialize({ url, options = {} }) {
    this.url = url;
    this.options = {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      autoConnect: false,
      ...options,
    };

    /* Network restore handling */
    window.addEventListener("online", () => {
      console.info("Network restored → reconnecting socket");
    //  this.reconnect();
    });

    window.addEventListener("offline", () => {
      console.warn("Network lost → disconnecting socket");
      this.socket?.disconnect();
    });
  }

  /* -------------------- CONNECT -------------------- */
  async connect() {
    if (!this.url || !this.options) {
      console.error("Socket not initialized");
      return;
    }

    if (!navigator.onLine) {
      console.warn("Offline, waiting for network...");
      return;
    }

    this.isManuallyDisconnected = false;

    // await store.dispatch(presenceStart());
    const sToken = store.getState().global?.presenceStart?.data?.sToken;

    if (!this.socket) {
      this.socket = io(this.url, {
        ...this.options,
        query: {
          ...(this.options.query || {}),
          sToken,
        },
      });

      this.registerCoreListeners();
      this.registerAppListeners();
    } else {
      this.socket.io.opts.query = {
        ...(this.socket.io.opts.query || {}),
        sToken,
      };
    }

    this.socket.connect();
  }

  /* -------------------- RECONNECT -------------------- */
  async reconnect() {
    if (this.isManuallyDisconnected) return;
    if (!navigator.onLine) return;

    if (!this.socket) {
      await this.connect();
      return;
    }

    if (this.socket.connected) return;

    console.info("Reconnecting socket...");

    await store.dispatch(presenceStart());

    this.socket.io.opts.query = {
      ...(this.socket.io.opts.query || {}),
      sToken: store.getState().global?.presenceStart?.data?.sToken,
    };

    this.socket.connect();
  }

  /* -------------------- CORE LISTENERS -------------------- */
  registerCoreListeners() {
    this.socket.on("connect", () => {
      console.info("Socket connected:", this.socket.id);
    });

    this.socket.on("disconnect", (reason) => {
      console.warn("Socket disconnected:", reason);
    });

    this.socket.on("connect_error", async (err) => {
      console.error("Socket connect error:", err.message);

      if (!navigator.onLine) return;
      if (this.isRefreshingToken) return;

      this.isRefreshingToken = true;

      try {
        await store.dispatch(presenceStart());

        this.socket.io.opts.query = {
          ...(this.socket.io.opts.query || {}),
          sToken: store.getState().global?.presenceStart?.data?.sToken,
        };

        this.socket.connect();
      } finally {
        this.isRefreshingToken = false;
      }
    });

    /* Debug helpers (optional) */
    this.socket.io.on("reconnect_attempt", () => {
      console.log("Reconnect attempt...");
    });

    this.socket.io.on("reconnect_failed", () => {
      console.log("Reconnect failed");
    });
  }

  /* -------------------- APP LISTENERS -------------------- */
  registerAppListeners() {
    if (this.listenersRegistered) return;
    this.listenersRegistered = true;

    this.socket.on("message", (data) => {
      console.log("Socket message:", data);
    });

    this.socket.on("botMessage", (data) => {
      BotConversation().setBotConversation(data);
    });

    this.socket.on("live", (msg) => {
      if (msg?.entity === "answerContext" || msg?.entity === "thoughts") {
        ChatInterface().agentThoughts(msg);
      }

      if (msg?.entity === "answerChunk") {
        ChatInterface().contentStreaming(msg);
      }

      if (msg?.entity === "boardName") {
        HistoryInterface().updateHistoryBoardNameonSocketEvent(msg?.data);
      }

      if (msg?.entity === "reqFlow") {
        ChatInterface().responseFlowGeneration(msg);
      }
    });

    this.socket.on("notification", (msg) => {
      Notification().notifyLatestNotification(msg);
    });
  }

  /* -------------------- EMIT -------------------- */
  emit(event, data) {
    if (!this.socket?.connected) return;
    this.socket.emit(event, data);
  }

  /* -------------------- DISCONNECT -------------------- */
  disconnect() {
    if (!this.socket) return;

    this.isManuallyDisconnected = true;

    this.socket.removeAllListeners();
    this.socket.disconnect();
    this.socket.close();

    this.socket = null;
    this.listenersRegistered = false;
    this.isRefreshingToken = false;

    console.info("Socket disconnected manually");
  }
}

export const WebSocketService = new WebSocketClient();