import * as cheerio from "cheerio";

export interface NoticiaEducacao {
  titulo: string;
  url: string;
  data: string;
  fonte: "MEC" | "FNDE" | "INEP";
  categoria?: string;
  resumo?: string;
}

interface NoticiasResponse {
  ok: boolean;
  noticias: NoticiaEducacao[];
  total: number;
  error?: string;
}

const SOURCES = [
  {
    nome: "MEC" as const,
    url: "https://www.gov.br/mec/pt-br/assuntos/noticias",
  },
  {
    nome: "FNDE" as const,
    url: "https://www.gov.br/fnde/pt-br/assuntos/noticias",
  },
  {
    nome: "INEP" as const,
    url: "https://www.gov.br/inep/pt-br/assuntos/noticias",
  },
];

const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const TERMOS_SUPERIOR = [
  "ensino superior",
  "graduação",
  "graduacao",
  "pós-graduação",
  "pos-graduacao",
  "universidade",
  "universidades",
  "universitário",
  "universitario",
  "universitária",
  "universitaria",
  "faculdade",
  "faculdades",
  "mestrado",
  "doutorado",
  "especialização",
  "especializacao",
  "enade",
  "sisu",
  "prouni",
  "fies",
  "reuni",
  "capes",
  "cnpq",
  "stricto sensu",
  "lato sensu",
  "vestibular",
  "vestibulares",
  "enem",
  "educação superior",
  "educacao superior",
  "instituto federal",
  "ifes",
  "campus universitário",
  "campus universitario",
  "reitoria",
  "reitor",
  "reitora",
  "bacharelado",
  "licenciatura",
  "tecnólogo",
  "tecnologo",
  "diploma de graduação",
  "diploma de graduacao",
  "educação a distância",
  "ead",
  "curso superior",
  "cursos superiores",
  "sinaes",
  "cpc",
  "igc",
  "conceito preliminar",
  "avaliação institucional",
  "credenciamento de ies",
  "recredenciamento",
  "regulação do ensino superior",
];

function isNoticiaSuperior(titulo: string, resumo?: string, categoria?: string, url?: string): boolean {
  const textoCompleto = [titulo, resumo, categoria, url]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const termosNorm = TERMOS_SUPERIOR.map(t =>
    t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  );

  return termosNorm.some(termo => textoCompleto.includes(termo));
}

