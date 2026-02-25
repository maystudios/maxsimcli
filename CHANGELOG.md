## [2.4.2](https://github.com/maystudios/maxsim/compare/v2.4.1...v2.4.2) (2026-02-25)


### Bug Fixes

* **dashboard:** auto-install node-pty before starting dashboard server ([6e576a5](https://github.com/maystudios/maxsim/commit/6e576a583795188749857b92253b78cdb05c3cb7))

## [2.4.1](https://github.com/maystudios/maxsim/compare/v2.4.0...v2.4.1) (2026-02-25)


### Bug Fixes

* **dashboard:** lazy-load node-pty to prevent server crash when unavailable ([7d5b8c2](https://github.com/maystudios/maxsim/commit/7d5b8c20bfcce04082a0df93bfd2cf8d3e83d4c9))

# [2.4.0](https://github.com/maystudios/maxsim/compare/v2.3.0...v2.4.0) (2026-02-25)


### Bug Fixes

* **21:** fix status message parsing and uptime unit mismatch ([83731b8](https://github.com/maystudios/maxsim/commit/83731b861a9e3526243d8761893a7366bd257148))


### Features

* **profiles:** add tokenburner model profile (all opus) ([ecab7e3](https://github.com/maystudios/maxsim/commit/ecab7e3f257da418314a7e87fd5c8f044ddcc4b4))

# [2.3.0](https://github.com/maystudios/maxsim/compare/v2.2.0...v2.3.0) (2026-02-25)


### Features

* **21-03:** integrate terminal into dashboard layout ([a46ca20](https://github.com/maystudios/maxsim/commit/a46ca20dae9c058c2459deb4d228bd1770da5a77))
* **21-04:** create QuickActionBar with confirmation and settings ([6c342ce](https://github.com/maystudios/maxsim/commit/6c342ceed893d57d014669b8715982ae71f21521))
* **21-04:** integrate QuickActionBar into Terminal component ([bed0df1](https://github.com/maystudios/maxsim/commit/bed0df1d7767575389645c9d421ae1a49ab410be))
* **website:** add Dashboard feature card, command, and install path info ([9488b99](https://github.com/maystudios/maxsim/commit/9488b99318d3b83612c721e2d132efa5be56580f))

# [2.2.0](https://github.com/maystudios/maxsim/compare/v2.1.1...v2.2.0) (2026-02-25)


### Bug Fixes

* **website:** replace outdated /gsd: command prefix with /maxsim: and update command count to 31 ([4bda14d](https://github.com/maystudios/maxsim/commit/4bda14dee198a5039d3053c3cfa4e3a7e03a59e4))


### Features

* **21-01:** add PTY manager, session store, and terminal WebSocket endpoint ([a5d9903](https://github.com/maystudios/maxsim/commit/a5d9903b449bd96e8bc95dc693ab45f3a4d35e7e))
* **21-02:** add TerminalStatusBar with process info and controls ([f824f34](https://github.com/maystudios/maxsim/commit/f824f34aa52e5cab04b619ca6571441314b8f705))
* **21-02:** add useTerminal hook and Terminal xterm.js component ([c9c0642](https://github.com/maystudios/maxsim/commit/c9c06428449927f9a41761c5e5dc243a4a7ae723))
* **install:** prompt to enable Agent Teams for Claude during interactive install ([69b25d3](https://github.com/maystudios/maxsim/commit/69b25d3448146a06b17ee4fe2f655962ab4c87fd))

## [2.1.1](https://github.com/maystudios/maxsim/compare/v2.1.0...v2.1.1) (2026-02-25)


### Bug Fixes

* **dashboard:** prevent server shutdown from broken stderr pipe on Windows ([7cbb9f6](https://github.com/maystudios/maxsim/commit/7cbb9f601cd006f72f99d9fba75daf39818e4ec8))

# [2.1.0](https://github.com/maystudios/maxsim/compare/v2.0.5...v2.1.0) (2026-02-25)


### Bug Fixes

* **dashboard:** remove non-existent @types/sirv and update lockfile ([b928c4e](https://github.com/maystudios/maxsim/commit/b928c4ea185260f48783d32229446cfb78c82e0c))
* **dashboard:** rename server.cjs to server.js after tsdown build ([0f9a82f](https://github.com/maystudios/maxsim/commit/0f9a82f6c75317e2fb0ba08adb256fc5b6890e4b))
* **dashboard:** rename tsdown config to .mts to fix ESM parse error in CI ([a0ee56d](https://github.com/maystudios/maxsim/commit/a0ee56d80d81542c8337f51aa08d147587cf2af7))


### Features

* **dashboard:** migrate from Next.js standalone to Vite + Express ([c1f8b0d](https://github.com/maystudios/maxsim/commit/c1f8b0d39e9d4656ae06257be1cddcc3a68aed80))

## [2.0.5](https://github.com/maystudios/maxsim/compare/v2.0.4...v2.0.5) (2026-02-25)


### Bug Fixes

* **dashboard:** copy static assets to packages/dashboard/.next/static/ ([59aa764](https://github.com/maystudios/maxsim/commit/59aa7640aa8a0f1eafc02c55989dc2a11bfb5c49))

## [2.0.4](https://github.com/maystudios/maxsim/compare/v2.0.3...v2.0.4) (2026-02-25)


### Bug Fixes

* **dashboard:** hoist styled-jsx from pnpm store at install time ([fd6654d](https://github.com/maystudios/maxsim/commit/fd6654d9fa111055cb18fec6482c2d4b4205c187))

## [2.0.3](https://github.com/maystudios/maxsim/compare/v2.0.2...v2.0.3) (2026-02-25)


### Bug Fixes

* **dashboard:** copy required-server-files.json into standalone bundle and clean stale installs ([2f1e938](https://github.com/maystudios/maxsim/commit/2f1e9389d933083b35719e2f8af343971a059346))

## [2.0.2](https://github.com/maystudios/maxsim/compare/v2.0.1...v2.0.2) (2026-02-25)


### Bug Fixes

* **dashboard:** fix dashboard launch on Windows paths with spaces and slow cold-starts ([a811921](https://github.com/maystudios/maxsim/commit/a811921f9db63d398472339d12e6056d5c457c29))

## [2.0.1](https://github.com/maystudios/maxsim/compare/v2.0.0...v2.0.1) (2026-02-25)


### Bug Fixes

* **ci:** remove custom GIT_COMMITTER env vars that break semantic-release GitHub plugin ([ad5a5a6](https://github.com/maystudios/maxsim/commit/ad5a5a6bffa473f633f7719cf2d48635bb28401b))

# [2.0.0](https://github.com/maystudios/maxsim/compare/v1.3.0...v2.0.0) (2026-02-25)


* feat!: release v2.0.0 — E2E-validated npm delivery with live dashboard ([13fa7a4](https://github.com/maystudios/maxsim/commit/13fa7a479e3e75d20e30b46406d42684f0bee7eb))


### Bug Fixes

* **ci:** call semantic-release binary directly to avoid pnpm recursive exec ([bdf4108](https://github.com/maystudios/maxsim/commit/bdf41089d16b41cfe8ed591fa092916437391052))
* **ci:** set NODE_AUTH_TOKEN so setup-node npmrc auth works with semantic-release ([bc30224](https://github.com/maystudios/maxsim/commit/bc302246bf31f295bb457ba39664c9b0b2ed10e1))
* **ci:** use pnpm exec semantic-release to resolve local plugins ([bd62749](https://github.com/maystudios/maxsim/commit/bd6274991b35e156ca4b4551732b813f0f2f979b))
* **e2e:** add title frontmatter and 02-integration dir to mock fixture ([2563892](https://github.com/maystudios/maxsim/commit/2563892b3a9931bd1c98c5f7c4491a0182e9c822))


### Features

* **ci:** add E2E gate to publish workflow — failing tests block release ([c2dd048](https://github.com/maystudios/maxsim/commit/c2dd048dc6d737fb23e0ba652537a2d3196bae8b))
* **e2e:** add dashboard.test.ts with 5 read API endpoint assertions ([f3df880](https://github.com/maystudios/maxsim/commit/f3df8803e2c2e123b781a25ecde7b9fbba57ae80))


### BREAKING CHANGES

* Minimum Node.js version raised to >=22.0.0. Complete
rewrite from CJS monolith to pnpm workspace with TypeScript packages.
Dashboard now ships inside the npm tarball as a Next.js standalone build.
E2E test suite validates the full install lifecycle from npm consumer
perspective. CI gate blocks publish when E2E fails.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>

## 1.3.0 (2026-02-24)

### 🚀 Features

- **cli:** add --version flag to install binary ([8fa087d](https://github.com/maystudios/maxsim/commit/8fa087d))
- **e2e:** add packages/e2e NX scaffold with vitest passWithNoTests ([917aa86](https://github.com/maystudios/maxsim/commit/917aa86))
- **e2e:** wire globalSetup in vitest.config.ts and add ProvidedContext types ([0e1e6ce](https://github.com/maystudios/maxsim/commit/0e1e6ce))
- **e2e:** add globalSetup pack+install pipeline and mock project fixture ([473a494](https://github.com/maystudios/maxsim/commit/473a494))
- **e2e:** add install.test.ts and tools.test.ts E2E assertion layer ([c41c616](https://github.com/maystudios/maxsim/commit/c41c616))

### ❤️ Thank You

- Claude Sonnet 4.6
- Sven

## 1.2.3 (2026-02-24)

### 🩹 Fixes

- **dashboard:** resolve standalone server startup failures ([10c3c31](https://github.com/maystudios/maxsim/commit/10c3c31))

### ❤️ Thank You

- Claude Sonnet 4.6
- Sven

## 1.2.2 (2026-02-24)

### 🩹 Fixes

- **dashboard:** use CJS format for standalone server bundle ([29f2773](https://github.com/maystudios/maxsim/commit/29f2773))

### ❤️ Thank You

- Claude Sonnet 4.6
- Sven

## 1.2.1 (2026-02-24)

### 🚀 Features

- **14-01:** configure Next.js standalone output with env-var guard and server bundling ([7fa5de8](https://github.com/maystudios/maxsim/commit/7fa5de8))
- **14-01:** add build:standalone script and update NX build target ([1e573de](https://github.com/maystudios/maxsim/commit/1e573de))
- **14-02:** extend copy-assets.cjs for dashboard and add NX implicit dependency ([7352c8c](https://github.com/maystudios/maxsim/commit/7352c8c))
- **14-02:** add dashboard install-time copy and rework CLI launch command ([1199bf2](https://github.com/maystudios/maxsim/commit/1199bf2))

### 🩹 Fixes

- **cli:** use fs.cpSync with dereference for dashboard standalone copy ([472e123](https://github.com/maystudios/maxsim/commit/472e123))
- **dashboard:** handle tsdown exit code 1 despite successful build ([b92cade](https://github.com/maystudios/maxsim/commit/b92cade))

### ❤️ Thank You

- Claude Sonnet 4.6
- Sven

## 1.2.0 (2026-02-24)

### 🚀 Features

- **cli:** add `npx maxsimcli dashboard` command with monorepo detection ([b328544](https://github.com/maystudios/maxsim/commit/b328544))

### ❤️ Thank You

- Claude Opus 4.6
- Sven

## 1.1.3 (2026-02-24)

### 🚀 Features

- **13-02:** create custom server with WebSocket and file watcher modules ([2ffbf0b](https://github.com/maystudios/maxsim/commit/2ffbf0b))
- **13-02:** create WebSocket React provider with auto-reconnect ([2d3f058](https://github.com/maystudios/maxsim/commit/2d3f058))
- **13-03:** create lib/parsers.ts with @maxsim/core wrapper functions ([896e71e](https://github.com/maystudios/maxsim/commit/896e71e))
- **13-03:** create read-only API route handlers ([8f7ea3b](https://github.com/maystudios/maxsim/commit/8f7ea3b))
- **13-03:** create write/mutation API route handlers ([6679731](https://github.com/maystudios/maxsim/commit/6679731))
- **13-04:** create useDashboardData hook and StatsHeader component ([af3c50e](https://github.com/maystudios/maxsim/commit/af3c50e))
- **13-04:** create phase list, phase progress, and wire main dashboard page ([d37d7e4](https://github.com/maystudios/maxsim/commit/d37d7e4))
- **13-05:** add usePhaseDetail hook, plan card, and task list components ([c232dfd](https://github.com/maystudios/maxsim/commit/c232dfd))
- **13-05:** add CodeMirror plan editor and phase detail container ([ce2d495](https://github.com/maystudios/maxsim/commit/ce2d495))
- **13-06:** add sidebar navigation and app shell layout ([5020c73](https://github.com/maystudios/maxsim/commit/5020c73))
- **13-06:** add todos panel, blockers panel, and state editor ([6be1847](https://github.com/maystudios/maxsim/commit/6be1847))
- **13-07:** add dashboard launch command to CLI dispatch router ([a593fc4](https://github.com/maystudios/maxsim/commit/a593fc4))
- **13-07:** update dashboard build pipeline with server compilation ([e4dadd2](https://github.com/maystudios/maxsim/commit/e4dadd2))
- **13-07:** create health check API endpoint for dashboard ([99aff72](https://github.com/maystudios/maxsim/commit/99aff72))
- **13-07:** add dashboard auto-launch to execute-phase workflow ([e639b0b](https://github.com/maystudios/maxsim/commit/e639b0b))

### ❤️ Thank You

- Claude Opus 4.6
- Sven

## 1.1.2 (2026-02-24)

### 🚀 Features

- **13-01:** scaffold packages/dashboard NX package with Next.js 15 and dependencies ([8cb33d6](https://github.com/maystudios/maxsim/commit/8cb33d6))
- **13-01:** add dark theme layout, globals, utilities, types, and Aceternity config ([c8f76cb](https://github.com/maystudios/maxsim/commit/c8f76cb))

### ❤️ Thank You

- Claude Opus 4.6
- Sven

## 1.1.1 (2026-02-24)

### 🩹 Fixes

- **discuss:** enforce AskUserQuestion tool for all user interactions ([149fda4](https://github.com/maystudios/maxsim/commit/149fda4))

### ❤️ Thank You

- Claude Opus 4.6
- Sven

## 1.1.0 (2026-02-24)

### 🚀 Features

- **cli:** use figlet ANSI Shadow for banner instead of hardcoded Unicode escapes ([3952531](https://github.com/maystudios/maxsim/commit/3952531))

### 🩹 Fixes

- **ci:** remove figlet from root package.json, keep only in packages/cli ([e99c16d](https://github.com/maystudios/maxsim/commit/e99c16d))

### ❤️ Thank You

- Claude Sonnet 4.6
- Sven

## 1.0.12 (2026-02-24)

### 🩹 Fixes

- **core:** integration validation cleanup — build, catch blocks, regex ([7762847](https://github.com/maystudios/maxsim/commit/7762847))

### ❤️ Thank You

- Sven

## 1.0.11 (2026-02-24)

### 🚀 Features

- **core:** add chalk dependency and phase-bars format to cmdProgressRender ([121f17c](https://github.com/maystudios/maxsim/commit/121f17c))
- **templates:** add /maxsim:roadmap command and workflow ([372c8a3](https://github.com/maystudios/maxsim/commit/372c8a3))
- **templates:** update progress workflow to use phase-bars format ([c9672ee](https://github.com/maystudios/maxsim/commit/c9672ee))
- **templates:** add sanity_check guard to five major workflow files ([fca2b19](https://github.com/maystudios/maxsim/commit/fca2b19))

### ❤️ Thank You

- Sven

## 1.0.10 (2026-02-24)

This was a version bump only, there were no code changes.

## 1.0.1 (2026-02-24)

This was a version bump only, there were no code changes.

# 2.0.0 (2026-02-24)

### 🚀 Features

- ⚠️  initial release as maxsimcli v1.0.0 ([fa648cf](https://github.com/maystudios/maxsim/commit/fa648cf))

### ⚠️  Breaking Changes

- initial release as maxsimcli v1.0.0  ([fa648cf](https://github.com/maystudios/maxsim/commit/fa648cf))
  Package renamed from maxsim to maxsimcli.
  Install via: npx maxsimcli@latest
  Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>

### ❤️ Thank You

- Claude Sonnet 4.6
- Sven

## 1.21.2 (2026-02-24)

### 🩹 Fixes

- replace GSD ASCII banner with MAXSIM banner ([24aedb7](https://github.com/maystudios/maxsim/commit/24aedb7))

### ❤️ Thank You

- Claude Sonnet 4.6
- Sven

## 1.21.1 (2026-02-24)

### 🩹 Fixes

- use dynamic package name for tarball path in publish workflow ([ba7fded](https://github.com/maystudios/maxsim/commit/ba7fded))
- update remaining maxsim references to maxsimcli ([d1ced1c](https://github.com/maystudios/maxsim/commit/d1ced1c))

### ❤️ Thank You

- Claude Sonnet 4.6
- Sven

## 1.21.0 (2026-02-24)

### 🚀 Features

- rename npm package from maxsim to maxsimcli ([7a626a7](https://github.com/maystudios/maxsim/commit/7a626a7))

### 🩹 Fixes

- copy workspace packages into node_modules for bundledDependencies ([5db9e10](https://github.com/maystudios/maxsim/commit/5db9e10))
- use pnpm pack + npm publish for correct workspace bundling ([6bfb574](https://github.com/maystudios/maxsim/commit/6bfb574))
- use hoisted nodeLinker for pnpm pack with bundledDependencies ([3d63115](https://github.com/maystudios/maxsim/commit/3d63115))

### ❤️ Thank You

- Claude Sonnet 4.6
- Sven

## 1.20.8 (2026-02-24)

### 🩹 Fixes

- specify packageManager for pnpm action-setup ([8d0daf2](https://github.com/maystudios/maxsim/commit/8d0daf2))
- remove conflicting --yes flag from nx release ([98b1320](https://github.com/maystudios/maxsim/commit/98b1320))
- handle first release when no git tags exist ([5d8be00](https://github.com/maystudios/maxsim/commit/5d8be00))
- use pnpm publish directly from packages/cli ([effc9dc](https://github.com/maystudios/maxsim/commit/effc9dc))
- use pnpm pack + npm publish to avoid bundledDependencies linker error ([cb31036](https://github.com/maystudios/maxsim/commit/cb31036))
- use npm publish instead of pnpm to avoid bundledDependencies linker error ([c2c9215](https://github.com/maystudios/maxsim/commit/c2c9215))
- skip publish when no version bump detected ([008ab0e](https://github.com/maystudios/maxsim/commit/008ab0e))
- compare versions before publishing to avoid 403 errors ([f56cdb3](https://github.com/maystudios/maxsim/commit/f56cdb3))
- resolve pnpm symlinks before publish and bump to 1.20.7 ([c9962dd](https://github.com/maystudios/maxsim/commit/c9962dd))

### ❤️ Thank You

- Claude Sonnet 4.6
- Sven
