# Phase 14: Dashboard npm Delivery - Research

**Researched:** 2026-02-24
**Domain:** Next.js standalone builds, npm packaging, monorepo asset bundling
**Confidence:** HIGH

## Summary

This phase ships the existing `@maxsim/dashboard` as part of the `maxsimcli` npm package so that `npx maxsimcli dashboard` works for end users without needing to clone the monorepo. The core challenge is that the dashboard uses a custom `server.ts` with WebSocket (ws) and file-watching (chokidar) capabilities that Next.js standalone mode does not trace or bundle.

The recommended approach is a **two-step build**: (1) `next build` with `output: "standalone"` to produce the self-contained Next.js app in `.next/standalone/`, (2) bundle `server.ts` via tsdown into a single `server.js` that replaces the generated minimal `server.js`, with `next` marked as external so it loads from the standalone-traced `node_modules`. The bundled server + standalone output + static files are then copied into `dist/assets/dashboard/` by the existing `copy-assets.cjs` script, and `install.ts` copies them to `.claude/dashboard/` during install.

**Primary recommendation:** Bundle the custom server with tsdown (already used in the project), use `output: "standalone"` conditionally via `STANDALONE_BUILD` env var to avoid Windows EPERM errors during development, and set `outputFileTracingRoot` to the monorepo root so `@maxsim/core` gets traced correctly.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### 1. Install Behavior
- **Always install**: Dashboard files are copied automatically during every install (global and local). No opt-in flag, no interactive prompt.
- **Both global and local**: Global installs put dashboard in `~/.claude/dashboard/`. Local installs put dashboard in `.claude/dashboard/` (project-scoped). Global install requires user to specify project path at launch time.
- **Always overwrite on upgrade**: Every install overwrites existing dashboard files with the latest version. No version-check logic.
- **Silent install**: No special callout about dashboard size. Treated the same as templates and hooks in the install output.

#### 2. Launch Error States
- **No install detected**: If `.claude/dashboard/` doesn't exist when user runs `npx maxsimcli dashboard`, auto-install the dashboard files first, then launch. Zero-friction.
- **No .planning/ directory**: Dashboard launches with empty/placeholder state. Shows "No project initialized" message. File watcher activates if `.planning/` appears later.
- **Already running**: Detect existing dashboard instance on port range 3333-3343. If found, print its URL and open it in the browser.
- **Auto-open browser**: Always auto-open browser on launch. Silent fail in headless environments.

#### 3. dashboard.json Config
- **Minimal scope**: Config contains only `{ "projectCwd": "/path/to/project" }`. No port preference, no auto-open toggle, no theme config.
- **Location**: `.claude/dashboard.json` (next to the `dashboard/` directory, not inside it -- survives overwrites on upgrade).

### Claude's Discretion
None captured in CONTEXT.md -- all decisions are locked.

### Deferred Ideas (OUT OF SCOPE)
None captured.

### Technical Constraints (from Phase 13)
- Standalone output was commented out due to Windows EPERM symlink errors -- must be re-enabled with env-var guard for dev vs production.
- Custom server.ts uses `next()` API directly -- standalone mode changes this to `require('.next/standalone/server.js')` pattern. Server must be reworked for standalone.
- chokidar v4 (not v5), detect-port, open, ws must all be traced by standalone or bundled separately.
- `.next/static/` must be manually copied into `.next/standalone/.next/static/` (Next.js requirement).
</user_constraints>

## Standard Stack

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | ^15 | Dashboard framework | Already used in Phase 13; provides App Router, API routes, SSR |
| tsdown | 0.20.x | Bundle custom server.ts | Already used across project (CLI, hooks, core); Phase 09 decision |
| chokidar | ^4 | File watching | Already installed in dashboard; Phase 13 decision (not v5) |
| ws | ^8 | WebSocket server | Already installed in dashboard; used for real-time updates |
| detect-port | ^2 | Port detection | Already installed in dashboard |
| open | ^10 | Browser auto-open | Already installed in dashboard |

