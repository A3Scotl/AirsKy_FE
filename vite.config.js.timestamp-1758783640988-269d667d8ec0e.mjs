// vite.config.js
import { defineConfig } from "file:///C:/Users/ADMIN/Desktop/KLTN/FE%20-%20Flight%20Booking/AirsKy_FE/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/ADMIN/Desktop/KLTN/FE%20-%20Flight%20Booking/AirsKy_FE/node_modules/@vitejs/plugin-react/dist/index.js";
import tailwindcss from "file:///C:/Users/ADMIN/Desktop/KLTN/FE%20-%20Flight%20Booking/AirsKy_FE/node_modules/@tailwindcss/vite/dist/index.mjs";
import compression from "file:///C:/Users/ADMIN/Desktop/KLTN/FE%20-%20Flight%20Booking/AirsKy_FE/node_modules/vite-plugin-compression/dist/index.mjs";
import { fileURLToPath } from "url";
import path from "path";
var __vite_injected_original_import_meta_url = "file:///C:/Users/ADMIN/Desktop/KLTN/FE%20-%20Flight%20Booking/AirsKy_FE/vite.config.js";
var __filename = fileURLToPath(__vite_injected_original_import_meta_url);
var __dirname = path.dirname(__filename);
var vite_config_default = defineConfig({
  plugins: [
    react({
      jsxRuntime: "automatic"
    }),
    tailwindcss(),
    // nén gzip
    compression({
      algorithm: "gzip",
      ext: ".gz",
      threshold: 10240
    }),
    // nén brotli (mạnh hơn gzip)
    compression({
      algorithm: "brotliCompress",
      ext: ".br",
      threshold: 10240
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  build: {
    sourcemap: false,
    // tắt source map để giảm size (bật lại nếu cần debug)
    cssCodeSplit: true,
    // tách CSS cho từng page (giúp load nhanh hơn)
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-vendor": [
            "@radix-ui/react-avatar",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-collapsible",
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-label",
            "@radix-ui/react-progress",
            "@radix-ui/react-select",
            "@radix-ui/react-separator",
            "@radix-ui/react-slot",
            "@radix-ui/react-tooltip",
            "lucide-react",
            "framer-motion"
          ],
          "utils-vendor": [
            "axios",
            "lodash",
            "clsx",
            "tailwind-merge",
            "class-variance-authority"
          ],
          "editor-vendor": [
            "@ckeditor/ckeditor5-build-classic",
            "@ckeditor/ckeditor5-react"
          ]
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxBRE1JTlxcXFxEZXNrdG9wXFxcXEtMVE5cXFxcRkUgLSBGbGlnaHQgQm9va2luZ1xcXFxBaXJzS3lfRkVcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXEFETUlOXFxcXERlc2t0b3BcXFxcS0xUTlxcXFxGRSAtIEZsaWdodCBCb29raW5nXFxcXEFpcnNLeV9GRVxcXFx2aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvQURNSU4vRGVza3RvcC9LTFROL0ZFJTIwLSUyMEZsaWdodCUyMEJvb2tpbmcvQWlyc0t5X0ZFL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3RcIjtcbmltcG9ydCB0YWlsd2luZGNzcyBmcm9tIFwiQHRhaWx3aW5kY3NzL3ZpdGVcIjtcbmltcG9ydCBjb21wcmVzc2lvbiBmcm9tIFwidml0ZS1wbHVnaW4tY29tcHJlc3Npb25cIjtcbmltcG9ydCB7IGZpbGVVUkxUb1BhdGggfSBmcm9tIFwidXJsXCI7XG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuXG5jb25zdCBfX2ZpbGVuYW1lID0gZmlsZVVSTFRvUGF0aChpbXBvcnQubWV0YS51cmwpO1xuY29uc3QgX19kaXJuYW1lID0gcGF0aC5kaXJuYW1lKF9fZmlsZW5hbWUpO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAgcmVhY3Qoe1xuICAgICAganN4UnVudGltZTogXCJhdXRvbWF0aWNcIixcbiAgICB9KSxcbiAgICB0YWlsd2luZGNzcygpLFxuICAgIC8vIG5cdTAwRTluIGd6aXBcbiAgICBjb21wcmVzc2lvbih7XG4gICAgICBhbGdvcml0aG06IFwiZ3ppcFwiLFxuICAgICAgZXh0OiBcIi5nelwiLFxuICAgICAgdGhyZXNob2xkOiAxMDI0MCxcbiAgICB9KSxcbiAgICAvLyBuXHUwMEU5biBicm90bGkgKG1cdTFFQTFuaCBoXHUwMUExbiBnemlwKVxuICAgIGNvbXByZXNzaW9uKHtcbiAgICAgIGFsZ29yaXRobTogXCJicm90bGlDb21wcmVzc1wiLFxuICAgICAgZXh0OiBcIi5iclwiLFxuICAgICAgdGhyZXNob2xkOiAxMDI0MCxcbiAgICB9KSxcbiAgXSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcbiAgICB9LFxuICB9LFxuICBidWlsZDoge1xuICAgIHNvdXJjZW1hcDogZmFsc2UsIC8vIHRcdTFFQUZ0IHNvdXJjZSBtYXAgXHUwMTExXHUxRUMzIGdpXHUxRUEzbSBzaXplIChiXHUxRUFEdCBsXHUxRUExaSBuXHUxRUJGdSBjXHUxRUE3biBkZWJ1ZylcbiAgICBjc3NDb2RlU3BsaXQ6IHRydWUsIC8vIHRcdTAwRTFjaCBDU1MgY2hvIHRcdTFFRUJuZyBwYWdlIChnaVx1MDBGQXAgbG9hZCBuaGFuaCBoXHUwMUExbilcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB7XG4gICAgICAgICAgXCJyZWFjdC12ZW5kb3JcIjogW1wicmVhY3RcIiwgXCJyZWFjdC1kb21cIiwgXCJyZWFjdC1yb3V0ZXItZG9tXCJdLFxuICAgICAgICAgIFwidWktdmVuZG9yXCI6IFtcbiAgICAgICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LWF2YXRhclwiLFxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3QtY2hlY2tib3hcIixcbiAgICAgICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LWNvbGxhcHNpYmxlXCIsXG4gICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC1kaWFsb2dcIixcbiAgICAgICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LWRyb3Bkb3duLW1lbnVcIixcbiAgICAgICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LWxhYmVsXCIsXG4gICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC1wcm9ncmVzc1wiLFxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3Qtc2VsZWN0XCIsXG4gICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC1zZXBhcmF0b3JcIixcbiAgICAgICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LXNsb3RcIixcbiAgICAgICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LXRvb2x0aXBcIixcbiAgICAgICAgICAgIFwibHVjaWRlLXJlYWN0XCIsXG4gICAgICAgICAgICBcImZyYW1lci1tb3Rpb25cIixcbiAgICAgICAgICBdLFxuICAgICAgICAgIFwidXRpbHMtdmVuZG9yXCI6IFtcbiAgICAgICAgICAgIFwiYXhpb3NcIixcbiAgICAgICAgICAgIFwibG9kYXNoXCIsXG4gICAgICAgICAgICBcImNsc3hcIixcbiAgICAgICAgICAgIFwidGFpbHdpbmQtbWVyZ2VcIixcbiAgICAgICAgICAgIFwiY2xhc3MtdmFyaWFuY2UtYXV0aG9yaXR5XCIsXG4gICAgICAgICAgXSxcbiAgICAgICAgICBcImVkaXRvci12ZW5kb3JcIjogW1xuICAgICAgICAgICAgXCJAY2tlZGl0b3IvY2tlZGl0b3I1LWJ1aWxkLWNsYXNzaWNcIixcbiAgICAgICAgICAgIFwiQGNrZWRpdG9yL2NrZWRpdG9yNS1yZWFjdFwiLFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG4gICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAxMDAwLFxuICAgIHRhcmdldDogXCJlczIwMTVcIixcbiAgICBtaW5pZnk6IFwidGVyc2VyXCIsXG4gICAgdGVyc2VyT3B0aW9uczoge1xuICAgICAgY29tcHJlc3M6IHtcbiAgICAgICAgZHJvcF9jb25zb2xlOiB0cnVlLFxuICAgICAgICBkcm9wX2RlYnVnZ2VyOiB0cnVlLFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxuICBvcHRpbWl6ZURlcHM6IHtcbiAgICBpbmNsdWRlOiBbXCJyZWFjdFwiLCBcInJlYWN0LWRvbVwiLCBcInJlYWN0LXJvdXRlci1kb21cIl0sXG4gIH0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBaVgsU0FBUyxvQkFBb0I7QUFDOVksT0FBTyxXQUFXO0FBQ2xCLE9BQU8saUJBQWlCO0FBQ3hCLE9BQU8saUJBQWlCO0FBQ3hCLFNBQVMscUJBQXFCO0FBQzlCLE9BQU8sVUFBVTtBQUxzTixJQUFNLDJDQUEyQztBQU94UixJQUFNLGFBQWEsY0FBYyx3Q0FBZTtBQUNoRCxJQUFNLFlBQVksS0FBSyxRQUFRLFVBQVU7QUFFekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLE1BQ0osWUFBWTtBQUFBLElBQ2QsQ0FBQztBQUFBLElBQ0QsWUFBWTtBQUFBO0FBQUEsSUFFWixZQUFZO0FBQUEsTUFDVixXQUFXO0FBQUEsTUFDWCxLQUFLO0FBQUEsTUFDTCxXQUFXO0FBQUEsSUFDYixDQUFDO0FBQUE7QUFBQSxJQUVELFlBQVk7QUFBQSxNQUNWLFdBQVc7QUFBQSxNQUNYLEtBQUs7QUFBQSxNQUNMLFdBQVc7QUFBQSxJQUNiLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxXQUFXLE9BQU87QUFBQSxJQUN0QztBQUFBLEVBQ0Y7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLFdBQVc7QUFBQTtBQUFBLElBQ1gsY0FBYztBQUFBO0FBQUEsSUFDZCxlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUEsUUFDTixjQUFjO0FBQUEsVUFDWixnQkFBZ0IsQ0FBQyxTQUFTLGFBQWEsa0JBQWtCO0FBQUEsVUFDekQsYUFBYTtBQUFBLFlBQ1g7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxVQUNGO0FBQUEsVUFDQSxnQkFBZ0I7QUFBQSxZQUNkO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFVBQ0Y7QUFBQSxVQUNBLGlCQUFpQjtBQUFBLFlBQ2Y7QUFBQSxZQUNBO0FBQUEsVUFDRjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLElBQ0EsdUJBQXVCO0FBQUEsSUFDdkIsUUFBUTtBQUFBLElBQ1IsUUFBUTtBQUFBLElBQ1IsZUFBZTtBQUFBLE1BQ2IsVUFBVTtBQUFBLFFBQ1IsY0FBYztBQUFBLFFBQ2QsZUFBZTtBQUFBLE1BQ2pCO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLGNBQWM7QUFBQSxJQUNaLFNBQVMsQ0FBQyxTQUFTLGFBQWEsa0JBQWtCO0FBQUEsRUFDcEQ7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
