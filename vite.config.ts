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
  optimizeDeps: {
    include: [
      "recharts",
      "recharts/es6/component/ResponsiveContainer",
      "d3-shape",
      "d3-scale",
      "d3-color",
      "d3-interpolate",
      "d3-array",
      "d3-path",
      "d3-format",
      "d3-time",
      "d3-time-format",
    ],
  },
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules/pdfjs-dist")) return "vendor-pdf";
          // Keep react and react-dom together so react is always initialized
          // before react-dom — splitting them causes TDZ errors at runtime.
          if (
            id.includes("node_modules/react-dom") ||
            id.includes("node_modules/react/") ||
            id.includes("node_modules/react-is")
          ) return "vendor-react";
          // recharts gets its own chunk, separate from d3, so Rollup can
          // determine a safe initialization order between them.
          if (id.includes("node_modules/recharts")) return "vendor-recharts";
          // d3 sub-packages in their own chunk, loaded before recharts.
          if (id.includes("node_modules/d3-")) return "vendor-d3";
          if (id.includes("node_modules/react-simple-maps")) return "vendor-maps";
          if (id.includes("node_modules/@tiptap")) return "vendor-editor";
          if (id.includes("node_modules/framer-motion")) return "vendor-motion";
          if (id.includes("node_modules/xlsx")) return "vendor-xlsx";
          if (id.includes("node_modules/@radix-ui")) return "vendor-radix";
          if (id.includes("node_modules/lucide-react")) return "vendor-icons";
          if (id.includes("node_modules/@tanstack")) return "vendor-query";
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
