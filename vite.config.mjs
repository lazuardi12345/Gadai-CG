import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import jsconfigPaths from 'vite-jsconfig-paths';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const API_URL = `${env.VITE_APP_BASE_NAME}`;
  const PORT = 3000; 

  return {
    server: {
      open: true,
      port: PORT,

      allowedHosts: true 
      
     
    },
    define: {
      global: 'window'
    },
    resolve: {

    },
    preview: {
      open: true,
      port: PORT
    },
    base: API_URL,
    plugins: [react(), jsconfigPaths()]
  };
});