import { createServer, type IncomingMessage } from "node:http";
import { parse } from "node:url";
import * as path from "node:path";
import * as fs from "node:fs";
import type { Duplex } from "node:stream";
import next from "next";
import detectPort from "detect-port";
import open from "open";
import { createWSS } from "./lib/websocket.js";
import { setupWatcher } from "./lib/watcher.js";
import type { FSWatcher } from "chokidar";

const dev = process.env.NODE_ENV !== "production";
const projectCwd = process.env.MAXSIM_PROJECT_CWD || process.cwd();

// Detect standalone mode: packages/dashboard/.next/ exists relative to this file
const standaloneDir = path.join(__dirname, "packages", "dashboard");
const isStandalone = !dev && fs.existsSync(path.join(standaloneDir, ".next", "required-server-files.json"));

let app: ReturnType<typeof next>;

if (isStandalone) {
  // Standalone mode: load embedded config to bypass webpack config resolution.
  // The traced standalone output only includes production server files, not webpack.
  const serverFiles = JSON.parse(
    fs.readFileSync(path.join(standaloneDir, ".next", "required-server-files.json"), "utf8")
  );
  process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify(serverFiles.config);

  // Use NextServer directly — next() with standalone config returns undefined
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const NextServer = require("next/dist/server/next-server").default;
  app = new NextServer({
    hostname: "localhost",
    port: 0,
    dir: standaloneDir,
    dev: false,
    customServer: true,
    conf: serverFiles.config,
  });
} else {
  app = next({ dev });
}

const handle = app.getRequestHandler();

async function main(): Promise<void> {
  await app.prepare();

  const upgradeHandler = typeof app.getUpgradeHandler === "function"
    ? app.getUpgradeHandler()
    : undefined;
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
      } else if (upgradeHandler) {
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
