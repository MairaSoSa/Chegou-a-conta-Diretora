import pLimit from "p-limit";
import pRetry from "p-retry";
import * as cheerio from "cheerio";
import { PDFParse } from "pdf-parse";
import { storage } from "../../storage";
import { embedAndStoreAiDocument, areEmbeddingsEnabled } from "../embeddings";

type MecNormasListResponse = {
  total?: number;
  totalElements?: number;
  totalRegistros?: number;
  totalCount?: number;
  entidades?: Array<{ id: number | string }>;
  content?: Array<{ id: number | string }>;
};

type MecNormasDetail = {
  id?: number | string;
  titulo?: string;
  tituloAto?: string;
  identificacao?: string;
  ementa?: string;
  resumo?: string;
  disponivelEm?: string;
  disponivel_em?: string;
  numero?: string | number;
  numeroAto?: string | number;
  dataPublicacao?: string;
  dataPublicacaoAto?: string;
  tipo?: { id?: number | string; nome?: string; descricao?: string };
  assunto?: { id?: number | string; nome?: string; descricao?: string };
  unidade?: { id?: number | string; nome?: string; descricao?: string };
};

export type MecNormasSyncOptions = {
  buscaTextual?: string;
  exata?: boolean;
  tipo?: number | string;
  assunto?: number | string;
  unidade?: number | string;
  ordenacao?: number | string;
  pageSize?: number;
  currentPage?: number;
  maxPages?: number;
};

const BASE_URL = "https://mecnormas.mec.gov.br/pesquisa/api";
const DEFAULT_PAGE_SIZE = parseInt(process.env.MECNORMAS_PAGE_SIZE || "10", 10);
const DEFAULT_EXATA = process.env.MECNORMAS_EXATA ? process.env.MECNORMAS_EXATA === "true" : false;
const DEFAULT_MAX_PAGES = process.env.MECNORMAS_MAX_PAGES ? parseInt(process.env.MECNORMAS_MAX_PAGES, 10) : undefined;
const MAX_TEXT_CHARS = parseInt(process.env.MECNORMAS_MAX_TEXT_CHARS || "60000", 10);
const FETCH_CONCURRENCY = parseInt(process.env.MECNORMAS_FETCH_CONCURRENCY || "2", 10);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchJson<T>(url: string): Promise<T> {
  return pRetry(
    async () => {
      const response = await fetch(url, { headers: { "User-Agent": "chegou-a-conta-bot" } });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return (await response.json()) as T;
    },
    { retries: 3 }
  );
}

async function fetchText(url: string): Promise<{ text: string; contentType: string }> {
  return pRetry(
    async () => {
      const response = await fetch(url, { headers: { "User-Agent": "chegou-a-conta-bot" } });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/pdf")) {
        const buffer = Buffer.from(await response.arrayBuffer());
        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        return { text: result.text || "", contentType };
      }
      const text = await response.text();
      return { text, contentType };
    },
    { retries: 3 }
  );
}

function resolveTotal(payload: MecNormasListResponse): number {
  return (
    payload.total ??
    payload.totalElements ??
    payload.totalRegistros ??
    payload.totalCount ??
    0
  );
}

function resolveEntities(payload: MecNormasListResponse): Array<{ id: number | string }> {
  if (Array.isArray(payload.entidades)) return payload.entidades;
  if (Array.isArray(payload.content)) return payload.content;
  return [];
}

function coerceId(id: number | string | undefined): string | null {
  if (id === undefined || id === null) return null;
  return String(id).trim();
}

function cleanText(text: string): string {
  return text.replace(/\s+/g, " ").replace(/\u00a0/g, " ").trim();
}

function stripHtml(html: string): string {
  const $ = cheerio.load(html);
  $("script, style, nav, header, footer").remove();
  return cleanText($("body").text() || "");
}

function buildMetaLine(label: string, value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  return `${label}: ${String(value).trim()}`;
}

function resolveDetailTitle(detail: MecNormasDetail, fallbackId?: string | null): string {
  return (
    detail.titulo ||
    detail.tituloAto ||
    detail.identificacao ||
    (fallbackId ? `Ato ${fallbackId}` : "Ato MEC Normas")
  );
}

