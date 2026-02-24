import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output is needed for npm packaging (ships self-contained build).
  // Guarded by env var because standalone causes EPERM symlink errors on Windows
  // during development with pnpm. CI (Ubuntu) sets STANDALONE_BUILD=true.
  ...(process.env.STANDALONE_BUILD === 'true' ? {
    output: "standalone",
    outputFileTracingRoot: path.join(__dirname, '../../'),
  } : {}),
  reactStrictMode: true,
  transpilePackages: ["@maxsim/core"],
};

export default nextConfig;
