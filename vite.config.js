import { defineConfig } from 'vite';
import react from "@vitejs/plugin-react";
// import preact from '@preact/preset-vite';

export default defineConfig({
  server: {
      open: true,
  },
  plugins: [react()],
  build: {
    rollupOptions: {
      input: './index.html'
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@import "src/styles/variables_new.scss"; @import "src/styles/mixins_new.scss";`
        }
      }
    }
    
  }
});