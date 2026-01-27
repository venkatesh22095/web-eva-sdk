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
      reconnection: false,  // Disable socket.io auto-reconnection - we handle it manually
      autoConnect: false,
      ...options,
    };

    /* Network restore handling */
    window.addEventListener("online", () => {
      console.info("Network restored → reconnecting socket");
      // Small delay to ensure network is stable
      setTimeout(() => {
        this.reconnect();
      }, 1000);
    });

    window.addEventListener("offline", () => {
      console.warn("Network lost → disconnecting socket");
      if (this.socket) {
        this.socket.disconnect();
      }
    });

    /* Handle device wake from sleep - visibility change is more reliable than online/offline */
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        console.info("Page visible → checking socket connection");
        // Check if socket is disconnected and reconnect with fresh token
        if (this.socket && !this.socket.connected && !this.isManuallyDisconnected) {
          console.info("Socket disconnected after wake → reconnecting");
          setTimeout(() => {
            this.reconnect();
          }, 500);
        }
      }
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

    // Ensure sToken is available - fetch if not present
    let sToken = store.getState().global?.presenceStart?.data?.sToken;
    if (!sToken) {
      console.info("sToken not found, fetching via presenceStart...");
      await store.dispatch(presenceStart());
      sToken = store.getState().global?.presenceStart?.data?.sToken;
    }

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
      // Use this.options.query to preserve original userid, channels, etc.
      this.socket.io.opts.query = {
        ...(this.options.query || {}),
        sToken,
        rnd: new Date().getTime(),
      };
    }

    this.socket.connect();
  }

  /* -------------------- RECONNECT -------------------- */
  async reconnect() {
    if (this.isManuallyDisconnected) return;
    if (!navigator.onLine) return;
    if (this.isRefreshingToken) return; // Prevent multiple simultaneous reconnection attempts

    if (!this.socket) {
      await this.connect();
      return;
    }

    if (this.socket.connected) return;

    console.info("Reconnecting socket...");

    this.isRefreshingToken = true;

    try {
      // Always fetch fresh sToken on reconnect (especially important after sleep)
      await store.dispatch(presenceStart());

      const sToken = store.getState().global?.presenceStart?.data?.sToken;
      if (!sToken) {
        console.error("Failed to get sToken for reconnection");
        return;
      }

      // Use this.options.query to preserve original userid, channels, etc.
      this.socket.io.opts.query = {
        ...(this.options.query || {}),
        sToken,
        rnd: new Date().getTime(),
      };

      this.socket.connect();
    } finally {
      this.isRefreshingToken = false;
    }
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

        // Use this.options.query to preserve original userid, channels, etc.
        this.socket.io.opts.query = {
          ...(this.options.query || {}),
          sToken: store.getState().global?.presenceStart?.data?.sToken,
          rnd: new Date().getTime(),
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