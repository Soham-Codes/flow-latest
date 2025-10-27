import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Load env file based on `mode` in the current working directory.
    // By default, only env variables prefixed with `VITE_` are exposed to your Vite-processed code.
    const env = loadEnv(mode, '.', '');
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      // Note: No need to define process.env variables since we use import.meta.env.VITE_* directly
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
