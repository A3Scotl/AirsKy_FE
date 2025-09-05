// vite.config.js
import { defineConfig } from "file:///C:/Users/ADMIN/Desktop/Kh%C3%B3a%20lu%E1%BA%ADn%20t%E1%BB%91t%20nghi%E1%BB%87p/FE%20-%20Flight%20Booking/AirsKy_FE/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/ADMIN/Desktop/Kh%C3%B3a%20lu%E1%BA%ADn%20t%E1%BB%91t%20nghi%E1%BB%87p/FE%20-%20Flight%20Booking/AirsKy_FE/node_modules/@vitejs/plugin-react/dist/index.js";
import tailwindcss from "file:///C:/Users/ADMIN/Desktop/Kh%C3%B3a%20lu%E1%BA%ADn%20t%E1%BB%91t%20nghi%E1%BB%87p/FE%20-%20Flight%20Booking/AirsKy_FE/node_modules/@tailwindcss/vite/dist/index.mjs";
import compression from "file:///C:/Users/ADMIN/Desktop/Kh%C3%B3a%20lu%E1%BA%ADn%20t%E1%BB%91t%20nghi%E1%BB%87p/FE%20-%20Flight%20Booking/AirsKy_FE/node_modules/vite-plugin-compression/dist/index.mjs";
import { fileURLToPath } from "url";
import path from "path";
var __vite_injected_original_import_meta_url = "file:///C:/Users/ADMIN/Desktop/Kh%C3%B3a%20lu%E1%BA%ADn%20t%E1%BB%91t%20nghi%E1%BB%87p/FE%20-%20Flight%20Booking/AirsKy_FE/vite.config.js";
var __filename = fileURLToPath(__vite_injected_original_import_meta_url);
var __dirname = path.dirname(__filename);
var vite_config_default = defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    compression({
      algorithm: "gzip",
      ext: ".gz",
      threshold: 10240
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-vendor": ["@radix-ui/react-avatar", "@radix-ui/react-checkbox", "@radix-ui/react-collapsible", "@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu", "@radix-ui/react-label", "@radix-ui/react-progress", "@radix-ui/react-select", "@radix-ui/react-separator", "@radix-ui/react-slot", "@radix-ui/react-tooltip", "lucide-react", "framer-motion"],
          "utils-vendor": ["axios", "lodash", "clsx", "tailwind-merge", "class-variance-authority"]
          // 'editor-vendor': ['']
        }
      }
    },
    chunkSizeWarningLimit: 1e3,
    target: "es2015",
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom"]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxBRE1JTlxcXFxEZXNrdG9wXFxcXEtoXHUwMEYzYSBsdVx1MUVBRG4gdFx1MUVEMXQgbmdoaVx1MUVDN3BcXFxcRkUgLSBGbGlnaHQgQm9va2luZ1xcXFxBaXJzS3lfRkVcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXEFETUlOXFxcXERlc2t0b3BcXFxcS2hcdTAwRjNhIGx1XHUxRUFEbiB0XHUxRUQxdCBuZ2hpXHUxRUM3cFxcXFxGRSAtIEZsaWdodCBCb29raW5nXFxcXEFpcnNLeV9GRVxcXFx2aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvQURNSU4vRGVza3RvcC9LaCVDMyVCM2ElMjBsdSVFMSVCQSVBRG4lMjB0JUUxJUJCJTkxdCUyMG5naGklRTElQkIlODdwL0ZFJTIwLSUyMEZsaWdodCUyMEJvb2tpbmcvQWlyc0t5X0ZFL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIlxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiXG5pbXBvcnQgdGFpbHdpbmRjc3MgZnJvbSBcIkB0YWlsd2luZGNzcy92aXRlXCJcbmltcG9ydCBjb21wcmVzc2lvbiBmcm9tICd2aXRlLXBsdWdpbi1jb21wcmVzc2lvbidcbmltcG9ydCB7IGZpbGVVUkxUb1BhdGggfSBmcm9tICd1cmwnXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xuXG5jb25zdCBfX2ZpbGVuYW1lID0gZmlsZVVSTFRvUGF0aChpbXBvcnQubWV0YS51cmwpXG5jb25zdCBfX2Rpcm5hbWUgPSBwYXRoLmRpcm5hbWUoX19maWxlbmFtZSlcblxuLy8gaHR0cHM6Ly92aXRlLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAgcmVhY3QoKSxcbiAgICB0YWlsd2luZGNzcygpLFxuICAgIGNvbXByZXNzaW9uKHtcbiAgICAgIGFsZ29yaXRobTogJ2d6aXAnLFxuICAgICAgZXh0OiAnLmd6JyxcbiAgICAgIHRocmVzaG9sZDogMTAyNDBcbiAgICB9KVxuICBdLFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxuICAgIH0sXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIG1hbnVhbENodW5rczoge1xuICAgICAgICAgICdyZWFjdC12ZW5kb3InOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbScsICdyZWFjdC1yb3V0ZXItZG9tJ10sXG4gICAgICAgICAgJ3VpLXZlbmRvcic6IFsnQHJhZGl4LXVpL3JlYWN0LWF2YXRhcicsICdAcmFkaXgtdWkvcmVhY3QtY2hlY2tib3gnLCAnQHJhZGl4LXVpL3JlYWN0LWNvbGxhcHNpYmxlJywgJ0ByYWRpeC11aS9yZWFjdC1kaWFsb2cnLCAnQHJhZGl4LXVpL3JlYWN0LWRyb3Bkb3duLW1lbnUnLCAnQHJhZGl4LXVpL3JlYWN0LWxhYmVsJywgJ0ByYWRpeC11aS9yZWFjdC1wcm9ncmVzcycsICdAcmFkaXgtdWkvcmVhY3Qtc2VsZWN0JywgJ0ByYWRpeC11aS9yZWFjdC1zZXBhcmF0b3InLCAnQHJhZGl4LXVpL3JlYWN0LXNsb3QnLCAnQHJhZGl4LXVpL3JlYWN0LXRvb2x0aXAnLCAnbHVjaWRlLXJlYWN0JywgJ2ZyYW1lci1tb3Rpb24nXSxcbiAgICAgICAgICAndXRpbHMtdmVuZG9yJzogWydheGlvcycsICdsb2Rhc2gnLCAnY2xzeCcsICd0YWlsd2luZC1tZXJnZScsICdjbGFzcy12YXJpYW5jZS1hdXRob3JpdHknXSxcbiAgICAgICAgICAvLyAnZWRpdG9yLXZlbmRvcic6IFsnJ11cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgXG4gICAgfSxcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDEwMDAsXG4gICAgdGFyZ2V0OiAnZXMyMDE1JyxcbiAgICBtaW5pZnk6ICd0ZXJzZXInLFxuICAgIHRlcnNlck9wdGlvbnM6IHtcbiAgICAgIGNvbXByZXNzOiB7XG4gICAgICAgIGRyb3BfY29uc29sZTogdHJ1ZSxcbiAgICAgICAgZHJvcF9kZWJ1Z2dlcjogdHJ1ZVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgaW5jbHVkZTogWydyZWFjdCcsICdyZWFjdC1kb20nLCAncmVhY3Qtcm91dGVyLWRvbSddXG4gIH1cbn0pXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQW9jLFNBQVMsb0JBQW9CO0FBQ2plLE9BQU8sV0FBVztBQUNsQixPQUFPLGlCQUFpQjtBQUN4QixPQUFPLGlCQUFpQjtBQUN4QixTQUFTLHFCQUFxQjtBQUM5QixPQUFPLFVBQVU7QUFMc1AsSUFBTSwyQ0FBMkM7QUFPeFQsSUFBTSxhQUFhLGNBQWMsd0NBQWU7QUFDaEQsSUFBTSxZQUFZLEtBQUssUUFBUSxVQUFVO0FBR3pDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLFlBQVk7QUFBQSxJQUNaLFlBQVk7QUFBQSxNQUNWLFdBQVc7QUFBQSxNQUNYLEtBQUs7QUFBQSxNQUNMLFdBQVc7QUFBQSxJQUNiLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxXQUFXLE9BQU87QUFBQSxJQUN0QztBQUFBLEVBQ0Y7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLGVBQWU7QUFBQSxNQUNiLFFBQVE7QUFBQSxRQUNOLGNBQWM7QUFBQSxVQUNaLGdCQUFnQixDQUFDLFNBQVMsYUFBYSxrQkFBa0I7QUFBQSxVQUN6RCxhQUFhLENBQUMsMEJBQTBCLDRCQUE0QiwrQkFBK0IsMEJBQTBCLGlDQUFpQyx5QkFBeUIsNEJBQTRCLDBCQUEwQiw2QkFBNkIsd0JBQXdCLDJCQUEyQixnQkFBZ0IsZUFBZTtBQUFBLFVBQzVWLGdCQUFnQixDQUFDLFNBQVMsVUFBVSxRQUFRLGtCQUFrQiwwQkFBMEI7QUFBQTtBQUFBLFFBRTFGO0FBQUEsTUFDRjtBQUFBLElBRUY7QUFBQSxJQUNBLHVCQUF1QjtBQUFBLElBQ3ZCLFFBQVE7QUFBQSxJQUNSLFFBQVE7QUFBQSxJQUNSLGVBQWU7QUFBQSxNQUNiLFVBQVU7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLGVBQWU7QUFBQSxNQUNqQjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxjQUFjO0FBQUEsSUFDWixTQUFTLENBQUMsU0FBUyxhQUFhLGtCQUFrQjtBQUFBLEVBQ3BEO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
