import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

function buildMetaPlugin(buildId: string) {
  return {
    name: 'bitruvius-build-meta',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'build-meta.json',
        source: JSON.stringify({buildId}, null, 2),
      });
    },
  } as const;
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const buildId = process.env.BUILD_ID ?? new Date().toISOString();
  return {
    plugins: [react({
      // Add explicit TypeScript handling
      babel: {
        plugins: []
      }
    }), tailwindcss(), buildMetaPlugin(buildId)],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      __BUILD_ID__: JSON.stringify(buildId),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      fs: {
        // Ensure file serving works correctly
        strict: false
      }
    },
    // Add explicit MIME type handling
    esbuild: {
      target: 'esnext'
    }
  };
});
