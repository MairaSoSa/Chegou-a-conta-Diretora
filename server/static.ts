import express, { type Express, type Request, type Response, type NextFunction } from "express";
import fs from "fs";
import path from "path";

const GZIP_EXTS = new Set([".js", ".mjs", ".css"]);

const CONTENT_TYPES: Record<string, string> = {
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
};

function precompressedMiddleware(distPath: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    const ext = path.extname(req.path);
    if (!GZIP_EXTS.has(ext)) return next();
    const gzPath = path.join(distPath, req.path + ".gz");
    if (!fs.existsSync(gzPath)) return next();
    const ae = req.headers["accept-encoding"] ?? "";
    if (!ae.includes("gzip")) return next();
    res.setHeader("Content-Encoding", "gzip");
    res.setHeader("Content-Type", CONTENT_TYPES[ext] ?? "application/octet-stream");
    res.setHeader("Vary", "Accept-Encoding");
    res.sendFile(gzPath);
  };
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  if (process.env.NODE_ENV === "production") {
    app.use(precompressedMiddleware(distPath));
  }

  app.use(express.static(distPath));

  app.use("/{*path}", (req, res, next) => {
    if (req.path.startsWith("/assets/") || path.extname(req.path)) {
      return res.status(404).end();
    }
    return next();
  });

  app.use("/{*path}", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
