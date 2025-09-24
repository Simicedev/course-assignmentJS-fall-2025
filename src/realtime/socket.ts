import { io, Socket } from "socket.io-client";
import { VITE_SOCKET_URL as SOCKET_BASE_URL } from "../services/utils";

let socket: Socket | null = null;


function buildSocketUrlFromUtils(): string | undefined {
  const url = (SOCKET_BASE_URL || "").trim();
  return url ? url : undefined;
}

export function getSocket(): Socket {
  if (socket) return socket;
  const enable =
    (
      import.meta.env.VITE_ENABLE_SOCKET as string | undefined
    )?.toLowerCase() !== "false";
  const url = buildSocketUrlFromUtils();
  if (!enable || !url) {
    console.info(
      "[socket] disabled (enable via VITE_ENABLE_SOCKET!=false and set VITE_SOCKET_URL in utils)."
    );
    // Create a no-op shim to avoid crashes when imports call on/emit
    const avoidCrash: any = {
      on: () => avoidCrash,
      once: () => avoidCrash,
      emit: () => avoidCrash,
    };
    return (socket = avoidCrash as unknown as Socket);
  }
  console.info("[socket] initializing with URL:", url);
  socket = io(url, {
    autoConnect: true,

  });

  // Attach useful lifecycle logging remove clg later
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
