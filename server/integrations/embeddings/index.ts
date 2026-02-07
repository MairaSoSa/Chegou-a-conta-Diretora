import OpenAI from "openai";
import pLimit from "p-limit";
import { storage } from "../../storage";
import type { AiDocument } from "@shared/schema";

type EmbeddingSearchResult = {
  id: string;
  title: string;
  content: string;
  link?: string;
  addedAt?: number;
  score: number;
};

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL;
const OPENAI_EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";

const EMBEDDINGS_ENABLED = process.env.OPENAI_EMBEDDINGS_ENABLED !== "false";
const EMBEDDINGS_BATCH_LIMIT = parseInt(process.env.OPENAI_EMBEDDINGS_BATCH_LIMIT || "5", 10);

let openaiInstance: OpenAI | null = null;

function getOpenAI(): OpenAI | null {
  if (!OPENAI_API_KEY) return null;
  if (!openaiInstance) {
    openaiInstance = new OpenAI({
      apiKey: OPENAI_API_KEY,
      baseURL: OPENAI_BASE_URL,
    });
  }
  return openaiInstance;
}

export function areEmbeddingsEnabled(): boolean {
  return EMBEDDINGS_ENABLED && !!getOpenAI();
}

async function createEmbedding(text: string): Promise<number[] | null> {
  const openai = getOpenAI();
  if (!openai) return null;

  const response = await openai.embeddings.create({
    model: OPENAI_EMBEDDING_MODEL,
    input: text.slice(0, 8000),
  });

  const vector = response.data?.[0]?.embedding;
  if (!vector || !Array.isArray(vector)) return null;
  return vector as number[];
}

function parseEmbedding(value: string): number[] | null {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return null;
    return parsed.map((n) => Number(n));
  } catch {
    return null;
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function embedAndStoreAiDocument(doc: AiDocument): Promise<boolean> {
  if (!areEmbeddingsEnabled()) return false;
  const embedding = await createEmbedding(doc.content);
  if (!embedding) return false;
  await storage.upsertAiDocumentEmbedding(doc.id, embedding);
  return true;
}

export async function backfillAiDocumentEmbeddings(options?: {
  category?: string;
  limit?: number;
}) {
  if (!areEmbeddingsEnabled()) {
    return { created: 0, skipped: 0, errors: 0 };
  }

  const docs = await storage.getAiDocuments();
  const filtered = options?.category ? docs.filter((d) => d.category === options.category) : docs;
  const embeddings = await storage.getAiDocumentEmbeddings();
  const embeddedIds = new Set(embeddings.map((e) => e.documentId));

  const limit = pLimit(EMBEDDINGS_BATCH_LIMIT);
  let created = 0;
  let skipped = 0;
  let errors = 0;

  const candidates = options?.limit ? filtered.slice(0, options.limit) : filtered;

  await Promise.all(
    candidates.map((doc) =>
      limit(async () => {
        if (embeddedIds.has(doc.id)) {
          skipped += 1;
          return;
        }
        try {
          const ok = await embedAndStoreAiDocument(doc);
          if (ok) created += 1;
        } catch (error) {
          errors += 1;
          console.error("[embeddings] Failed to embed document", doc.id, error);
        }
      })
    )
  );

  return { created, skipped, errors };
}

export async function searchEmbeddings(query: string, limit = 5): Promise<EmbeddingSearchResult[]> {
  if (!areEmbeddingsEnabled()) return [];

  const queryEmbedding = await createEmbedding(query);
  if (!queryEmbedding) return [];

  const rows = await storage.getAiDocumentEmbeddingsWithDocuments();
  const scored: EmbeddingSearchResult[] = [];

  for (const row of rows) {
    const embedding = parseEmbedding(row.embedding.embedding);
    if (!embedding) continue;
    const score = cosineSimilarity(queryEmbedding, embedding);
    if (score <= 0) continue;
    scored.push({
      id: `doc-${row.document.id}`,
      title: row.document.title,
      content: row.document.content,
      link: row.document.link || undefined,
      addedAt: row.document.createdAt || undefined,
      score,
    });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}
