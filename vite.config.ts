import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const isVercel = Boolean(process.env["VERCEL"]);

export default defineConfig({
  ...(isVercel ? { nitro: { preset: "vercel" } } : {}),
});