### No New Dependencies Needed
The entire standard stack is already present. Phase 14 is a build/packaging phase, not a feature phase. No new npm packages are required.

## Architecture Patterns

### Recommended Build Architecture

```
packages/dashboard/
  next.config.mjs            # output: "standalone" (env-var guarded)
  server.ts                  # Custom server (modified for standalone)
  tsdown.config.server.ts    # Server bundling config
  .next/
    standalone/              # Next.js standalone output (production only)
      server.js              # REPLACED by our bundled server.js
      .next/
        static/              # Copied from .next/static/
      node_modules/          # Minimal traced deps (next, react, etc.)

packages/cli/
  dist/assets/dashboard/     # Standalone build copied here by copy-assets.cjs
    server.js                # Our bundled custom server
    .next/                   # The standalone .next directory
    node_modules/            # Traced node_modules from standalone
    public/                  # If any static public assets exist
```

### Pattern 1: Env-Var Guarded Standalone Output

**What:** Toggle `output: "standalone"` via environment variable so development uses default mode (no EPERM errors on Windows) and production CI builds use standalone.

**When to use:** Always for this project due to documented Windows EPERM symlink errors with pnpm standalone on Windows.

**Example:**
```javascript
// next.config.mjs
// Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/output
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only enable standalone in CI/production builds
  ...(process.env.STANDALONE_BUILD === 'true' ? {
    output: "standalone",
    outputFileTracingRoot: path.join(__dirname, '../../'),
  } : {}),
  reactStrictMode: true,
  transpilePackages: ["@maxsim/core"],
};

export default nextConfig;
```

**Why `outputFileTracingRoot`:** In a monorepo, Next.js traces from the project directory by default. Since `@maxsim/core` lives at `../../packages/core/`, the tracing root must be set to the monorepo root so the standalone output includes `@maxsim/core` files in its traced `node_modules`.

### Pattern 2: Bundled Custom Server for Standalone

**What:** Bundle `server.ts` with tsdown so that all custom dependencies (ws, chokidar, detect-port, open) are inlined into a single `server.js` file. Mark `next` as external since it is traced by standalone mode.

**When to use:** Required because Next.js standalone mode does NOT trace custom server dependencies.

**Example:**
```typescript
// tsdown.config.server.ts (or inline in package.json build:server script)
import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: { server: 'server.ts' },
  format: 'esm',
  platform: 'node',
  target: 'es2022',
  external: ['next'],  // next is in standalone node_modules
  noExternal: ['ws', 'chokidar', 'detect-port', 'open'],
  // Bundle websocket.ts, watcher.ts, etc. inline
});
```

**Critical detail:** The current server.ts calls `next({ dev })` which creates the Next.js app. In standalone mode, this pattern still works -- the bundled server imports `next` from the standalone-traced node_modules. The server.ts does NOT need to be rewritten to use `require('.next/standalone/server.js')` because that pattern is only for the minimal server.js that Next.js generates. Our custom server replaces that minimal server.js entirely.

### Pattern 3: Post-Build Static Copy

**What:** After `next build`, copy `.next/static/` into `.next/standalone/.next/static/`. This is a documented Next.js requirement -- the standalone output does not include static assets.

**Example:**
```bash
# In the build script
next build
cp -r .next/static .next/standalone/.next/static
```

### Pattern 4: copy-assets.cjs Dashboard Section

**What:** Extend the existing `copy-assets.cjs` post-build script to copy the standalone dashboard build into `dist/assets/dashboard/`.

**What to copy:**
1. `.next/standalone/` contents (server routes, traced node_modules) -> `dist/assets/dashboard/`
2. Our bundled `server.js` -> `dist/assets/dashboard/server.js` (overwrites the minimal one)
3. `.next/static/` -> `dist/assets/dashboard/.next/static/`

### Pattern 5: Install-Time Dashboard Copy

**What:** Extend `install.ts` to copy `dist/assets/dashboard/` to `.claude/dashboard/` (local) or `~/.claude/dashboard/` (global), and write `dashboard.json` with `projectCwd`.

