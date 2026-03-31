import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { ensureAiDocumentsCreatedAtColumn, ensureAiDocumentsLinkColumn, ensureCadernoTables } from "./db";
import { serveStatic } from "./static";
import { createServer } from "http";
import { startMecNormasScheduler } from "./integrations/mecnormas";
import { getCensoEstatisticas, getMediasNacionais, getLocalStats, warmFromDBCache } from "./importador";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    limit: "200mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false, limit: "200mb" }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        const jsonStr = JSON.stringify(capturedJsonResponse);
        logLine += ` :: ${jsonStr.length > 200 ? jsonStr.substring(0, 200) + '...' : jsonStr}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  ensureAiDocumentsCreatedAtColumn();
  ensureAiDocumentsLinkColumn();
  ensureCadernoTables();
  await registerRoutes(httpServer, app);
  startMecNormasScheduler();

  // Seed desabilitado - para popular novamente: npm run db:seed
  // try {
  //   await seedDatabase();
  //   log("Database seeded successfully");
  // } catch (e) {
  //   log(`Database seeding error: ${e}`);
  // }

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
      const warmCache = async () => {
        log("Pre-warming stats cache in background...");
        try {
          // 1. Carrega cache persistente do banco na memória (evita recalcular 60s após restart)
          const dbLoaded = await warmFromDBCache();
          if (dbLoaded > 0) log(`  ${dbLoaded} entradas recuperadas do cache persistente`);

          // 2. Recalcula apenas o que não veio do banco (ou está desatualizado)
          await getLocalStats();
          log("  local stats cached");
          for (const ano of [2025, 2024, 2023, 2022, 2021, 2020]) {
            await new Promise(r => setTimeout(r, 100));
            await getCensoEstatisticas(ano);
            log(`  censo ${ano} cached`);
          }
          await new Promise(r => setTimeout(r, 100));
          await getMediasNacionais();
          log("Stats cache warmed successfully");
        } catch (e) {
          log(`Cache warming error (non-fatal): ${e}`);
        }
      };
      setTimeout(warmCache, 3000);
    },
  );
})();
