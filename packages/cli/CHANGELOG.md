## 1.0.10 (2026-02-24)

This was a version bump only for cli to align it with other projects, there were no code changes.

## 1.0.1 (2026-02-24)

This was a version bump only for cli to align it with other projects, there were no code changes.

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

- update remaining maxsim references to maxsimcli ([d1ced1c](https://github.com/maystudios/maxsim/commit/d1ced1c))
- use dynamic package name for tarball path in publish workflow ([ba7fded](https://github.com/maystudios/maxsim/commit/ba7fded))

### ❤️ Thank You

- Claude Sonnet 4.6
- Sven

## 1.21.0 (2026-02-24)

### 🚀 Features

- rename npm package from maxsim to maxsimcli ([7a626a7](https://github.com/maystudios/maxsim/commit/7a626a7))

### 🩹 Fixes

- use hoisted nodeLinker for pnpm pack with bundledDependencies ([3d63115](https://github.com/maystudios/maxsim/commit/3d63115))
- use pnpm pack + npm publish for correct workspace bundling ([6bfb574](https://github.com/maystudios/maxsim/commit/6bfb574))
- copy workspace packages into node_modules for bundledDependencies ([5db9e10](https://github.com/maystudios/maxsim/commit/5db9e10))

### ❤️ Thank You

- Claude Sonnet 4.6
- Sven

## 1.20.8 (2026-02-24)

### 🩹 Fixes

- resolve pnpm symlinks before publish and bump to 1.20.7 ([c9962dd](https://github.com/maystudios/maxsim/commit/c9962dd))
- compare versions before publishing to avoid 403 errors ([f56cdb3](https://github.com/maystudios/maxsim/commit/f56cdb3))
- skip publish when no version bump detected ([008ab0e](https://github.com/maystudios/maxsim/commit/008ab0e))
- use npm publish instead of pnpm to avoid bundledDependencies linker error ([c2c9215](https://github.com/maystudios/maxsim/commit/c2c9215))
- use pnpm pack + npm publish to avoid bundledDependencies linker error ([cb31036](https://github.com/maystudios/maxsim/commit/cb31036))
- use pnpm publish directly from packages/cli ([effc9dc](https://github.com/maystudios/maxsim/commit/effc9dc))
- handle first release when no git tags exist ([5d8be00](https://github.com/maystudios/maxsim/commit/5d8be00))
- remove conflicting --yes flag from nx release ([98b1320](https://github.com/maystudios/maxsim/commit/98b1320))
- specify packageManager for pnpm action-setup ([8d0daf2](https://github.com/maystudios/maxsim/commit/8d0daf2))

### ❤️ Thank You

- Claude Sonnet 4.6
- Sven