**Key behaviors (from locked decisions):**
- Always install (both global and local)
- Always overwrite on upgrade
- Silent install (no special callout)
- Write `dashboard.json` next to `dashboard/` directory, not inside it

### Pattern 6: CLI Dashboard Launch (Reworked)

**What:** Modify the `handleDashboard()` function in `cli.ts` and the `dashboard` subcommand in `install.ts` to:
1. Check for `.claude/dashboard/server.js` first (installed standalone build)
2. If not found, auto-install dashboard files then launch
3. Run `node .claude/dashboard/server.js` with `MAXSIM_PROJECT_CWD` set
4. For global installs, read `projectCwd` from `dashboard.json` or require user to specify

### Anti-Patterns to Avoid

- **Do NOT use `next start` in standalone mode:** The standalone output uses its own `server.js`, not `next start`. Our custom server replaces it.
- **Do NOT ship `.next/cache/`:** The cache directory is 146MB and is development/build-only. Only ship `standalone/` contents and `static/`.
- **Do NOT run the dashboard in dev mode from npm:** The shipped build must be production-only. Dev mode is for monorepo development.
- **Do NOT install a separate `node_modules` in the deployed dashboard:** The whole point of standalone is that traced `node_modules` are sufficient. Bundling the custom server eliminates additional dependency needs.
- **Do NOT include source `.ts` files in the npm tarball:** Only ship the built output.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dependency tracing for standalone | Custom file walker | `output: "standalone"` + `outputFileTracingRoot` | Next.js uses @vercel/nft internally; handles complex dependency graphs |
| Custom server bundling | Manual webpack config | tsdown (already in project) | Consistent with project tooling; handles ESM/CJS correctly |
| Static file serving in standalone | Custom static middleware | Next.js built-in (standalone auto-serves from `.next/static/`) | The standalone server.js auto-serves static when copied correctly |
| Port detection | Manual TCP socket probing | detect-port (already used) | Already bundled into server; handles edge cases |

## Common Pitfalls

### Pitfall 1: Windows EPERM Symlink Errors
**What goes wrong:** `next build` with `output: "standalone"` fails on Windows with pnpm because standalone mode creates symlinks in `.next/standalone/node_modules/`, and Windows requires Developer Mode or admin privileges for symlinks.
**Why it happens:** pnpm uses symlinks for its flat node_modules structure, and Next.js standalone traces these symlinks.
**How to avoid:** Use env-var guard (`STANDALONE_BUILD=true`) so developers never run standalone builds locally. CI (Ubuntu) handles standalone builds without issues. If local standalone build is needed, enable Windows Developer Mode or use `symlink=false` in `.npmrc`.
**Warning signs:** `EPERM: operation not permitted, symlink` during `next build`.

### Pitfall 2: Missing Static Assets in Standalone
**What goes wrong:** Dashboard loads but CSS, JS chunks, and fonts are 404. The page appears unstyled or blank.
**Why it happens:** Next.js standalone output does NOT include `.next/static/`. These must be manually copied into `.next/standalone/.next/static/`.
**How to avoid:** Add explicit copy step after `next build`: `cp -r .next/static .next/standalone/.next/static`. Also copy `public/` if it exists.
**Warning signs:** 404 errors in browser console for `/_next/static/*` paths.

### Pitfall 3: Custom Server Dependencies Not Traced
**What goes wrong:** `server.js` starts but crashes with `Cannot find module 'ws'` or `Cannot find module 'chokidar'`.
**Why it happens:** Next.js standalone traces only files imported by Next.js pages/routes/middleware. It completely ignores the custom server file and its dependencies.
**How to avoid:** Bundle the custom server with tsdown, inlining all non-Next.js dependencies. Mark `next` as external since it IS in the standalone traced modules.
**Warning signs:** `MODULE_NOT_FOUND` errors when running `node server.js` in standalone directory.

