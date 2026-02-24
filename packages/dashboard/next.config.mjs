/** @type {import('next').NextConfig} */
const nextConfig = {
  // NOTE: output: "standalone" is needed for production subprocess pattern
  // but causes EPERM symlink errors on Windows during development.
  // Enable when building for production deployment.
  // output: "standalone",
  reactStrictMode: true,
  transpilePackages: ["@maxsim/core"],
};

export default nextConfig;
