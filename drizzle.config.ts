import { defineConfig } from "drizzle-kit";
import path from "path";

const dbPath = process.env.DATABASE_URL?.replace("file:", "") || "dev.db";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: dbPath,
  },
});
