import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = import.meta.dirname ?? path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules/pdfjs-dist")) return "vendor-pdf";
          if (id.includes("node_modules/recharts") || id.includes("node_modules/d3-")) return "vendor-charts";
          if (id.includes("node_modules/react-simple-maps")) return "vendor-maps";
          if (id.includes("node_modules/@tiptap")) return "vendor-editor";
          if (id.includes("node_modules/framer-motion")) return "vendor-motion";
          if (id.includes("node_modules/xlsx")) return "vendor-xlsx";
          if (id.includes("node_modules/@radix-ui")) return "vendor-radix";
          if (id.includes("node_modules/lucide-react")) return "vendor-icons";
          if (id.includes("node_modules/@tanstack")) return "vendor-query";
          if (id.includes("node_modules/react-dom")) return "vendor-react-dom";
          if (id.includes("node_modules/react")) return "vendor-react";
          if (id.includes("node_modules/")) return "vendor-misc";
        },
      },
    },
  },
  server: {
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
