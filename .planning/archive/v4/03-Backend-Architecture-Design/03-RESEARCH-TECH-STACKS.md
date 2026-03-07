# Tech Stack Comparison: Backend Runtime for MAXSIM

**Phase:** 03 — Backend Architecture Design
**Date:** 2026-03-02
**Purpose:** Evaluate Node.js/TypeScript, Python, Rust, and Go as the runtime for the persistent backend process that powers the MCP server, dashboard, and terminal management.

---

## 1. Evaluation Criteria

The backend runtime must satisfy the following needs:

| # | Criterion | Relevant Requirements |
|---|-----------|----------------------|
| C1 | Persistent process stability and resource footprint | MCP-01, DASH-06, DASH-07 |
| C2 | MCP SDK availability and maturity | MCP-01 through MCP-05 |
| C3 | WebSocket server ecosystem | DASH-02, DASH-03, DISC-07 |
| C4 | Terminal process management (pty) | DASH-03 |
| C5 | File watching capabilities | PERF-01 |
| C6 | Cross-platform support (Windows, macOS, Linux) | QUAL-01, GUARD-01 |
| C7 | Developer experience and team ramp-up cost | — |
| C8 | npm package delivery constraint | GUARD-01, GUARD-04 |

---

## 2. Node.js / TypeScript (Current Stack)

### C1: Process Stability and Footprint

Node.js long-lived processes are well-understood. V8's garbage collector handles memory adequately for daemon-scale workloads. Baseline memory for an idle Express + WebSocket server is approximately 30-50 MB. Event-loop-based concurrency handles the I/O-bound work (file watching, WebSocket messages, MCP JSON-RPC) without thread management overhead. The process model is single-threaded by default, which simplifies reasoning about state but requires care to avoid blocking the event loop with synchronous operations.

**Assessment:** Good. No concerns for the scale of a per-project daemon.

### C2: MCP SDK

MAXSIM already depends on `@modelcontextprotocol/sdk` (v1.27.1) in both `packages/cli` and `packages/dashboard`. The TypeScript SDK is one of two official first-party SDKs maintained by Anthropic (now under the Agentic AI Foundation). It supports stdio and HTTP+SSE transports. Streamable HTTP support was added in late 2025. The SDK sees frequent updates aligned with the MCP spec (latest: 2025-11-25). Monthly npm downloads are in the tens of millions.

**Assessment:** Excellent. Already integrated. First-party, mature, actively maintained.

### C3: WebSocket Ecosystem

The `ws` library (already a dependency) is the de facto WebSocket implementation for Node.js. It handles thousands of concurrent connections efficiently, supports permessage-deflate compression, and has been battle-tested across the ecosystem for over a decade. Socket.IO is available if higher-level abstractions (rooms, namespaces, auto-reconnect) are needed later.

**Assessment:** Excellent. Already in use.

### C4: Terminal Process Management (pty)

`node-pty` (v1.1.0, already a dependency) is maintained by Microsoft and used in VS Code's integrated terminal. It supports Windows (via conpty API on Windows 1809+), macOS, and Linux. It is the standard solution for spawning pseudo-terminals in Node.js. The main pain point is that `node-pty` is a native addon requiring compilation — but prebuilt binaries are distributed for common platforms, and MAXSIM already handles this.

**Assessment:** Good. Already integrated. Native addon compilation is a known friction point but is manageable.

### C5: File Watching

`chokidar` (v4, already a dependency) is the dominant file-watching library for Node.js, used in approximately 30 million repositories. Chokidar v5 (November 2025) became ESM-only with Node.js v20+ minimum. It uses `fs.watch` under the hood (no polling), keeping CPU usage low. For watching a single `.planning/` directory tree, resource usage is negligible.

**Assessment:** Excellent. Already integrated, proven at scale.

### C6: Cross-Platform Support

Node.js runs natively on Windows, macOS, and Linux. The current codebase already handles cross-platform concerns. MAXSIM requires Node.js >= 22.0.0 (per `engines` in package.json), which is available on all three platforms.

**Assessment:** Excellent. No additional work needed.

### C7: Developer Experience

The entire MAXSIM codebase is TypeScript. All existing modules (`core.ts`, `state.ts`, `phase.ts`, `cli.ts`, etc.) are TypeScript. The build pipeline uses tsdown. Tests use Vitest. Zero ramp-up cost — the team is already productive.

**Assessment:** Excellent. Zero context switch.

### C8: npm Delivery

MAXSIM ships as `maxsimcli` on npm via `npx maxsimcli@latest`. A Node.js/TypeScript backend bundles directly into the existing `dist/` output. No additional binaries, no platform-specific packages, no postinstall downloads. The only native dependency (`node-pty`) already ships prebuilds.

**Assessment:** Excellent. No delivery changes needed.

