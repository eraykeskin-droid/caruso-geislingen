// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

const BASE_URL = "https://caruso-geislingen.de";

// https://astro.build/config
export default defineConfig({
  site: BASE_URL,
  vite: {
    plugins: [tailwindcss()],
    server: {
      proxy: {
        '/api': {
          target: BASE_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '/api')
        }
      }
    }
  },

  integrations: [react(), sitemap()]
});