### Pitfall 4: `@maxsim/core` Not in Standalone Node Modules
**What goes wrong:** API routes that import from `@maxsim/core` (via `lib/parsers.ts`) fail at runtime with module not found.
**Why it happens:** In a monorepo, `@maxsim/core` is resolved via pnpm `workspace:*` symlinks. Without `outputFileTracingRoot` pointing to the monorepo root, the tracer only looks within `packages/dashboard/`.
**How to avoid:** Set `outputFileTracingRoot: path.join(__dirname, '../../')` in `next.config.mjs` when building standalone.
**Warning signs:** 500 errors on API routes; `MODULE_NOT_FOUND: @maxsim/core` in server logs.

### Pitfall 5: Google Fonts Failing Offline
**What goes wrong:** Dashboard takes a long time to load or shows fallback fonts when the user's machine has no internet.
**Why it happens:** `next/font/google` downloads fonts at build time and includes them in the build. If the build doesn't have internet access, fonts fallback. But this should NOT be an issue for the shipped build since fonts are bundled at build time.
**How to avoid:** Fonts are downloaded and embedded during `next build` (in CI). The standalone output includes the font files in `.next/static/`. No runtime font download needed.
**Warning signs:** Check that `.next/static/media/` contains font files after build.

### Pitfall 6: npm Tarball Size Explosion
**What goes wrong:** The npm package becomes too large (>50MB), causing slow installs and potential npm registry rejections.
**Why it happens:** Including `.next/cache/` (146MB), full `node_modules/`, or unoptimized standalone output.
**How to avoid:** Only ship `.next/standalone/` contents (minimal server + traced deps + routes) plus `.next/static/`. Current `.next/server/` is 1.9MB and `.next/static/` is 2.0MB. Standalone with traced deps should be 15-30MB total -- acceptable per MEMORY.md decision.
**Warning signs:** `pnpm pack --dry-run` showing >50MB total package size.

### Pitfall 7: `MAXSIM_PROJECT_CWD` Not Set at Launch
**What goes wrong:** Dashboard launches but reads `.planning/` from the wrong directory (the install directory instead of the user's project).
**Why it happens:** `server.ts` uses `process.env.MAXSIM_PROJECT_CWD || process.cwd()`, and if the env var isn't set, `cwd()` defaults to wherever `node` was invoked from.
**How to avoid:** The CLI launch command must ALWAYS set `MAXSIM_PROJECT_CWD` before spawning the server. For global installs, read from `dashboard.json`; for local installs, use the project directory.
**Warning signs:** Dashboard shows empty state even when `.planning/` exists.

### Pitfall 8: NX Build Order
**What goes wrong:** CLI build runs before dashboard build, so `copy-assets.cjs` can't find the standalone output.
**Why it happens:** NX `dependsOn: ["^build"]` only looks at declared dependencies. The CLI doesn't import from `@maxsim/dashboard` at build time (it's a file-copy relationship, not a code dependency).
**How to avoid:** Add `"dashboard"` to `implicitDependencies` in `packages/cli/project.json` (same pattern as `templates` and `hooks`).
**Warning signs:** `copy-assets.cjs` prints `[warn] Source not found, skipping: ...dashboard...`.

## Code Examples

### next.config.mjs (Production-Ready)
```javascript
// Source: https://nextjs.org/docs/app/api-reference/config/next-config-js/output
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(process.env.STANDALONE_BUILD === 'true' ? {
    output: "standalone",
    outputFileTracingRoot: path.join(__dirname, '../../'),
  } : {}),
  reactStrictMode: true,
  transpilePackages: ["@maxsim/core"],
};

export default nextConfig;
```

### server.ts Modifications for Standalone
```typescript
// Key change: in production standalone mode, Next.js is loaded differently
// but the next() constructor approach still works because our bundled server
// loads 'next' from standalone node_modules.

import { createServer } from "node:http";
import { parse } from "node:url";
import next from "next";
import detectPort from "detect-port";
import open from "open";
import { createWSS } from "./lib/websocket.js";
import { setupWatcher } from "./lib/watcher.js";

const dev = process.env.NODE_ENV !== "production";
const projectCwd = process.env.MAXSIM_PROJECT_CWD || process.cwd();

// In standalone mode, the server runs from .next/standalone/
// next({ dev: false }) will find .next/ relative to process.cwd()
const app = next({ dev, dir: process.env.NEXT_DIR || undefined });
const handle = app.getRequestHandler();

// ... rest remains largely the same
```

