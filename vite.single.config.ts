/**
 * Build « fichier unique » pour une préversion partageable : un seul index.html, JS et CSS inclus.
 * npm run build:single → dist-single/index.html (aucun fichier annexe).
 */
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { readFileSync, writeFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';

function inlineEverything(): Plugin {
  return {
    name: 'bad-boss-inline',
    apply: 'build',
    enforce: 'post',
    writeBundle(options, bundle) {
      const dir = options.dir ?? 'dist-single';
      const htmlPath = `${dir}/index.html`;
      let html = readFileSync(htmlPath, 'utf8');
      for (const [name, file] of Object.entries(bundle)) {
        if (file.type === 'chunk' && file.isEntry) {
          const code = file.code.replace(/<\/script/g, '<\\/script');
          html = html.replace(new RegExp(`<script type="module" crossorigin src="\\./${name}"></script>`), () => `<script type="module">${code}</script>`);
        } else if (file.type === 'asset' && name.endsWith('.css')) {
          html = html.replace(new RegExp(`<link rel="stylesheet" crossorigin href="\\./${name}">`), () => `<style>${String(file.source)}</style>`);
        }
      }
      html = html.replace(/<link rel="modulepreload"[^>]*>\s*/g, '');
      writeFileSync(htmlPath, html);
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [svelte(), inlineEverything()],
  build: {
    target: 'es2022',
    outDir: 'dist-single',
    emptyOutDir: true,
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
});
