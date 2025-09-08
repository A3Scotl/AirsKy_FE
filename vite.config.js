import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import compression from "vite-plugin-compression";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: "automatic",
    }),
    tailwindcss(),
    // nén gzip
    compression({
      algorithm: "gzip",
      ext: ".gz",
      threshold: 10240,
    }),
    // nén brotli (mạnh hơn gzip)
    compression({
      algorithm: "brotliCompress",
      ext: ".br",
      threshold: 10240,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: false, // tắt source map để giảm size (bật lại nếu cần debug)
    cssCodeSplit: true, // tách CSS cho từng page (giúp load nhanh hơn)
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
            "framer-motion",
          ],
          "utils-vendor": [
            "axios",
            "lodash",
            "clsx",
            "tailwind-merge",
            "class-variance-authority",
          ],
          "editor-vendor": [
            "@ckeditor/ckeditor5-build-classic",
            "@ckeditor/ckeditor5-react",
          ],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    target: "es2015",
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom"],
  },
});