---

## 3. Python

### C1: Process Stability and Footprint

Python long-lived daemons are common (Celery, Gunicorn, etc.). asyncio provides event-loop concurrency similar to Node.js. Memory footprint is comparable (40-70 MB baseline for an async web server). The GIL limits true parallelism for CPU-bound work, but this backend is I/O-bound so the GIL is not a concern. Process management is straightforward with systemd/launchd or supervisor patterns.

**Assessment:** Good. No concerns at this scale.

### C2: MCP SDK

The official Python MCP SDK is the other first-party SDK alongside TypeScript. FastMCP has emerged as a popular high-level wrapper. The Python SDK supports stdio, HTTP+SSE, and Streamable HTTP transports. It is actively maintained and tracks the MCP spec closely.

**Assessment:** Good. First-party SDK exists, but MAXSIM would need to rewrite all MCP integration from scratch.

### C3: WebSocket Ecosystem

`websockets` and `aiohttp` provide mature WebSocket server implementations. FastAPI includes WebSocket support. The ecosystem is mature and well-documented.

**Assessment:** Good. Capable ecosystem, but requires full reimplementation.

### C4: Terminal Process Management (pty)

Python's `pty` module is Unix-only (part of the standard library). For cross-platform pty support including Windows, options are limited: `winpty` bindings exist but are less maintained than `node-pty`. The `pexpect` library handles Unix well but has limited Windows support. There is no direct equivalent to `node-pty`'s quality and maintenance level.

**Assessment:** Weak. Cross-platform pty support is significantly worse than Node.js. Windows support is a concern.

### C5: File Watching

`watchdog` is the primary file-watching library for Python. It is cross-platform and uses native OS APIs (inotify, FSEvents, ReadDirectoryChangesW). It is mature and capable.

**Assessment:** Good. Capable, but requires reimplementation.

### C6: Cross-Platform Support

Python runs on all three platforms. However, Python version management is notoriously difficult for end users — users may have Python 2, Python 3.8, or no Python at all. Requiring a specific Python version (3.11+) adds friction to the install flow. Virtual environments add complexity.

**Assessment:** Problematic. Python availability and version management are friction points for end users.

### C7: Developer Experience

The current team works entirely in TypeScript. Switching to Python means rewriting all core modules, learning a new async model (asyncio vs Node.js event loop), different testing frameworks (pytest vs Vitest), different package management (pip/poetry vs npm). The ramp-up cost is substantial.

**Assessment:** Poor. Significant ramp-up cost and full rewrite required.

### C8: npm Delivery

MAXSIM ships via `npx maxsimcli@latest`. A Python backend would require one of:
- Bundling a Python runtime in the npm package (100+ MB, impractical)
- Requiring users to have Python installed (breaks the zero-dependency install promise)
- Using a tool like PyInstaller to create standalone executables per platform (adds 20-40 MB per platform to the tarball)

All options degrade the install experience significantly.

**Assessment:** Poor. Fundamentally conflicts with the npm delivery model (GUARD-01, GUARD-04).

---

## 4. Rust

### C1: Process Stability and Footprint

Rust excels here. No garbage collector, deterministic memory management, minimal runtime overhead. A Rust daemon would use 5-15 MB baseline memory. Process stability is excellent — no GC pauses, no memory leaks (unless explicitly introduced via `unsafe`).

**Assessment:** Excellent. Best-in-class resource footprint.

### C2: MCP SDK

An official Rust SDK exists under the `modelcontextprotocol` GitHub organization. It implements the MCP protocol version 2025-11-25 with backward compatibility. However, the Rust SDK is newer than the TypeScript and Python SDKs and has a smaller user base. Ecosystem maturity is lower — fewer examples, fewer battle-tested deployments, and potential for API changes.

**Assessment:** Adequate. Official SDK exists but is less mature than TypeScript/Python.

### C3: WebSocket Ecosystem

`tokio-tungstenite` and `axum` provide high-performance WebSocket support. The async Rust ecosystem (tokio) is mature and performant.

**Assessment:** Good. Capable ecosystem, but steep learning curve.

### C4: Terminal Process Management (pty)

The `portable-pty` crate (used by wezterm) provides cross-platform pty support. It is less widely used than `node-pty` but is functional on Windows, macOS, and Linux.

**Assessment:** Adequate. Less proven than node-pty but functional.

### C5: File Watching

The `notify` crate provides cross-platform file watching using native OS APIs. It is mature and efficient.

**Assessment:** Good. Capable and efficient.

### C6: Cross-Platform Support

Rust compiles to native binaries on all three platforms. Cross-compilation is well-supported via `cross` or platform-specific toolchains. However, the binaries must be compiled separately for each target (x86_64/arm64 for macOS, x86_64/arm64 for Linux, x86_64/arm64 for Windows = up to 6 binaries).

