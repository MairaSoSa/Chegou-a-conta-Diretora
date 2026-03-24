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
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Truly isolated packages with no React/d3 dependencies.
          if (id.includes("node_modules/pdfjs-dist")) return "vendor-pdf";
          if (id.includes("node_modules/xlsx")) return "vendor-xlsx";

          // Large but standalone packages: they only import FROM vendor-react,
          // never referenced back by vendor-react, so no circular dep.
          if (id.includes("node_modules/recharts")) return "vendor-recharts";
          if (id.includes("node_modules/react-simple-maps")) return "vendor-maps";
          if (id.includes("node_modules/@tiptap")) return "vendor-editor";
          if (id.includes("node_modules/framer-motion")) return "vendor-motion";

          // Everything else — React, react-dom, scheduler, d3-*, @radix-ui,
          // lucide-react, @tanstack, wouter, zod, date-fns, sonner, etc. —
          // all lives in ONE chunk. This eliminates every cross-chunk circular
          // dependency (d3 ↔ React, misc helpers ↔ React) that causes:
          //   TypeError: Cannot set properties of undefined (setting 'Children')
          if (id.includes("node_modules/")) return "vendor-react";
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
