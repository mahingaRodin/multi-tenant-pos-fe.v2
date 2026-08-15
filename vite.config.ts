// Lovable wraps TanStack Start. On Vercel we must force Nitro's vercel preset;
// the default is cloudflare-module, which deploys with no Vercel routes (404).
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  nitro: process.env.VERCEL ? { preset: "vercel" } : {},
});
