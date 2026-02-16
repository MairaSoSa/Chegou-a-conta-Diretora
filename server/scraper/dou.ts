import * as cheerio from "cheerio";

const IN_API_BASE_URL = "https://www.in.gov.br/consulta/-/buscar/dou";
const IN_WEB_BASE_URL = "https://www.in.gov.br/web/dou/-/";

export interface DOUResult {
  title: string;
  href: string;
  abstract: string;
  date: string;
  section: string;
  hierarchy: string;
  artType: string;
}

export interface DOUSearchResponse {
  ok: boolean;
  results: DOUResult[];
  total: number;
  message?: string;
  searchUrl?: string;
}

function formatDateBR(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export async function searchDOU(params: {
  query: string;
  exactMatch?: boolean;
  publishFrom?: string;
  publishTo?: string;
  sections?: string[];
  maxResults?: number;
}): Promise<DOUSearchResponse> {
  try {
    const { query, exactMatch = false, publishFrom, publishTo, maxResults = 20 } = params;

    const searchTerm = exactMatch ? `"${query}"` : query;

    const searchParams = new URLSearchParams();
    searchParams.set("q", searchTerm);
    searchParams.set("sortType", "0");

    if (publishFrom && publishTo) {
      searchParams.set("exactDate", "personalizado");
      searchParams.set("publishFrom", publishFrom);
      searchParams.set("publishTo", publishTo);
    } else {
      const now = new Date();
      const oneYearAgo = new Date(now);
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      searchParams.set("exactDate", "personalizado");
      searchParams.set("publishFrom", formatDateBR(oneYearAgo));
      searchParams.set("publishTo", formatDateBR(now));
    }

    const searchUrl = `${IN_API_BASE_URL}?${searchParams.toString()}`;

    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Ro-DOU/0.7; +https://github.com/gestaogovbr/Ro-dou)",
        "Accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "Cache-Control": "no-cache",
      },
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      return {
        ok: true,
        results: [],
        total: 0,
        message: "Acesse o link abaixo para buscar diretamente no site do DOU.",
        searchUrl,
      };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const scriptTag = $(
      "script#_br_com_seatecnologia_in_buscadou_BuscaDouPortlet_params"
    );

    if (!scriptTag.length) {
      return {
        ok: true,
        results: [],
        total: 0,
        message: "Acesse o link abaixo para buscar diretamente no site do DOU.",
        searchUrl,
      };
    }

    const jsonText = scriptTag.contents().first().text();
    let parsed: any;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      return {
        ok: true,
        results: [],
        total: 0,
        message: "Acesse o link abaixo para buscar diretamente no site do DOU.",
        searchUrl,
      };
    }

    const jsonArray: any[] = parsed?.jsonArray || [];

    if (jsonArray.length === 0) {
      return {
        ok: true,
        results: [],
        total: 0,
        message: `Nenhuma publicação encontrada para "${query}" no DOU no último ano.`,
        searchUrl,
      };
    }

    const results: DOUResult[] = jsonArray.slice(0, maxResults).map((item: any) => ({
      title: item.title || "",
      href: item.urlTitle ? `${IN_WEB_BASE_URL}${item.urlTitle}` : "",
      abstract: cleanHtml(item.content || ""),
      date: item.pubDate || "",
      section: (item.pubName || "").toLowerCase(),
      hierarchy: item.hierarchyStr || "",
      artType: item.artType || "",
    }));

    return { ok: true, results, total: results.length, searchUrl };
  } catch (error: any) {
    const searchUrl = buildDOUSearchUrl(params.query);
    if (error.name === "TimeoutError" || error.name === "AbortError") {
      return {
        ok: true,
        results: [],
        total: 0,
        message: "O site do DOU demorou para responder. Tente novamente ou acesse diretamente.",
        searchUrl,
      };
    }
    return {
      ok: true,
      results: [],
      total: 0,
      message: "Não foi possível consultar o DOU. Busque diretamente no site oficial.",
      searchUrl,
    };
  }
}

function cleanHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

export function buildDOUSearchUrl(query: string): string {
  const params = new URLSearchParams({
    q: query,
    exactDate: "anydate",
    sortType: "0",
  });
  return `${IN_API_BASE_URL}?${params.toString()}`;
}

export async function searchDOUForNorma(normaTitle: string): Promise<DOUSearchResponse> {
  const simplified = normaTitle
    .replace(/\s+/g, " ")
    .trim();

  const result = await searchDOU({
    query: simplified,
    exactMatch: false,
    maxResults: 5,
  });

  if (result.results.length === 0) {
    result.searchUrl = buildDOUSearchUrl(simplified);
  }

  return result;
}
