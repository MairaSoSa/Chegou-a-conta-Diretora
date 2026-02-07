import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "@shared/schema";
import path from "path";

const dbPath = process.env.DATABASE_URL?.replace("file:", "") || "dev.db";
const resolvedPath = path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath);

export const sqlite = new Database(resolvedPath);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });

export function ensureAiDocumentsCreatedAtColumn(): void {
	try {
		const table = sqlite
			.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='ai_documents'")
			.get();
		if (!table) return;

		const columns = sqlite.prepare("PRAGMA table_info(ai_documents)").all() as Array<{ name: string }>;
		const hasCreatedAt = columns.some((col) => col.name === "created_at");
		if (!hasCreatedAt) {
			sqlite.prepare("ALTER TABLE ai_documents ADD COLUMN created_at INTEGER").run();
			sqlite.prepare("UPDATE ai_documents SET created_at = ? WHERE created_at IS NULL").run(Date.now());
		}
	} catch (error) {
		console.error("Failed to ensure ai_documents created_at column:", error);
	}
}

export function ensureAiDocumentsLinkColumn(): void {
	try {
		const table = sqlite
			.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='ai_documents'")
			.get();
		if (!table) return;

		const columns = sqlite.prepare("PRAGMA table_info(ai_documents)").all() as Array<{ name: string }>;
		const hasLink = columns.some((col) => col.name === "link");
		if (!hasLink) {
			sqlite.prepare("ALTER TABLE ai_documents ADD COLUMN link TEXT").run();
		}
	} catch (error) {
		console.error("Failed to ensure ai_documents link column:", error);
	}
}
