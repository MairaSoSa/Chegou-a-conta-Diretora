import * as cheerio from "cheerio";

const IN_SEARCH_URL = "https://www.in.gov.br/consulta/-/buscar/dou";
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

export function buildDOUSearchUrl(query: string, exactMatch = false): string {
  const searchTerm = exactMatch ? `"${query}"` : query;
  const params = new URLSearchParams({
    q: searchTerm,
    exactDate: "todos",
    sortType: "0",
  });
  return `${IN_SEARCH_URL}?${params.toString()}`;
}

const COMMON_HEADERS: Record<string, string> = {
  "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
  "Cache-Control": "no-cache",
  "Referer": "https://www.in.gov.br/consulta",
};

async function tryJsonApi(searchParams: URLSearchParams, maxResults: number): Promise<DOUResult[]> {
  try {
    const apiUrl = `https://www.in.gov.br/consulta/-/buscar/dou?${searchParams.toString()}`;
    const response = await fetch(apiUrl, {
      headers: {
        ...COMMON_HEADERS,
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "X-Requested-With": "XMLHttpRequest",
        "Cookie": "COOKIE_SUPPORT=true; GUEST_LANGUAGE_ID=pt_BR",
      },
      signal: AbortSignal.timeout(15000),
      redirect: "follow",
    });

    if (!response.ok) return [];

    const contentType = response.headers.get("content-type") || "";
    const body = await response.text();

    if (contentType.includes("application/json")) {
      const data = JSON.parse(body);
      const jsonArray: any[] = data?.jsonArray || [];
      if (jsonArray.length === 0) return [];
      return jsonArray.slice(0, maxResults).map(mapItem);
    }

    return tryParseHtml(body, maxResults);
  } catch {
    return [];
  }
}

async function tryHtmlScrape(searchUrl: string, maxResults: number): Promise<DOUResult[]> {
  try {
    const response = await fetch(searchUrl, {
      headers: {
        ...COMMON_HEADERS,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Cookie": "COOKIE_SUPPORT=true; GUEST_LANGUAGE_ID=pt_BR",
      },
      signal: AbortSignal.timeout(20000),
      redirect: "follow",
    });

    if (!response.ok) return [];

    const html = await response.text();
    return tryParseHtml(html, maxResults);
  } catch {
    return [];
  }
}

function tryParseHtml(html: string, maxResults: number): DOUResult[] {
  const $ = cheerio.load(html);

  const scriptIds = [
    "script#_br_com_seatecnologia_in_buscadou_BuscaDouPortlet_params",
    "script[id*='BuscaDou']",
    "script[id*='buscadou']",
    "script[id*='Portlet_params']",
  ];

  let jsonArray: any[] = [];

  for (const selector of scriptIds) {
    const scriptTag = $(selector);
    if (scriptTag.length) {
      const jsonText = scriptTag.contents().first().text();
      try {
        const parsed = JSON.parse(jsonText);
        jsonArray = parsed?.jsonArray || [];
        if (jsonArray.length > 0) break;
      } catch {
        continue;
      }
    }
  }

  if (jsonArray.length === 0) {
    const allScripts = $("script").toArray();
    for (const script of allScripts) {
      const text = $(script).text();
      if (text.includes("jsonArray") && text.includes("urlTitle")) {
        try {
          const match = text.match(/\{[\s\S]*"jsonArray"\s*:\s*\[[\s\S]*\][\s\S]*\}/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            jsonArray = parsed?.jsonArray || [];
            if (jsonArray.length > 0) break;
          }
        } catch {
          continue;
        }
      }
    }
  }

  if (jsonArray.length === 0) return [];

  return jsonArray.slice(0, maxResults).map(mapItem);
}

function mapItem(item: any): DOUResult {
  return {
    title: item.title || "",
    href: item.urlTitle ? `${IN_WEB_BASE_URL}${item.urlTitle}` : "",
    abstract: cleanHtml(item.content || ""),
    date: item.pubDate || "",
    section: (item.pubName || "").toLowerCase(),
    hierarchy: item.hierarchyStr || "",
    artType: item.artType || "",
  };
}

export async function searchDOU(params: {
  query: string;
  exactMatch?: boolean;
  publishFrom?: string;
  publishTo?: string;
  sections?: string[];
  maxResults?: number;
}): Promise<DOUSearchResponse> {
  const { query, exactMatch = false, publishFrom, publishTo, maxResults = 20 } = params;

  const searchTerm = exactMatch ? `"${query}"` : query;
  const searchParams = new URLSearchParams();
  searchParams.set("q", searchTerm);
  searchParams.set("sortType", "0");
  searchParams.set("delta", String(Math.min(maxResults, 50)));
  searchParams.set("s", "0");

  if (publishFrom && publishTo) {
    searchParams.set("exactDate", "personalizado");
    searchParams.set("publishFrom", publishFrom);
    searchParams.set("publishTo", publishTo);
  } else {
    searchParams.set("exactDate", "todos");
  }

  const searchUrl = `${IN_SEARCH_URL}?${searchParams.toString()}`;

  try {
    let results = await tryJsonApi(searchParams, maxResults);

    if (results.length === 0) {
      results = await tryHtmlScrape(searchUrl, maxResults);
    }

    if (results.length > 0) {
      return { ok: true, results, total: results.length, searchUrl };
    }

    return {
      ok: true,
      results: [],
      total: 0,
      message: `Busque "${query}" diretamente no site do DOU clicando no botão abaixo.`,
      searchUrl,
    };
  } catch (error: any) {
    return {
      ok: true,
      results: [],
      total: 0,
      message: "O site do DOU está temporariamente inacessível. Use o link abaixo para buscar diretamente.",
      searchUrl,
    };
  }
}

function cleanHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
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