async function scrapeGovBrNoticias(
  sourceUrl: string,
  fonte: "MEC" | "FNDE" | "INEP",
  limit: number = 15
): Promise<NoticiaEducacao[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(sourceUrl, {
      headers: { "User-Agent": UA, Accept: "text/html" },
      signal: controller.signal,
    });

    if (!response.ok) return [];

    const html = await response.text();
    const $ = cheerio.load(html);
    const noticias: NoticiaEducacao[] = [];

    const meses: Record<string, string> = {
      janeiro: "01", fevereiro: "02", marco: "03", março: "03", abril: "04",
      maio: "05", junho: "06", julho: "07", agosto: "08",
      setembro: "09", outubro: "10", novembro: "11", dezembro: "12",
    };

    const extractDate = ($parent: cheerio.Cheerio<any>, url: string): string => {
      const dateEl = $parent.find(".data, time, .date, span.publicado, .published").first().text().trim();
      const dateTextMatch = dateEl.match(/(\d{1,2})\s*(?:\/|de)\s*(\d{1,2}|\w+)\s*(?:\/|de)\s*(\d{4})/);
      if (dateTextMatch) {
        const month = dateTextMatch[2].match(/\d+/) ? dateTextMatch[2].padStart(2, "0") : (meses[dateTextMatch[2].toLowerCase()] || "01");
        return `${dateTextMatch[3]}-${month}`;
      }

      const urlMatch = url.match(/\/(\d{4})\/(\w+)\//);
      if (urlMatch) {
        const mesNum = meses[urlMatch[2]] || "01";
        return `${urlMatch[1]}-${mesNum}`;
      }
      return "";
    };

    $("h2.titulo a, .noticias a.titulo, .listagem-noticias-com-foto h2.titulo a, .ultimas-noticias h2 a, .noticias-listagem h2 a").each((_i, el) => {
      if (noticias.length >= limit) return false;

      const $el = $(el);
      const titulo = $el.text().trim();
      const url = $el.attr("href") || "";

      if (!titulo || !url || titulo.length < 5) return;

      const $parent = $el.closest("li, .item, article, div");
      const data = extractDate($parent, url);
      const categoria = $parent.find(".subtitulo-noticia, .categoria").first().text().trim() || "";
      const resumo = $parent.find(".descricao, .description").first().text().trim().slice(0, 200) || "";

      const fullUrl = url.startsWith("http") ? url : `https://www.gov.br${url}`;

      if (isNoticiaSuperior(titulo, resumo, categoria, fullUrl)) {
        return;
      }

      noticias.push({
        titulo,
        url: fullUrl,
        data,
        fonte,
        categoria: categoria || undefined,
        resumo: resumo || undefined,
      });
    });

    return noticias;
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

export async function buscarNoticiasEducacao(limit: number = 15): Promise<NoticiasResponse> {
  try {
    const results = await Promise.allSettled(
      SOURCES.map((s) => scrapeGovBrNoticias(s.url, s.nome, limit))
    );

    const noticias: NoticiaEducacao[] = [];
    for (const result of results) {
      if (result.status === "fulfilled") {
        noticias.push(...result.value);
      }
    }

    noticias.sort((a, b) => (b.data || "").localeCompare(a.data || ""));

    return { ok: true, noticias, total: noticias.length };
  } catch (error: any) {
    return {
      ok: false,
      noticias: [],
      total: 0,
      error: error.message || "Erro ao buscar notícias",
    };
  }
}

export interface PrazoEducacional {
  titulo: string;
  descricao: string;
  dataInicio?: string;
  dataFim?: string;
  mes: number;
  categoria: "PDDE" | "PNAE" | "PNATE" | "FUNDEB" | "CENSO" | "SAEB" | "PRESTAÇÃO" | "PLANEJAMENTO" | "GERAL";
  fonte: string;
  urgencia: "alta" | "media" | "baixa";
  url?: string;
  aConfirmar?: boolean;
}

const ANO_CONFIRMADO = 2026;

export function getPrazosEducacionais(ano: number): PrazoEducacional[] {
  if (ano < 2026) {
    return [];
  }

  const confirmado = ano <= ANO_CONFIRMADO;

  const prazos: PrazoEducacional[] = [
    {
      titulo: "Início do Ano Letivo — Planejamento Escolar",
      descricao: "Período para organizar o Projeto Pedagógico (PPP), definir o calendário escolar e planejar o uso dos recursos recebidos no ano anterior.",
      mes: 2,
      categoria: "PLANEJAMENTO",
      fonte: "Calendário Escolar",
      urgencia: "alta",
    },
    {
      titulo: "1ª Parcela PDDE — Recebimento",
      descricao: "Recebimento da primeira parcela do PDDE. A diretora deve verificar o depósito na conta da UEx e planejar o uso com o conselho escolar.",
      mes: 3,
      categoria: "PDDE",
      fonte: "FNDE/PDDE",
      urgencia: "alta",
      url: "https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/programas/pdde",
    },
    {
      titulo: "Censo Escolar — Coleta de Dados (Matrícula Inicial)",
      descricao: `Período de coleta da Matrícula Inicial do Censo Escolar ${ano}. A diretora deve cadastrar todos os alunos, turmas e profissionais no sistema Educacenso.`,
      dataInicio: confirmado ? `${ano}-05-25` : undefined,
      dataFim: confirmado ? `${ano}-08-30` : undefined,
      mes: 5,
      categoria: "CENSO",
      fonte: "INEP",
      urgencia: "alta",
      url: "https://www.gov.br/inep/pt-br/areas-de-atuacao/pesquisas-estatisticas-e-indicadores/censo-escolar",
    },
    {
      titulo: "PNAE — Acompanhamento de Compras da Agricultura Familiar",
      descricao: "Verificar se os 30% mínimos de compras da agricultura familiar estão sendo cumpridos. Acompanhar o cardápio e os contratos com fornecedores.",
      mes: 4,
      categoria: "PNAE",
      fonte: "FNDE/PNAE",
      urgencia: "media",
      url: "https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/programas/pnae",
    },
    {
      titulo: "PDDE — Prestação de Contas (exercício anterior)",
      descricao: `Prazo para a UEx (conselho escolar) enviar a prestação de contas do PDDE do exercício ${ano - 1}. Reunir notas fiscais, extratos bancários e atas de deliberação.`,
      dataFim: confirmado ? `${ano}-02-28` : undefined,
      mes: 2,
      categoria: "PRESTAÇÃO",
      fonte: "FNDE/PDDE",
      urgencia: "alta",
      url: "https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/programas/pdde",
    },
    {
      titulo: "Censo Escolar — Situação do Aluno",
      descricao: `Período para informar a situação final dos alunos (aprovado, reprovado, transferido) no Educacenso referente ao ano de ${ano - 1}.`,
      dataInicio: confirmado ? `${ano}-02-01` : undefined,
      dataFim: confirmado ? `${ano}-03-15` : undefined,
      mes: 2,
      categoria: "CENSO",
      fonte: "INEP",
      urgencia: "alta",
    },
    {
      titulo: "SAEB — Aplicação das Provas",
      descricao: "Período de aplicação do Sistema de Avaliação da Educação Básica (SAEB). A diretora deve organizar a logística na escola e garantir a participação dos alunos.",
      mes: 10,
      categoria: "SAEB",
      fonte: "INEP",
      urgencia: "alta",
      url: "https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/saeb",
    },
    {
      titulo: "2ª Parcela PDDE — Recebimento",
      descricao: "Recebimento da segunda parcela do PDDE. Verificar o depósito e atualizar o planejamento de gastos com o conselho escolar.",
      mes: 9,
      categoria: "PDDE",
      fonte: "FNDE/PDDE",
      urgencia: "alta",
    },
    {
      titulo: "PNATE — Início do repasse",
      descricao: "Início dos repasses do PNATE para transporte escolar. Verificar se os valores estão sendo repassados para o município/estado.",
      mes: 3,
      categoria: "PNATE",
      fonte: "FNDE/PNATE",
      urgencia: "media",
    },
    {
      titulo: "Conselho Escolar — Reunião de Planejamento",
      descricao: "Reunião obrigatória do conselho escolar para deliberar sobre o plano de aplicação dos recursos. Documentar em ata.",
      mes: 3,
      categoria: "PLANEJAMENTO",
      fonte: "Legislação Educacional",
      urgencia: "media",
    },
    {
      titulo: "FUNDEB — Acompanhamento dos Repasses",
      descricao: "Verificar no portal do FNDE se os repasses do FUNDEB estão regulares. Os valores dependem do número de alunos informados no Censo.",
      mes: 4,
      categoria: "FUNDEB",
      fonte: "FNDE/FUNDEB",
      urgencia: "media",
      url: "https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/financiamento/fundeb",
    },
    {
      titulo: "Dia Nacional da Educação",
      descricao: "28 de abril — momento para reflexão sobre a gestão escolar e avaliação das metas do PPP.",
      mes: 4,
      categoria: "GERAL",
      fonte: "Calendário Educacional",
      urgencia: "baixa",
    },
    {
      titulo: "Censo Escolar — Encerramento da Coleta",
      descricao: "Prazo final para envio dos dados da Matrícula Inicial. Verificar se todos os dados estão corretos antes do fechamento.",
      dataFim: confirmado ? `${ano}-08-30` : undefined,
      mes: 8,
      categoria: "CENSO",
      fonte: "INEP",
      urgencia: "alta",
    },
    {
      titulo: "Prestação de Contas — Organização de Documentos",
      descricao: "Momento ideal para organizar notas fiscais, recibos e documentos do semestre para facilitar a prestação de contas ao final do ano.",
      mes: 7,
      categoria: "PRESTAÇÃO",
      fonte: "FNDE",
      urgencia: "media",
    },
    {
      titulo: "Planejamento para o Ano Seguinte",
      descricao: "Iniciar o planejamento pedagógico e financeiro para o próximo ano letivo. Levantar necessidades de infraestrutura, materiais e formação.",
      mes: 11,
      categoria: "PLANEJAMENTO",
      fonte: "Gestão Escolar",
      urgencia: "media",
    },
    {
      titulo: "PDDE — Encerramento do Exercício Financeiro",
      descricao: "Encerrar as movimentações financeiras do exercício. Verificar saldo, aplicar devoluções se necessário e preparar documentação para prestação de contas.",
      mes: 12,
      categoria: "PDDE",
      fonte: "FNDE/PDDE",
      urgencia: "alta",
    },
    {
      titulo: "PNAE — Prestação de Contas Anual",
      descricao: "O CAE (Conselho de Alimentação Escolar) deve emitir parecer sobre a prestação de contas do PNAE até este período.",
      mes: 3,
      categoria: "PNAE",
      fonte: "FNDE/PNAE",
      urgencia: "alta",
    },
    {
      titulo: "Avaliações Diagnósticas — Início",
      descricao: "Aplicar avaliações diagnósticas para identificar o nível de aprendizagem dos alunos e planejar intervenções pedagógicas.",
      mes: 3,
      categoria: "GERAL",
      fonte: "Gestão Pedagógica",
      urgencia: "media",
    },
  ];

  if (!confirmado) {
    return prazos.map(p => ({
      ...p,
      aConfirmar: true,
    }));
  }

  return prazos;
}
