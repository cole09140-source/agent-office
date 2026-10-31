import preact from '@preact/preset-vite';
import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

/** Emits sw.js with a precache manifest of every built asset (offline-first PWA). */
function serviceWorker(): Plugin {
  return {
    name: 'silvr-sw',
    apply: 'build',
    generateBundle(_opts, bundle) {
      const assets = Object.keys(bundle).filter((f) => !f.endsWith('.map'));
      const publicFiles = ['manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png', 'icons/og.png', 'privacy.html', 'terms.html', 'support.html', 'licenses.html', 'legal.css'];
      const urls = ['./', ...new Set([...assets, ...publicFiles])].map((f) => (f === './' ? f : `./${f}`));
      const template = readFileSync(new URL('./src/sw-template.js', import.meta.url), 'utf8');
      const version = `${pkg.version}-${Date.now().toString(36)}`;
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: template.replace('__PRECACHE__', JSON.stringify(urls)).replace('__VERSION__', version),
      });
    },
  };
}

/**
 * SITE_URL=https://… at build time: SNS previews need an absolute og:image, and the
 * canonical URL helps stores and crawlers. Without it the build stays path-relative.
 */
function siteUrl(): Plugin {
  const url = process.env.SITE_URL?.replace(/\/+$/, '');
  return {
    name: 'silvr-site-url',
    apply: 'build',
    transformIndexHtml(html) {
      if (!url) return html;
      return html
        .replace('content="./icons/og.png"', `content="${url}/icons/og.png"`)
        .replace('  </head>', `    <meta property="og:url" content="${url}/" />
    <link rel="canonical" href="${url}/" />
  </head>`);
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [preact(), serviceWorker(), siteUrl()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    target: 'es2020',
    sourcemap: false,
  },
  server: { host: true },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
} as Parameters<typeof defineConfig>[0]);
