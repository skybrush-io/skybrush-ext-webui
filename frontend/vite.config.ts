import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// Mount point of the web UI on the Skybrush server. Used only by the
// development server; production builds use relative URLs so they work under
// any mount point that the extension is configured with.
const MOUNT_POINT = '/webui/'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const server = env.SKYBRUSH_SERVER_URL || 'http://127.0.0.1:5000'

  return {
    base: command === 'serve' ? MOUNT_POINT : './',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
    build: {
      outDir: '../src/skybrush_ext_webui/static/app',
      emptyOutDir: true,
      manifest: true,
      // The UI is served from the local server so the size of the main chunk
      // is not a concern
      chunkSizeWarningLimit: 1024,
      rolldownOptions: {
        // The HTML page is rendered by the server from a Jinja template so
        // the entry point is the main script, not index.html
        input: 'src/main.tsx',
      },
    },
    server: {
      proxy: {
        [`^${MOUNT_POINT}(api|config)(/.*|\\.json)?$`]: server,
        [`^${MOUNT_POINT}extensions/[^/]+/(load|unload|reload)$`]: server,
        '/socket.io': { target: server, ws: true },
      },
    },
  }
})