**Assessment:** Good technically, but distribution adds complexity (see C8).

### C7: Developer Experience

The current team writes TypeScript. Rust has a notoriously steep learning curve (ownership, lifetimes, borrow checker). Rewriting the entire backend in Rust would take significantly longer than maintaining it in TypeScript. Debugging async Rust is harder than debugging async Node.js. The productivity loss during the transition would be substantial.

**Assessment:** Poor. Steep learning curve, full rewrite, significant productivity loss.

### C8: npm Delivery

Shipping Rust binaries via npm requires one of two approaches:

1. **Platform-specific optional dependencies:** Publish separate npm packages per platform (e.g., `@maxsim/backend-darwin-arm64`, `@maxsim/backend-win32-x64`). The main package declares them as `optionalDependencies` with `os` and `cpu` fields. Package managers install only the matching platform binary. This is the approach used by `@sentry/cli`, `esbuild`, and `lightningcss`. It works but adds 6-8 packages to maintain and increases the total published package size by 30-50 MB across all platforms.

2. **Postinstall download:** A postinstall script downloads the correct binary from GitHub releases. This is fragile (network failures, corporate firewalls, CI environments without internet).

Both approaches add significant complexity to the build and release pipeline. The current pipeline (tsdown + copy-assets) would need to be extended with a cross-compilation step and multi-package publishing.

**Assessment:** Feasible but adds major delivery complexity. Conflicts with the simplicity of the current npm delivery (GUARD-01, GUARD-04).

---

## 5. Go

### C1: Process Stability and Footprint

Go produces statically linked binaries with a small runtime. Memory footprint is low (10-25 MB baseline). Goroutines provide lightweight concurrency. GC pauses are minimal (sub-millisecond in recent versions). Long-lived Go processes are common (Docker, Kubernetes, Prometheus).

**Assessment:** Excellent. Very good resource footprint and stability.

### C2: MCP SDK

An official Go SDK exists, maintained in collaboration with Google under the `modelcontextprotocol` organization. It reached stable status around August 2025. Prior to the official SDK, the community-maintained `mcp-go` library was widely used (400+ importing packages). The official SDK provides idiomatic Go APIs aligned with the latest MCP spec.

**Assessment:** Good. Official SDK exists and is stable, though younger than TypeScript/Python.

### C3: WebSocket Ecosystem

`gorilla/websocket` is the dominant WebSocket library for Go (now archived but stable; `coder/websocket` is the successor). The `net/http` standard library provides a solid HTTP foundation. The ecosystem is mature.

**Assessment:** Good. Mature ecosystem.

### C4: Terminal Process Management (pty)

The `creack/pty` package provides Unix pty support. Windows conpty support exists via `ActiveState/termtest/conpty` or `UserExistsError/conpty`. Cross-platform pty in Go is less unified than `node-pty` — you often need separate implementations for Unix and Windows.

**Assessment:** Adequate. Less unified cross-platform story than node-pty.

### C5: File Watching

The `fsnotify` package provides cross-platform file watching. It is mature and widely used (13k+ GitHub stars). It uses inotify (Linux), FSEvents (macOS), and ReadDirectoryChangesW (Windows).

**Assessment:** Good. Mature and capable.

### C6: Cross-Platform Support

Go cross-compiles trivially (`GOOS=windows GOARCH=amd64 go build`). A single build machine can produce binaries for all platforms. However, CGo dependencies (if any) complicate cross-compilation.

**Assessment:** Good technically, but same distribution concerns as Rust (see C8).

### C7: Developer Experience

The current team writes TypeScript. Go is significantly easier to learn than Rust, but still requires rewriting all core modules. Go's type system is simpler (no generics until 1.18, still limited compared to TypeScript). Error handling patterns differ significantly. Testing is done with `go test`. The ramp-up cost is moderate.

**Assessment:** Moderate. Easier than Rust, but still a full rewrite with ramp-up time.

### C8: npm Delivery

Same challenges as Rust: prebuilt binaries must be distributed per platform. Go produces slightly larger binaries than Rust (typically 10-20 MB per platform vs 5-15 MB for Rust). The same two distribution strategies apply (optional dependencies or postinstall download), with the same complexity trade-offs.

**Assessment:** Feasible but adds major delivery complexity. Same concerns as Rust regarding GUARD-01 and GUARD-04.

---

## 6. Comparison Matrix