function resolveDisponivelEm(detail: MecNormasDetail): string | null {
  return detail.disponivelEm || detail.disponivel_em || null;
}

function buildAtoMetadata(detail: MecNormasDetail, atoId?: string | null): string {
  const lines: string[] = [];
  lines.push(buildMetaLine("Ato", atoId || detail.id) || "");
  lines.push(buildMetaLine("Numero", detail.numero || detail.numeroAto) || "");
  lines.push(buildMetaLine("Tipo", detail.tipo?.nome || detail.tipo?.descricao || detail.tipo?.id) || "");
  lines.push(buildMetaLine("Assunto", detail.assunto?.nome || detail.assunto?.descricao || detail.assunto?.id) || "");
  lines.push(buildMetaLine("Unidade", detail.unidade?.nome || detail.unidade?.descricao || detail.unidade?.id) || "");
  lines.push(buildMetaLine("Data", detail.dataPublicacao || detail.dataPublicacaoAto) || "");
  lines.push(buildMetaLine("Ementa", detail.ementa || detail.resumo) || "");
  return lines.filter(Boolean).join("\n");
}

function chunkText(text: string, maxChars = 1200, overlap = 150): string[] {
  if (!text) return [];
  const normalized = text.replace(/\r\n/g, "\n");
  const paragraphs = normalized.split(/\n{2,}/);
  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    const piece = paragraph.trim();
    if (!piece) continue;
    if ((current + "\n\n" + piece).trim().length <= maxChars) {
      current = (current ? `${current}\n\n${piece}` : piece).trim();
      continue;
    }

    if (current) {
      chunks.push(current);
      const overlapText = current.slice(Math.max(0, current.length - overlap));
      current = overlapText ? `${overlapText}\n\n${piece}`.trim() : piece;
    } else {
      chunks.push(piece.slice(0, maxChars));
      current = piece.slice(Math.max(0, piece.length - overlap));
    }
  }

  if (current) chunks.push(current.trim());
  return chunks.filter(Boolean);
}

async function fetchAtoList(options: MecNormasSyncOptions, currentPage: number) {
  const url = new URL(`${BASE_URL}/atos`);
  const params = url.searchParams;
  if (options.buscaTextual) params.set("buscaTextual", options.buscaTextual);
  params.set("exata", String(options.exata ?? DEFAULT_EXATA));
  if (options.tipo) params.set("tipo", String(options.tipo));
  if (options.assunto) params.set("assunto", String(options.assunto));
  if (options.unidade) params.set("unidade", String(options.unidade));
  if (options.ordenacao) params.set("ordenacao", String(options.ordenacao));
  params.set("pageSize", String(options.pageSize || DEFAULT_PAGE_SIZE));
  params.set("currentPage", String(currentPage));

  const data = await fetchJson<MecNormasListResponse>(url.toString());
  return {
    total: resolveTotal(data),
    entities: resolveEntities(data),
  };
}

async function fetchAtoDetail(atoId: string): Promise<MecNormasDetail> {
  const url = `${BASE_URL}/atos/${atoId}`;
  return fetchJson<MecNormasDetail>(url);
}

async function extractTextFromDisponivelEm(link: string): Promise<string> {
  const { text, contentType } = await fetchText(link);
  let cleaned = text;

  if (contentType.includes("text/html")) {
    cleaned = stripHtml(text);
  }

  cleaned = cleanText(cleaned);
  if (cleaned.length > MAX_TEXT_CHARS) {
    cleaned = cleaned.slice(0, MAX_TEXT_CHARS);
  }
  return cleaned;
}

function buildDocumentTitle(baseTitle: string, atoId: string, partIndex: number, totalParts: number): string {
  const partLabel = totalParts > 1 ? `Parte ${partIndex + 1}` : "Texto";
  return `${baseTitle} (Ato ${atoId}) - ${partLabel}`.trim();
}

