import { defineConfig } from 'vite';

// Relative paths so the build works under GitHub Pages' /sort-party/ and anywhere else.
export default defineConfig({ base: './', server: { port: 5195 }, preview: { allowedHosts: ['.ts.net'] } });
