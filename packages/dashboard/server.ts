import { createServer, type IncomingMessage } from "node:http";
import { parse } from "node:url";
import type { Duplex } from "node:stream";
import next from "next";
import detectPort from "detect-port";
import open from "open";
import { createWSS } from "./lib/websocket.js";
import { setupWatcher } from "./lib/watcher.js";
import type { FSWatcher } from "chokidar";

const dev = process.env.NODE_ENV !== "production";
const projectCwd = process.env.MAXSIM_PROJECT_CWD || process.cwd();

const app = next({ dev });
const handle = app.getRequestHandler();

async function main(): Promise<void> {
  await app.prepare();

  const upgradeHandler = app.getUpgradeHandler();
  const wss = createWSS();

  // Create HTTP server that delegates to Next.js for normal requests
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url || "/", true);
    handle(req, res, parsedUrl);
  });

  // Handle WebSocket upgrade requests
  server.on(
    "upgrade",
    (req: IncomingMessage, socket: Duplex, head: Buffer) => {
      const { pathname } = parse(req.url || "/", true);

      if (pathname === "/api/ws") {
        // Dashboard WebSocket connection
        wss.handleUpgrade(req, socket, head, (ws) => {
          wss.emit("connection", ws, req);
        });
      } else {
        // Delegate all other upgrades (e.g. /_next/webpack-hmr) to Next.js
        upgradeHandler(req, socket, head);
      }
    }
  );

  // Start file watcher
  let watcher: FSWatcher | undefined;
  try {
    watcher = setupWatcher(projectCwd, wss);
  } catch (err) {
    console.error(
      "[server] Failed to start file watcher:",
      (err as Error).message
    );
  }

  // Auto-detect free port starting from 3333
  const port = await detectPort(3333);
  const url = `http://localhost:${port}`;

  server.listen(port, () => {
    console.error(`Dashboard ready at ${url}`);

    // Auto-open browser
    open(url).catch(() => {
      // Silently ignore if browser open fails (e.g. headless environment)
    });
  });

  // Graceful shutdown
  function shutdown(): void {
    console.error("\n[server] Shutting down...");

    if (watcher) {
      watcher.close().catch(() => {});
    }

    wss.close(() => {
      server.close(() => {
        process.exit(0);
      });
    });

    // Force exit after 5 seconds if graceful shutdown hangs
    setTimeout(() => {
      console.error("[server] Forced exit after timeout");
      process.exit(1);
    }, 5000);
  }

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("[server] Fatal error:", err);
  process.exit(1);
});
