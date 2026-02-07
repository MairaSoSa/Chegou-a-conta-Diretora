import FlexSearch from "flexsearch";
import fs from "node:fs/promises";
import path from "node:path";
import { storage } from "../storage";

export interface KDoc {
  id: string;
  title: string;
  content: string;
  link?: string;
  addedAt?: number;
}

let index: any = null;
let docs: Record<string, KDoc> = {};

const ATTACHED_ASSETS_DIR = path.resolve(process.cwd(), "attached_assets");

function stripHtml(html: string): string {
  // Remove common navigation and UI elements
  let cleaned = html
    // Remove navigation menus
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    // Remove scripts and styles
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    // Remove common navigation patterns
    .replace(/Trilha\s+Programas\s+&\s+Políticas\s+Chat\s+IA\s+Caixa\s+de\s+Ferramentas\s+Dashboard\s+Quem\s+somos\s+&\s+Contato/gi, " ")
    .replace(/Começar\s+agora/gi, " ")
    .replace(/←\s*Voltar/gi, " ")
    // Remove HTML tags
    .replace(/<[^>]+>/g, " ")
    // Decode entities
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    // Clean up whitespace
    .replace(/\s+/g, " ")
    .trim();
  
  // Remove the site title prefix if present
  cleaned = cleaned.replace(/^[^:]+—\s*A\s+Conta\s+Chegou,\s+Diretora!\s*/i, "");
  
  return cleaned;
}

function extractTitle(html: string, fallback: string): string {
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch && titleMatch[1]) return titleMatch[1].trim();
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1Match && h1Match[1]) return h1Match[1].trim();
  return fallback;
}

export async function buildKnowledgeIndex() {
  index = new FlexSearch.Index({
    tokenize: "full",
    resolution: 9,
    context: {
      depth: 3,
      bidirectional: true,
      resolution: 9
    }
  });

  docs = {};

  const aiDocs = await storage.getAiDocuments();
  const glossary = await storage.getGlossary();
  const tools = await storage.getTools();
  const trilha = await storage.getTrilhaUnits();
  const programs = await storage.getPrograms();

  const programDetails = await Promise.all(
    programs.map(async (p) => ({
      code: p.code,
      details: await storage.getProgramDetails(p.code),
    }))
  );

  let idCounter = 1;

  const add = (title: string, content: string, link?: string, addedAt?: number) => {
    const id = `doc-${idCounter++}`;
    docs[id] = { id, title, content, link, addedAt };
    // Index both title and content together
    index.add(id, `${title} ${content}`);
  };

  for (const d of aiDocs) {
    add(d.title || "Documento", d.content || "", d.link || undefined, d.createdAt || undefined);
  }
  for (const g of glossary) add(g.term, g.explanation, "/glossario");
  for (const t of tools) add(t.title, t.description || "", "/ferramentas");
  for (const u of trilha) {
    const intro = u.intro ? `Introdução: ${u.intro}` : "";
    const content = [u.subtitle, intro].filter(Boolean).join("\n");
    add(`${u.unitId} - ${u.title}`, content || u.subtitle || "", `/trilha/${u.unitId}`);
  }
  for (const p of programs) {
    const details = programDetails.find((d) => d.code === p.code)?.details || [];
    const detailLines = details.map((d) => `${d.type}${d.category ? ` (${d.category})` : ""}: ${d.content}`);
    const summary = [
      `Descrição: ${p.description || "(sem descrição)"}`,
      `Status: ${p.status || "(sem status)"}`,
      ...detailLines,
    ].join("\n");
    add(`${p.code} - ${p.name}`, summary, `/programas/${p.code}`);
  }

  try {
    const entries = await fs.readdir(ATTACHED_ASSETS_DIR);
    const htmlFiles = entries.filter((name) => name.toLowerCase().endsWith(".html"));
    for (const file of htmlFiles) {
      const filePath = path.join(ATTACHED_ASSETS_DIR, file);
      const raw = await fs.readFile(filePath, "utf8");
      const title = extractTitle(raw, file.replace(/\.html$/i, ""));
      const text = stripHtml(raw);
      if (text.length > 0) {
        add(`Página: ${title}`, text);
      }
    }
  } catch (error) {
    console.warn("[Knowledge Index] Failed to read attached_assets HTML:", error);
  }

  return { count: Object.keys(docs).length };
}

export async function searchKnowledge(q: string, limit = 5) {
  if (!index) return [];
  if (!q || q.trim().length === 0) return [];
  
  try {
    const results: string[] = (await index.searchAsync(q, { limit: limit * 2 })) as string[];
    return results.slice(0, limit).map((id) => docs[id]).filter(Boolean);
  } catch (error) {
    console.error("[Knowledge Search] Error:", error);
    return [];
  }
}

export function getIndexedDocsCount() {
  return Object.keys(docs).length;
}
