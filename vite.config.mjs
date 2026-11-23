import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const path = (relative) => fileURLToPath(new URL(relative, import.meta.url));

export default defineConfig({
    base: './',
    publicDir: false,
    esbuild: { jsx: 'automatic' },
    server: { fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/.aws/**'] } },
    build: { outDir: path('./dist/'), emptyOutDir: true }
});
