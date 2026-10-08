import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const csp = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "font-src 'self'",
  "img-src 'self' data:",
  "connect-src 'self' https: http://localhost:* http://127.0.0.1:*",
  "manifest-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ');

export default defineConfig({
  base: '/social-agents/',
  plugins: [
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      manifest: {
        name: 'Social Agents',
        short_name: 'Social Agents',
        description: 'Private communication practice and project collaboration support.',
        start_url: '/social-agents/',
        scope: '/social-agents/',
        display: 'standalone',
        background_color: '#0e0f13',
        theme_color: '#0e0f13',
        icons: [
          {
            src: 'icons/icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'icons/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        navigateFallback: 'index.html',
        globPatterns: ['**/*.{html,js,css,svg,webmanifest}'],
        runtimeCaching: [],
      },
    }),
  ],
  test: {
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: { reporter: ['text', 'html'] },
  },
  server: {
    headers: { 'Content-Security-Policy': csp },
  },
});

export { csp };
