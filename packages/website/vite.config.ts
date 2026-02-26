import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "vite-plugin-sitemap";
import path from "path";

async function fetchNpmVersion(pkg: string): Promise<string> {
  try {
    const res = await fetch(`https://registry.npmjs.org/${pkg}/latest`);
    const data = (await res.json()) as { version?: string };
    return data.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

export default defineConfig(async () => {
  const version = await fetchNpmVersion("maxsimcli");

  return {
    base: "/",
    plugins: [
      react(),
      tailwindcss(),
      sitemap({
        hostname: "https://maxsimcli.dev",
        dynamicRoutes: ["/docs"],
        changefreq: "weekly",
        priority: 1.0,
        lastmod: new Date().toISOString().split("T")[0],
        readable: true,
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      __MAXSIM_VERSION__: JSON.stringify(version),
    },
  };
});