### dashboard.json Structure
```json
{
  "projectCwd": "/path/to/user/project"
}
```

### copy-assets.cjs Dashboard Section
```javascript
// 4. Copy dashboard standalone build into dist/assets/dashboard
const dashboardStandalone = path.join(monorepoRoot, 'packages', 'dashboard', '.next', 'standalone');
const dashboardStatic = path.join(monorepoRoot, 'packages', 'dashboard', '.next', 'static');
const dashboardDest = path.join(distAssetsDir, 'dashboard');

if (fs.existsSync(dashboardStandalone)) {
  // Copy the standalone directory (contains server, node_modules, .next routes)
  const standaloneCount = copyDir(dashboardStandalone, dashboardDest);
  console.log(`  [assets] Copied ${standaloneCount} files -> dist/assets/dashboard/`);

  // Copy our bundled custom server.js (overwrites the minimal one)
  const customServer = path.join(monorepoRoot, 'packages', 'dashboard', 'server.js');
  if (fs.existsSync(customServer)) {
    fs.copyFileSync(customServer, path.join(dashboardDest, 'server.js'));
    console.log(`  [assets] Copied custom server.js -> dist/assets/dashboard/`);
  }

  // Copy static assets into the correct location
  if (fs.existsSync(dashboardStatic)) {
    const staticDest = path.join(dashboardDest, '.next', 'static');
    const staticCount = copyDir(dashboardStatic, staticDest);
    console.log(`  [assets] Copied ${staticCount} static files -> dist/assets/dashboard/.next/static/`);
  }
} else {
  console.warn('  [warn] Dashboard standalone build not found. Run STANDALONE_BUILD=true nx build dashboard first.');
}
```

### install.ts Dashboard Install Section
```typescript
// Copy dashboard from dist/assets/dashboard to install target
const dashboardSrc = path.resolve(__dirname, 'assets', 'dashboard');
if (fs.existsSync(dashboardSrc)) {
  const dashboardDest = path.join(installDir, 'dashboard');
  copyDirRecursive(dashboardSrc, dashboardDest);

  // Write dashboard.json (outside dashboard/ dir -- survives upgrades)
  const dashboardConfig = { projectCwd: process.cwd() };
  fs.writeFileSync(
    path.join(installDir, 'dashboard.json'),
    JSON.stringify(dashboardConfig, null, 2)
  );
}
```

### CLI Dashboard Launch (Reworked for Standalone)
```typescript
// In install.ts dashboard subcommand
const dashboardPaths = [
  // Local install
  path.join(process.cwd(), '.claude', 'dashboard', 'server.js'),
  // Global install
  path.join(os.homedir(), '.claude', 'dashboard', 'server.js'),
];

for (const serverPath of dashboardPaths) {
  if (fs.existsSync(serverPath)) {
    const dashboardDir = path.dirname(serverPath);
    const configPath = path.join(path.dirname(dashboardDir), 'dashboard.json');

    let projectCwd = process.cwd();
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      projectCwd = config.projectCwd || projectCwd;
    }

    const child = spawnDash('node', [serverPath], {
      cwd: dashboardDir,  // Must run from standalone root
      env: {
        ...process.env,
        MAXSIM_PROJECT_CWD: projectCwd,
        NODE_ENV: 'production',
      },
      detached: true,
      stdio: 'ignore',
    });
    child.unref();
    // ... health check and URL reporting
    break;
  }
}
```

## State of the Art

