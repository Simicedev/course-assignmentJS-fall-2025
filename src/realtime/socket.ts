import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket) return socket;
  const url = import.meta.env.DEV
    ? (import.meta.env.VITE_SOCKET_URL as string | undefined) ||
      // Set VITE_SOCKET_URL in .env if you run the TS server on a non-default port
      "http://localhost:" + (import.meta.env.VITE_SOCKET_PORT || "3000")
    : undefined; // same-origin in production
  socket = io(url, {
    autoConnect: true,
    // You can tune transports if needed; defaults are fine
    // transports: ["websocket", "polling"],
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
