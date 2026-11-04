import { defineConfig } from 'vite';

export function precachePlugin() {
  return {
    name: 'generate-precache-manifest',
    generateBundle(options, bundle) {
      const files = [];
      for (const fileName of Object.keys(bundle)) {
        if (fileName.startsWith('assets/')) {
          files.push(fileName);
        }
      }
      this.emitFile({
        type: 'asset',
        fileName: 'precache-manifest.json',
        source: JSON.stringify(files, null, 2)
      });
    }
  };
}

export default defineConfig({
  base: './',
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
    hmr: process.env.DISABLE_HMR !== 'true'
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true
  },
  plugins: [
    precachePlugin()
  ],
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});