| Criterion | Node.js/TS | Python | Rust | Go |
|-----------|:---:|:---:|:---:|:---:|
| C1: Process stability / footprint | Good | Good | Excellent | Excellent |
| C2: MCP SDK maturity | Excellent | Good | Adequate | Good |
| C3: WebSocket ecosystem | Excellent | Good | Good | Good |
| C4: Terminal pty (cross-platform) | Good | Weak | Adequate | Adequate |
| C5: File watching | Excellent | Good | Good | Good |
| C6: Cross-platform support | Excellent | Problematic | Good | Good |
| C7: Developer experience / ramp-up | Excellent | Poor | Poor | Moderate |
| C8: npm delivery constraint | Excellent | Poor | Feasible | Feasible |
| **Overall** | **Strong** | **Weak** | **Mixed** | **Mixed** |

---

## 7. Recommendation

**Stay with Node.js/TypeScript.**

The decision is clear-cut when the npm delivery constraint (C8) is weighted appropriately. MAXSIM's core value proposition depends on `npx maxsimcli@latest` working instantly, without requiring users to install additional toolchains, download platform-specific binaries, or manage native dependencies beyond what npm already handles. This is not a nice-to-have — it is codified in GUARD-01 ("MUST NOT break `npx maxsimcli@latest` install flow") and GUARD-04 ("Every change must ship in the npm package").

### Why Rust and Go are not viable for this project

Both languages produce superior binaries in isolation (lower memory, faster startup). However, the delivery mechanism invalidates those advantages:

- Shipping 6 platform binaries (3 OS x 2 architectures) via npm optional dependencies adds 30-50 MB of total package weight and 6-8 additional packages to maintain in the release pipeline.
- The build pipeline would need cross-compilation steps (GitHub Actions matrix builds) that do not exist today.
- Any native addon issue on an uncommon platform (e.g., Alpine Linux, Windows ARM64) becomes a binary distribution bug rather than a compilation bug — harder to diagnose and fix.
- The complexity cost provides no user-visible benefit. The backend is a per-project daemon handling WebSocket messages and file I/O — Node.js handles this workload with no performance concerns.

### Why Python is not viable

Python fails on two critical criteria: cross-platform pty support (C4) is weak, and npm delivery (C8) is fundamentally incompatible. Requiring users to have Python installed violates the zero-dependency install promise.

### Why Node.js/TypeScript is the right choice

- **Zero migration cost.** All existing modules, types, tests, and build tooling carry forward unchanged.
- **All critical libraries are already dependencies.** `@modelcontextprotocol/sdk`, `ws`, `node-pty`, `chokidar`, `express` — the backend can be built from the existing dependency tree.
- **The MCP SDK is first-party and mature.** MAXSIM already integrates it. No SDK migration required.
- **The delivery mechanism is unchanged.** `tsdown` bundles the backend into `dist/`, `copy-assets.cjs` packages it, `npm publish` ships it. No new build steps, no platform matrices, no binary hosting.
- **Single language across the entire stack.** CLI, core logic, hooks, dashboard server, dashboard client, and the new backend process — all TypeScript. One language, one type system, one test framework, one build tool.

The only genuine weakness of Node.js for this role is memory footprint (30-50 MB vs 5-15 MB for Rust). For a per-project daemon on a developer's workstation, this difference is immaterial.

### Suggested architecture direction

Extend the existing Express + WebSocket server in `packages/dashboard/server.ts` into the persistent backend process. It already handles:
- Express HTTP server
- WebSocket connections (`ws`)
- File watching (`chokidar`)
- Terminal management (`node-pty`)
- MCP integration (`@modelcontextprotocol/sdk`)

The backend architecture phase should focus on restructuring this into a standalone daemon that starts independently of the dashboard UI, with the dashboard becoming an optional frontend that connects to it. This aligns with DASH-04 ("Dashboard is an optional UI layer on top of the MAXSIM Core Server").

---

## Sources

- [Anthropic MCP SDK TypeScript](https://github.com/anthropics/anthropic-sdk-typescript)
- [MCP TypeScript vs Python Comparison](https://skywork.ai/blog/mcp-server-typescript-vs-mcp-server-python-2025-comparison/)
- [Official Rust SDK for MCP](https://github.com/modelcontextprotocol/rust-sdk)
- [Official Go SDK for MCP](https://github.com/modelcontextprotocol/go-sdk)
- [One Year of MCP](https://www.ajeetraina.com/one-year-of-model-context-protocol-from-experiment-to-industry-standard/)
- [node-pty (Microsoft)](https://github.com/microsoft/node-pty)
- [chokidar](https://github.com/paulmillr/chokidar)
- [Publishing Binaries on npm (Sentry)](https://sentry.engineering/blog/publishing-binaries-on-npm)
- [Distributing Rust Binaries on npm](https://dev.to/kennethlarsen/how-to-distribute-a-rust-binary-on-npm-75n)
- [Distributing Go Binaries with npm](https://www.gitpush.blog/blog/2)
- [MCP SDKs Directory](https://modelcontextprotocol.io/docs/sdk)
