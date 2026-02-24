import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "node:http";

let clientCount = 0;

/**
 * Create a WebSocket server with noServer mode.
 * Upgrade handling is done in server.ts to coexist with Next.js HMR.
 */
export function createWSS(): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });

  wss.on("connection", (ws) => {
    clientCount++;
    console.error(`[ws] Client connected (${clientCount} total)`);

    ws.on("close", () => {
      clientCount--;
      console.error(`[ws] Client disconnected (${clientCount} total)`);
    });

    ws.on("error", (err) => {
      console.error("[ws] Client error:", err.message);
    });

    // Send initial connected event
    ws.send(
      JSON.stringify({
        type: "connected",
        timestamp: Date.now(),
      })
    );
  });

  return wss;
}

/**
 * Broadcast a JSON message to all connected WebSocket clients.
 */
export function broadcast(
  wss: WebSocketServer,
  message: Record<string, unknown>
): void {
  const data = JSON.stringify(message);
  let sent = 0;

  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
      sent++;
    }
  }

  if (sent > 0) {
    console.error(`[ws] Broadcast to ${sent} client(s)`);
  }
}