| Old Approach (Phase 13) | Current Approach (Phase 14) | When Changed | Impact |
|-------------------------|----------------------------|--------------|--------|
| Dev-mode tsx runner | Standalone production build | Phase 14 | Removes tsx/TypeScript runtime dependency for end users |
| Monorepo-only dashboard | npm-shipped dashboard | Phase 14 | Dashboard works for all `npx maxsimcli` users |
| `next()` API with full node_modules | Bundled server + standalone | Phase 14 | ~15-30MB self-contained vs hundreds MB of node_modules |
| Manual fallback to monorepo path | Installed `.claude/dashboard/` | Phase 14 | Deterministic install path, no monorepo detection needed |

**Important:** `output: "standalone"` has been stable since Next.js 12. The current project uses Next.js ^15. No bleeding-edge features required.

## Open Questions

1. **Exact standalone build size**
   - What we know: `.next/server/` is 1.9MB, `.next/static/` is 2.0MB. Standalone typically adds 15-50MB for traced node_modules.
   - What's unclear: Exact size with this project's dependency tree (react, react-dom, next, @maxsim/core, codemirror, motion, tailwind-merge).
   - Recommendation: Build once with standalone, measure, and assess if it fits in the npm tarball size budget. If >50MB, consider `outputFileTracingExcludes` to prune unused routes.

2. **Windows Developer Mode for local standalone builds**
   - What we know: The EPERM error occurs on Windows without Developer Mode when using pnpm + standalone.
   - What's unclear: Whether the CI-only standalone approach means developers NEVER need to build standalone locally.
   - Recommendation: Document that standalone builds happen in CI only. Local dev uses standard mode (no env var). If a developer needs to test locally, they should enable Developer Mode or use WSL.

3. **Google Fonts in standalone**
   - What we know: `next/font/google` downloads and embeds fonts at build time.
   - What's unclear: Whether the font files end up in the standalone-traced output or only in `.next/static/`.
   - Recommendation: Verify after first standalone build that `.next/standalone/.next/static/media/` contains the Inter and JetBrains Mono font files. If not, add to `outputFileTracingIncludes`.

## Validation Architecture

> Skipped -- workflow.nyquist_validation is not set to true in .planning/config.json

## Sources

### Primary (HIGH confidence)
- [Next.js output configuration docs](https://nextjs.org/docs/app/api-reference/config/next-config-js/output) - Standalone mode, outputFileTracingRoot, outputFileTracingIncludes/Excludes (verified 2026-02-20 update)
- [Next.js serverExternalPackages docs](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverExternalPackages) - Server-side dependency handling
- Codebase inspection: `packages/dashboard/server.ts`, `packages/dashboard/next.config.mjs`, `packages/dashboard/package.json`, `packages/cli/src/install.ts`, `packages/cli/src/cli.ts`, `packages/cli/scripts/copy-assets.cjs`, `packages/cli/project.json`

### Secondary (MEDIUM confidence)
- [Standalone Next.js with Custom Server (sdust.dev)](https://sdust.dev/posts/2024-11-10_nextjs-custom-server) - Verified pattern: tsup/esbuild to bundle custom server, @vercel/nft for tracing
- [Next.js with Docker, Standalone, and Custom Server (hmos.dev)](https://hmos.dev/en/nextjs-docker-standalone-and-custom-server) - Verified pattern: esbuild bundle with `external: ["next"]`
- [GitHub Discussion #52244](https://github.com/vercel/next.js/discussions/52244) - pnpm + standalone + Windows EPERM workarounds

### Tertiary (LOW confidence)
- [GitHub Issue #71515](https://github.com/vercel/next.js/issues/71515) - Custom server bundling issues (open issue, no official resolution)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already in project, no new dependencies
- Architecture: HIGH - standalone + bundled server is a well-documented pattern verified by multiple sources and official Next.js docs
- Pitfalls: HIGH - all pitfalls identified from codebase inspection, official docs, and community reports
- Build integration: MEDIUM - exact standalone output size and font tracing behavior need empirical verification after first build

**Research date:** 2026-02-24
**Valid until:** 2026-03-24 (stable technologies, Next.js standalone mode unchanged since Next.js 12)
