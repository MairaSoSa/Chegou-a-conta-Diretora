import { defineConfig } from "drizzle-kit";
import path from "path";

const dbPath = (process.env.SQLITE_DATABASE_URL || "file:dev.db").replace("file:", "");

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: dbPath,
  },
});
