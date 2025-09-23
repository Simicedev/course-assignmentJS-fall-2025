import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

/**
 * Internal helper to build the dev URL. Prefers explicit VITE_SOCKET_URL, then falls back to port.
 */
function buildDevSocketUrl(): string | undefined {
  const explicit = import.meta.env.VITE_SOCKET_URL as string | undefined;
  if (explicit) return explicit.trim();
  const port =
    (import.meta.env.VITE_SOCKET_PORT as string | undefined) || "3000";
  return `http://localhost:${port}`;
}

/**
 * Lazily create (or return existing) Socket.IO client instance.
 * In production we rely on same-origin (undefined URL lets client infer current origin).
 */
export function getSocket(): Socket {
  if (socket) return socket;
  const url = import.meta.env.DEV ? buildDevSocketUrl() : undefined;
  if (import.meta.env.DEV) {
    console.info("[socket] initializing in DEV with URL:", url);
  }
  socket = io(url, {
    autoConnect: true,
    // You could explicitly set transports: ["websocket"] if you want to skip polling.
  });

  // Attach useful lifecycle logging (can be removed later or guarded by env flag)
  socket.on("connect", () => {
    console.log("[socket] connected", socket?.id);
  });
  socket.on("disconnect", (reason) => {
    console.warn("[socket] disconnected", reason);
  });
  socket.on("connect_error", (err) => {
    console.warn("[socket] connect_error:", err.message);
  });
  socket.on("reconnect_attempt", (attempt) => {
    console.log("[socket] reconnect attempt", attempt);
  });
  socket.on("reconnect_failed", () => {
    console.error("[socket] reconnect failed");
  });
  return socket;
}

export function onOnce(event: string, handler: (...args: any[]) => void) {
  getSocket().once(event, handler);
}

export function on(event: string, handler: (...args: any[]) => void) {
  getSocket().on(event, handler);
}

export function emit(event: string, payload?: any) {
  getSocket().emit(event, payload);
}

/** Explicit opt-in function if you want to initialize early */
export function ensureSocket() {
  getSocket();
}
