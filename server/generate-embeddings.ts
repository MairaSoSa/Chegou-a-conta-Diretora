import Database from "better-sqlite3";
import OpenAI from "openai";

const DB_PATH = process.env.SQLITE_DATABASE_URL?.replace("file:", "") || "dev.db";

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OPENAI_API_KEY not set");
    process.exit(1);
  }

  const openai = new OpenAI({ apiKey });
  const db = new Database(DB_PATH);

  const docs = db.prepare("SELECT id, title, content FROM ai_documents").all() as any[];
  console.log(`Found ${docs.length} documents to embed.`);

  const upsert = db.prepare(`
    INSERT INTO ai_document_embeddings (document_id, embedding, created_at, updated_at) 
    VALUES (?, ?, ?, ?)
    ON CONFLICT(document_id) DO UPDATE SET embedding = excluded.embedding, updated_at = excluded.updated_at
  `);

  let success = 0;
  for (const doc of docs) {
    try {
      const text = `${doc.title}\n\n${doc.content}`.substring(0, 8000);
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
      });
      const embedding = JSON.stringify(response.data[0].embedding);
      const now = Date.now();
      upsert.run(doc.id, embedding, now, now);
      success++;
      console.log(`✅ [${success}/${docs.length}] ${doc.title}`);
    } catch (e: any) {
      console.error(`❌ Failed: ${doc.title} - ${e.message}`);
    }
  }

  console.log(`\nDone! ${success}/${docs.length} embeddings generated.`);
  db.close();
}

main().catch(console.error);
