import devServer, { defaultOptions } from "@hono/vite-dev-server";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig, loadEnv } from "vite";
import { resolve } from "path";

export default defineConfig(({ mode }) => {
  if (process.env.QUESTS_INSIDE_STUDIO !== "true") {
    const env = loadEnv(mode, process.cwd(), "");
    process.env = env;
  }

  const isDev = mode === "development";

  return {
    plugins: [
      tsconfigPaths(),
      react(),
      tailwindcss(),
      isDev &&
        devServer({
          exclude: [/src\/client\/.*/, ...defaultOptions.exclude],
          entry: "./src/server/index.ts",
        }),
    ].filter(Boolean),
    build: {
      outDir: "dist/client",
      emptyOutDir: true,
      rollupOptions: {
        input: "./src/client/main.tsx",
        output: {
          entryFileNames: "static/[name].js",
          chunkFileNames: "static/[name].js",
          assetFileNames: "static/[name].[ext]",
        },
      },
    },
  };
});