export async function syncMecNormas(options: MecNormasSyncOptions = {}) {
  const pageSize = options.pageSize || DEFAULT_PAGE_SIZE;
  const maxPages = options.maxPages ?? DEFAULT_MAX_PAGES;

  let currentPage = options.currentPage || 1;
  let total = 0;

  const stats = {
    pagesFetched: 0,
    atosSeen: 0,
    atosWithLink: 0,
    atosWithText: 0,
    docsCreated: 0,
    docsSkipped: 0,
    errors: 0,
  };

  const limit = pLimit(FETCH_CONCURRENCY);

  while (true) {
    const { total: pageTotal, entities } = await fetchAtoList({ ...options, pageSize }, currentPage);
    if (stats.pagesFetched === 0) total = pageTotal;
    stats.pagesFetched += 1;

    if (!entities.length) break;

    const tasks = entities.map((entity) =>
      limit(async () => {
        const atoId = coerceId(entity.id);
        if (!atoId) {
          stats.docsSkipped += 1;
          return;
        }

        stats.atosSeen += 1;

        try {
          const detail = await fetchAtoDetail(atoId);
          const link = resolveDisponivelEm(detail);
          if (!link) {
            stats.docsSkipped += 1;
            return;
          }
          stats.atosWithLink += 1;

          const text = await extractTextFromDisponivelEm(link);
          if (!text) {
            stats.docsSkipped += 1;
            return;
          }

          stats.atosWithText += 1;

          const title = resolveDetailTitle(detail, atoId);
          const meta = buildAtoMetadata(detail, atoId);
          const fullText = meta ? `${meta}\n\n${text}` : text;
          const chunks = chunkText(fullText, 1200, 150);

          await storage.deleteAiDocumentsByLinkAndCategory(link, "mecnormas");

          const totalParts = chunks.length || 1;
          const parts = chunks.length ? chunks : [fullText];

          for (let i = 0; i < parts.length; i += 1) {
            const chunk = parts[i];
            const doc = await storage.createAiDocument({
              title: buildDocumentTitle(title, atoId, i, totalParts),
              content: chunk,
              category: "mecnormas",
              link,
              sortOrder: 0,
            });
            if (areEmbeddingsEnabled()) {
              try {
                await embedAndStoreAiDocument(doc);
              } catch (error) {
                console.error("[mecnormas] Failed to embed document", doc.id, error);
              }
            }
            stats.docsCreated += 1;
          }
        } catch (error) {
          stats.errors += 1;
          console.error("[mecnormas] Failed to sync ato", atoId, error);
        }
      })
    );

    await Promise.allSettled(tasks);

    if (total && currentPage * pageSize >= total) break;
    if (maxPages && currentPage >= maxPages) break;

    currentPage += 1;
    await sleep(200);
  }

  return { total, pageSize, currentPage, ...stats };
}

export async function fetchMecNormasFilters() {
  const [tipos, assuntos, unidades, ordenacoes] = await Promise.all([
    fetchJson(`${BASE_URL}/tipos-ato`),
    fetchJson(`${BASE_URL}/assuntos`),
    fetchJson(`${BASE_URL}/unidades`),
    fetchJson(`${BASE_URL}/ordenacoes`),
  ]);

  return { tipos, assuntos, unidades, ordenacoes };
}

export function startMecNormasScheduler(): void {
  const enabled = process.env.MECNORMAS_SYNC_ENABLED === "true";
  if (!enabled) return;

  const intervalMinutes = parseInt(process.env.MECNORMAS_SYNC_INTERVAL_MINUTES || "1440", 10);
  const runOnStart = process.env.MECNORMAS_SYNC_ON_START !== "false";

  const runSync = async () => {
    try {
      await syncMecNormas({
        buscaTextual: process.env.MECNORMAS_BUSCA_TEXTUAL,
        exata: process.env.MECNORMAS_EXATA ? process.env.MECNORMAS_EXATA === "true" : undefined,
        tipo: process.env.MECNORMAS_TIPO_ID,
        assunto: process.env.MECNORMAS_ASSUNTO_ID,
        unidade: process.env.MECNORMAS_UNIDADE_ID,
        ordenacao: process.env.MECNORMAS_ORDENACAO_ID,
      });
    } catch (error) {
      console.error("[mecnormas] Scheduled sync failed:", error);
    }
  };

  if (runOnStart) {
    void runSync();
  }

  setInterval(() => {
    void runSync();
  }, intervalMinutes * 60 * 1000);
}
