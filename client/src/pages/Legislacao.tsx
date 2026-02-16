import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import {
  ExternalLink, Scale, FileText, BookOpen, Landmark, GraduationCap,
  Utensils, Bus, Coins, Users, ShieldCheck, ClipboardList, Search,
  Loader2, AlertCircle, Newspaper, ChevronDown, ChevronUp, BookMarked,
  Calendar, Building2, Info
} from "lucide-react";
import { useState, useCallback } from "react";
import { useMecNormasAll, useMecNormasTipos } from "@/hooks/use-mecnormas";
import { useDOUSearch, useDOUCrossReference } from "@/hooks/use-dou";

interface Lei {
  titulo: string;
  numero: string;
  descricao: string;
  link: string;
  categoria: string;
  icon: any;
  destaque?: string;
}

const legislacoes: Lei[] = [
  {
    titulo: "Lei de Diretrizes e Bases da Educação Nacional (LDB)",
    numero: "Lei nº 9.394/1996",
    descricao: "Estabelece as diretrizes e bases da educação nacional, definindo a organização do sistema educacional brasileiro, as responsabilidades de cada ente federativo e os princípios da educação.",
    link: "https://www.planalto.gov.br/ccivil_03/leis/l9394.htm",
    categoria: "Base Legal",
    icon: Scale,
    destaque: "Fundamento de toda a educação brasileira",
  },
  {
    titulo: "Constituição Federal - Capítulo da Educação",
    numero: "CF/1988 - Arts. 205 a 214",
    descricao: "Define a educação como direito de todos e dever do Estado e da família, estabelece o financiamento mínimo obrigatório (18% União, 25% estados e municípios) e os princípios constitucionais da educação.",
    link: "https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm",
    categoria: "Base Legal",
    icon: Landmark,
  },
  {
    titulo: "FUNDEB - Fundo de Manutenção e Desenvolvimento da Educação Básica",
    numero: "Lei nº 14.113/2020",
    descricao: "Regulamenta o FUNDEB permanente, principal mecanismo de financiamento da educação básica pública. Define critérios de distribuição dos recursos, ponderações por etapa e modalidade de ensino e o sistema de complementação da União (VAAT, VAAR e VAAF).",
    link: "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2020/lei/l14113.htm",
    categoria: "Financiamento",
    icon: Coins,
    destaque: "Principal fonte de recursos da educação básica",
  },
  {
    titulo: "PDDE - Programa Dinheiro Direto na Escola",
    numero: "Lei nº 11.947/2009 (Art. 22 a 30)",
    descricao: "Autoriza o repasse de recursos financeiros diretamente às escolas públicas de educação básica, sem necessidade de convênio. Os recursos podem ser usados para manutenção, conservação e pequenos reparos, aquisição de material de consumo e implementação do projeto pedagógico.",
    link: "https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2009/lei/l11947.htm",
    categoria: "Programas FNDE",
    icon: FileText,
    destaque: "Dinheiro direto na conta da escola",
  },
  {
    titulo: "Resolução FNDE nº 15/2021 - PDDE Básico",
    numero: "Resolução CD/FNDE nº 15/2021",
    descricao: "Dispõe sobre os critérios e as formas de transferência e de prestação de contas dos recursos do PDDE. Detalha como calcular o valor do repasse, prazos de execução e regras de prestação de contas.",
    link: "https://www.fnde.gov.br/index.php/legislacoes/resolucoes",
    categoria: "Programas FNDE",
    icon: ClipboardList,
  },
  {
    titulo: "PNAE - Programa Nacional de Alimentação Escolar",
    numero: "Lei nº 11.947/2009 (Art. 1 a 21)",
    descricao: "Garante alimentação escolar e ações de educação alimentar e nutricional. Determina que no mínimo 30% dos recursos sejam investidos na compra de alimentos da agricultura familiar. O CAE (Conselho de Alimentação Escolar) fiscaliza a execução.",
    link: "https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2009/lei/l11947.htm",
    categoria: "Programas FNDE",
    icon: Utensils,
    destaque: "Alimentação escolar de qualidade",
  },
  {
    titulo: "PNATE - Programa Nacional de Apoio ao Transporte Escolar",
    numero: "Lei nº 10.880/2004",
    descricao: "Garante o transporte escolar dos alunos da educação básica pública que residem em área rural. Os recursos são transferidos automaticamente para estados, Distrito Federal e municípios, sem necessidade de convênio.",
    link: "https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2004/lei/l10.880.htm",
    categoria: "Programas FNDE",
    icon: Bus,
  },
  {
    titulo: "PNLD - Programa Nacional do Livro e do Material Didático",
    numero: "Decreto nº 9.099/2017",
    descricao: "Avalia e disponibiliza obras didáticas, pedagógicas e literárias, além de outros materiais de apoio à prática educativa, de forma sistemática, regular e gratuita às escolas públicas de educação básica.",
    link: "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2017/decreto/d9099.htm",
    categoria: "Programas FNDE",
    icon: BookOpen,
  },
  {
    titulo: "Plano Nacional de Educação (PNE)",
    numero: "Lei nº 14.934/2024",
    descricao: "Estabelece 18 metas e estratégias para a educação brasileira no decênio 2024-2034, incluindo universalização do acesso, melhoria da qualidade, valorização dos profissionais da educação e ampliação do investimento público em educação.",
    link: "https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2024/lei/L14934.htm",
    categoria: "Planejamento",
    icon: GraduationCap,
    destaque: "Metas para a educação 2024-2034",
  },
  {
    titulo: "Estatuto da Criança e do Adolescente (ECA)",
    numero: "Lei nº 8.069/1990",
    descricao: "Dispõe sobre a proteção integral à criança e ao adolescente. Estabelece o direito à educação, à cultura, ao esporte e ao lazer, e define as obrigações dos dirigentes de estabelecimentos de ensino.",
    link: "https://www.planalto.gov.br/ccivil_03/leis/l8069.htm",
    categoria: "Base Legal",
    icon: ShieldCheck,
  },
  {
    titulo: "Gestão Democrática na Educação",
    numero: "Lei nº 14.644/2023",
    descricao: "Institui a política de gestão democrática nas redes públicas de educação básica, regulamentando a escolha de diretores escolares, a participação da comunidade escolar e a autonomia administrativa e pedagógica das escolas.",
    link: "https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/lei/L14644.htm",
    categoria: "Gestão",
    icon: Users,
    destaque: "Gestão democrática e escolha de diretores",
  },
  {
    titulo: "Lei de Responsabilidade Fiscal",
    numero: "Lei Complementar nº 101/2000",
    descricao: "Estabelece normas de finanças públicas voltadas para a responsabilidade na gestão fiscal. Impacta a gestão escolar ao definir limites de gastos com pessoal e regras de transparência que também se aplicam à execução de recursos educacionais.",
    link: "https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp101.htm",
    categoria: "Financiamento",
    icon: Coins,
  },
];

const categorias = ["Todos", "Base Legal", "Financiamento", "Programas FNDE", "Planejamento", "Gestão"];

const categoriaColors: Record<string, string> = {
  "Base Legal": "bg-emerald-100 text-emerald-800",
  "Financiamento": "bg-amber-100 text-amber-800",
  "Programas FNDE": "bg-orange-100 text-orange-800",
  "Planejamento": "bg-violet-100 text-violet-800",
  "Gestão": "bg-sky-100 text-sky-800",
};

type CategoryId = "cat-leis" | "cat-normas" | "cat-dou";
type SubTabId = "leis-todas" | "leis-base" | "leis-financiamento" | "leis-programas" | "leis-gestao" | "normas-todas" | "normas-vigentes" | "normas-busca" | "dou-busca" | "dou-crossref";

const categories: { id: CategoryId; label: string; icon: string; subTabs: { id: SubTabId; label: string }[] }[] = [
  {
    id: "cat-leis",
    label: "Leis Fundamentais",
    icon: "\u2696\uFE0F",
    subTabs: [
      { id: "leis-todas", label: "Todas as Leis" },
      { id: "leis-base", label: "Base Legal" },
      { id: "leis-financiamento", label: "Financiamento" },
      { id: "leis-programas", label: "Programas FNDE" },
      { id: "leis-gestao", label: "Planejamento e Gestão" },
    ],
  },
  {
    id: "cat-normas",
    label: "Normas do MEC",
    icon: "\uD83D\uDCD6",
    subTabs: [
      { id: "normas-todas", label: "Todas as Normas" },
      { id: "normas-vigentes", label: "Vigentes" },
      { id: "normas-busca", label: "Buscar por Termo" },
    ],
  },
  {
    id: "cat-dou",
    label: "Diário Oficial",
    icon: "\uD83D\uDCF0",
    subTabs: [
      { id: "dou-busca", label: "Buscar no DOU" },
      { id: "dou-crossref", label: "Verificar Vigência" },
    ],
  },
];

function DOUCrossRef({ normaTitle }: { normaTitle: string }) {
  const [enabled, setEnabled] = useState(false);
  const { data, isLoading, error } = useDOUCrossReference(normaTitle, enabled);

  if (!enabled) {
    return (
      <button
        onClick={() => setEnabled(true)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold"
        style={{ color: "#1565c0" }}
      >
        <Newspaper className="w-3 h-3" />
        Verificar no DOU
      </button>
    );
  }

  if (isLoading) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: "#64748b" }}>
        <Loader2 className="w-3 h-3 animate-spin" />
        Consultando DOU...
      </span>
    );
  }

  if (error || !data?.ok) {
    return (
      <span className="inline-flex items-center gap-1 text-xs" style={{ color: "#ef6c00" }}>
        <AlertCircle className="w-3 h-3" />
        DOU indisponível
      </span>
    );
  }

  if (data.results.length === 0 && data.searchUrl) {
    return (
      <a
        href={data.searchUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-semibold"
        style={{ color: "#1565c0" }}
      >
        <ExternalLink className="w-3 h-3" />
        Buscar no DOU
      </a>
    );
  }

  if (data.results.length > 0) {
    return (
      <div className="space-y-1">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#2e7d32" }}>
          <Newspaper className="w-3 h-3" />
          {data.results.length} publicação(ões)
        </span>
        {data.results.slice(0, 2).map((r, i) => (
          <a
            key={i}
            href={r.href}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-xs pl-4 hover:underline"
            style={{ color: "#1565c0" }}
          >
            {r.title} ({r.date})
          </a>
        ))}
      </div>
    );
  }

  return (
    <span className="text-xs" style={{ color: "#64748b" }}>
      Nenhuma publicação encontrada
    </span>
  );
}

function LeisFundamentaisContent({ subTab }: { subTab: SubTabId }) {
  const filterMap: Record<string, string> = {
    "leis-todas": "Todos",
    "leis-base": "Base Legal",
    "leis-financiamento": "Financiamento",
    "leis-programas": "Programas FNDE",
    "leis-gestao": "Gestão",
  };

  const categoria = filterMap[subTab] || "Todos";
  const leis = categoria === "Todos"
    ? legislacoes
    : subTab === "leis-gestao"
      ? legislacoes.filter(l => l.categoria === "Planejamento" || l.categoria === "Gestão")
      : legislacoes.filter(l => l.categoria === categoria);

  const descriptions: Record<string, { title: string; text: string; detail: string }> = {
    "leis-todas": {
      title: "Legislação Educacional Completa",
      text: "Conjunto das principais leis, decretos e resoluções que orientam a gestão financeira e pedagógica das escolas públicas brasileiras. Inclui a base legal constitucional, normas de financiamento, programas do FNDE e instrumentos de planejamento e gestão.",
      detail: "Total: " + legislacoes.length + " normas fundamentais | Categorias: Base Legal, Financiamento, Programas FNDE, Planejamento, Gestão",
    },
    "leis-base": {
      title: "Base Legal da Educação",
      text: "Leis fundamentais que estruturam o sistema educacional brasileiro: a Constituição Federal, a Lei de Diretrizes e Bases (LDB) e o Estatuto da Criança e do Adolescente (ECA). Essas normas estabelecem os princípios, direitos e deveres da educação nacional.",
      detail: "Fonte: Planalto - Legislação Federal Brasileira",
    },
    "leis-financiamento": {
      title: "Financiamento da Educação",
      text: "Normas que regulam o financiamento da educação pública, incluindo o FUNDEB (principal fundo de financiamento), a Lei de Responsabilidade Fiscal e as regras de aplicação mínima de recursos em educação.",
      detail: "O FUNDEB representa cerca de 63% do financiamento da educação básica pública",
    },
    "leis-programas": {
      title: "Programas do FNDE",
      text: "Legislação dos programas federais administrados pelo FNDE que transferem recursos diretamente às escolas ou aos entes federativos: PDDE (dinheiro direto na escola), PNAE (alimentação), PNATE (transporte) e PNLD (livros didáticos).",
      detail: "Os programas do FNDE atendem mais de 40 milhões de estudantes da educação básica",
    },
    "leis-gestao": {
      title: "Planejamento e Gestão",
      text: "Normas sobre planejamento educacional (PNE com 18 metas para 2024-2034) e gestão democrática das escolas, incluindo a escolha de diretores e a participação da comunidade escolar.",
      detail: "A gestão democrática é princípio constitucional da educação pública (Art. 206, VI)",
    },
  };

  const desc = descriptions[subTab] || descriptions["leis-todas"];

  return (
    <>
      <div style={{
        background: "#eff6ff",
        borderLeft: "4px solid #3b82f6",
        padding: "16px 20px",
        borderRadius: "0 10px 10px 0",
        fontSize: "13px",
        color: "#1e40af",
        marginBottom: "16px",
        lineHeight: 1.7,
      }}>
        <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Info className="w-4 h-4" />
          {desc.title}
        </div>
        <p>{desc.text}</p>
        <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #bfdbfe", fontSize: "12px", color: "#1e3a8a" }}>
          <strong>{desc.detail}</strong>
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "12px",
        marginBottom: "16px",
      }}>
        {categorias.filter(c => c !== "Todos").map(cat => {
          const count = legislacoes.filter(l => l.categoria === cat).length;
          return (
            <div key={cat} style={{
              background: "white",
              borderRadius: "10px",
              padding: "16px 20px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
              border: "1px solid #e2e5ec",
              borderLeft: `3px solid ${cat === "Base Legal" ? "#2e7d32" : cat === "Financiamento" ? "#ef6c00" : cat === "Programas FNDE" ? "#c62828" : "#1a237e"}`,
            }}>
              <div style={{ fontSize: "26px", fontWeight: 800, color: "#1a237e", lineHeight: 1.1 }}>{count}</div>
              <div style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: "4px" }}>{cat}</div>
            </div>
          );
        })}
      </div>

      <div style={{ background: "white", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #e2e5ec" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #e2e5ec", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 600 }}>Legislação</h3>
          <span style={{ fontSize: "12px", color: "#94a3b8", background: "#f1f5f9", padding: "3px 10px", borderRadius: "12px" }}>
            {leis.length} norma(s)
          </span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
            <thead>
              <tr>
                <th style={thStyle}>Norma</th>
                <th style={thStyle}>Número</th>
                <th style={thStyle}>Categoria</th>
                <th style={thStyle}>Destaque</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Link</th>
              </tr>
            </thead>
            <tbody>
              {leis.map((lei, index) => (
                <tr key={lei.numero} style={{ background: index % 2 === 0 ? "transparent" : "#fcfcfd" }}>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{
                        width: "32px", height: "32px", borderRadius: "6px",
                        background: "#e8eaf6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        <lei.icon style={{ width: "16px", height: "16px", color: "#3949ab" }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "13px", lineHeight: 1.3 }}>{lei.titulo}</div>
                        <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px", lineHeight: 1.4, maxWidth: "400px" }}>
                          {lei.descricao.length > 120 ? lei.descricao.slice(0, 120) + "..." : lei.descricao}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: "12px", fontFamily: "monospace", color: "#64748b" }}>{lei.numero}</span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      display: "inline-block", padding: "2px 8px", borderRadius: "4px",
                      fontSize: "11px", fontWeight: 600, letterSpacing: "0.2px",
                      ...(lei.categoria === "Base Legal" ? { background: "#dcfce7", color: "#166534" } :
                        lei.categoria === "Financiamento" ? { background: "#ffedd5", color: "#9a3412" } :
                        lei.categoria === "Programas FNDE" ? { background: "#fee2e2", color: "#991b1b" } :
                        lei.categoria === "Planejamento" ? { background: "#f3e8ff", color: "#6b21a8" } :
                        { background: "#dbeafe", color: "#1e40af" }),
                    }}>
                      {lei.categoria}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    {lei.destaque ? (
                      <span style={{ fontSize: "11px", color: "#1565c0", fontWeight: 500 }}>
                        {lei.destaque}
                      </span>
                    ) : (
                      <span style={{ fontSize: "11px", color: "#cbd5e1" }}>—</span>
                    )}
                  </td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>
                    <a
                      href={lei.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex", alignItems: "center", gap: "6px",
                        padding: "6px 14px", border: "none", borderRadius: "6px",
                        fontSize: "12px", fontWeight: 600, cursor: "pointer",
                        background: "#1a237e", color: "white", textDecoration: "none",
                      }}
                    >
                      <ExternalLink style={{ width: "12px", height: "12px" }} />
                      Abrir
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function NormasContent({ subTab }: { subTab: SubTabId }) {
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<string | number | null>(null);
  const [selectedTipo, setSelectedTipo] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const pageSize = 30;

  const vigente = subTab === "normas-vigentes" ? "true" : undefined;
  const isBusca = subTab === "normas-busca";

  const { data: tiposData, isLoading: tiposLoading } = useMecNormasTipos();

  const { data, isLoading, error } = useMecNormasAll({
    page,
    size: pageSize,
    tipo: selectedTipo || undefined,
    vigente,
    q: isBusca ? submittedSearch || undefined : undefined,
  });

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedSearch(searchTerm.trim());
    setPage(0);
  }, [searchTerm]);

  const normas: any[] = data?.entidades || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 0;

  const descriptions: Record<string, { title: string; text: string; detail: string }> = {
    "normas-todas": {
      title: "Todas as Normas do MEC",
      text: "Acervo completo de atos normativos do Ministério da Educação, incluindo resoluções, portarias, pareceres, decretos e demais instrumentos legais. Os dados são consultados diretamente do portal oficial MEC Normas (mecnormas.mec.gov.br).",
      detail: `Total no acervo: ${tiposData?.totalGeral?.toLocaleString("pt-BR") || "carregando..."} normas | Fonte: MEC Normas - Ministério da Educação`,
    },
    "normas-vigentes": {
      title: "Normas Vigentes do MEC",
      text: "Exibe apenas as normas que estão atualmente em vigor. Normas revogadas, alteradas ou com vigência encerrada são automaticamente filtradas, garantindo que você consulte apenas a legislação válida.",
      detail: "Filtro automático: apenas normas com status vigente | Atualizado em tempo real pelo MEC Normas",
    },
    "normas-busca": {
      title: "Busca por Termo",
      text: "Pesquise normas específicas do MEC por palavras-chave. Use termos como \"PDDE\", \"PNAE\", \"prestação de contas\" ou \"alimentação escolar\" para encontrar normas relacionadas.",
      detail: "Dica: Combine a busca textual com o filtro de tipo para resultados mais precisos",
    },
  };

  const desc = descriptions[subTab] || descriptions["normas-todas"];

  return (
    <>
      <div style={{
        background: "#eff6ff",
        borderLeft: "4px solid #3b82f6",
        padding: "16px 20px",
        borderRadius: "0 10px 10px 0",
        fontSize: "13px",
        color: "#1e40af",
        marginBottom: "16px",
        lineHeight: 1.7,
      }}>
        <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Info className="w-4 h-4" />
          {desc.title}
        </div>
        <p>{desc.text}</p>
        <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #bfdbfe", fontSize: "12px", color: "#1e3a8a" }}>
          <strong>{desc.detail}</strong>
        </div>
      </div>

      {!tiposLoading && tiposData && tiposData.tipos && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "12px",
          marginBottom: "16px",
        }}>
          <div style={{
            background: "white",
            borderRadius: "10px",
            padding: "16px 20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
            border: "1px solid #e2e5ec",
            borderLeft: "3px solid #1a237e",
          }}>
            <div style={{ fontSize: "26px", fontWeight: 800, color: "#1a237e", lineHeight: 1.1 }}>
              {tiposData.totalGeral.toLocaleString("pt-BR")}
            </div>
            <div style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: "4px" }}>
              Total de Normas
            </div>
          </div>
          {tiposData.tipos.slice(0, 5).map((tipo, i) => {
            const colors = ["#2e7d32", "#ef6c00", "#c62828", "#6b21a8", "#1565c0"];
            return (
              <div key={tipo.id} style={{
                background: "white",
                borderRadius: "10px",
                padding: "16px 20px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
                border: "1px solid #e2e5ec",
                borderLeft: `3px solid ${colors[i % colors.length]}`,
                cursor: "pointer",
              }}
              onClick={() => { setSelectedTipo(selectedTipo === String(tipo.id) ? "" : String(tipo.id)); setPage(0); }}
              >
                <div style={{ fontSize: "26px", fontWeight: 800, color: "#1a237e", lineHeight: 1.1 }}>
                  {tipo.total.toLocaleString("pt-BR")}
                </div>
                <div style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: "4px" }}>
                  {tipo.nome}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ background: "white", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #e2e5ec" }}>
        <div style={{ padding: "16px 20px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end", borderBottom: "1px solid #e2e5ec" }}>
          {isBusca && (
            <form onSubmit={handleSearch} style={{ display: "flex", gap: "10px", flex: 1, minWidth: "200px", alignItems: "flex-end" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "3px", flex: 1 }}>
                <label style={labelStyle}>Buscar norma</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Ex: PDDE, PNAE, alimentação escolar..."
                  style={inputStyle}
                />
              </div>
              <button
                type="submit"
                disabled={!searchTerm.trim()}
                style={{
                  padding: "8px 18px", border: "none", borderRadius: "6px",
                  fontSize: "13px", fontWeight: 600, cursor: searchTerm.trim() ? "pointer" : "not-allowed",
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  background: searchTerm.trim() ? "#1a237e" : "#94a3b8", color: "white",
                }}
              >
                <Search style={{ width: "14px", height: "14px" }} />
                Buscar
              </button>
            </form>
          )}
          {tiposData && tiposData.tipos && (
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              <label style={labelStyle}>Filtrar por tipo</label>
              <select
                value={selectedTipo}
                onChange={(e) => { setSelectedTipo(e.target.value); setPage(0); }}
                style={selectStyle}
              >
                <option value="">Todos os tipos</option>
                {tiposData.tipos.map((t) => (
                  <option key={t.id} value={t.id}>{t.nome} ({t.total.toLocaleString("pt-BR")})</option>
                ))}
              </select>
            </div>
          )}
          {selectedTipo && (
            <button
              onClick={() => { setSelectedTipo(""); setPage(0); }}
              style={{
                padding: "8px 14px", border: "1px solid #e2e5ec", borderRadius: "6px",
                fontSize: "12px", fontWeight: 500, cursor: "pointer",
                background: "white", color: "#64748b",
              }}
            >
              Limpar filtro
            </button>
          )}
        </div>

        {isLoading && (
          <div style={{ textAlign: "center", padding: "48px", color: "#94a3b8" }}>
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: "#1a237e" }} />
            <div style={{ fontSize: "13px" }}>Carregando normas do MEC...</div>
          </div>
        )}

        {error && (
          <div style={{
            background: "#fffbeb", borderLeft: "3px solid #f59e0b",
            padding: "10px 14px", borderRadius: "0 6px 6px 0",
            fontSize: "12px", color: "#92400e", margin: "16px",
          }}>
            <AlertCircle className="w-4 h-4 inline mr-2" />
            Não foi possível consultar o MEC Normas. Tente novamente em alguns instantes.
          </div>
        )}

        {!isLoading && !error && isBusca && !submittedSearch && (
          <div style={{ textAlign: "center", padding: "48px", color: "#94a3b8" }}>
            <Search className="w-10 h-10 mx-auto mb-3" style={{ opacity: 0.3 }} />
            <p style={{ fontSize: "14px" }}>Digite um termo para buscar normas do MEC</p>
            <p style={{ fontSize: "12px", marginTop: "4px", opacity: 0.7 }}>Exemplo: PDDE, PNAE, prestação de contas, transporte escolar</p>
          </div>
        )}

        {!isLoading && !error && normas.length === 0 && (isBusca ? submittedSearch : true) && !(isBusca && !submittedSearch) && (
          <div style={{ textAlign: "center", padding: "48px", color: "#94a3b8" }}>
            <BookMarked className="w-10 h-10 mx-auto mb-3" style={{ opacity: 0.4 }} />
            <p style={{ fontSize: "14px" }}>Nenhuma norma encontrada</p>
          </div>
        )}

        {normas.length > 0 && (
          <>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #e2e5ec", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 600 }}>
                {subTab === "normas-vigentes" ? "Normas Vigentes" : "Normas do MEC"}
              </h3>
              <span style={{ fontSize: "12px", color: "#94a3b8", background: "#f1f5f9", padding: "3px 10px", borderRadius: "12px" }}>
                {total.toLocaleString("pt-BR")} norma(s)
              </span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Norma</th>
                    <th style={thStyle}>Tipo</th>
                    <th style={thStyle}>Assuntos</th>
                    <th style={thStyle}>Publicação</th>
                    <th style={thStyle}>Vigente</th>
                    <th style={{ ...thStyle, textAlign: "center" }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {normas.map((norma: any, index: number) => {
                    const title = norma.titulo || norma.tituloAto || norma.identificacao || `Ato ${norma.id}`;
                    const ementa = norma.ementa || norma.resumo || "";
                    const date = norma.dataDePublicacaoString || norma.dataPublicacao || norma.dataPublicacaoAto || norma.dataDePublicacao || "";
                    const tipo = norma.tipo?.nome || "";
                    const link = norma.disponivelEm || norma.disponivel_em || "";
                    const isExpanded = expandedId === norma.id;
                    const assuntos = norma.assuntos || [];
                    const isVigente = norma.vigente;

                    return (
                      <tr key={norma.id} style={{ background: index % 2 === 0 ? "transparent" : "#fcfcfd" }}>
                        <td style={tdStyle}>
                          <div>
                            <div
                              onClick={() => setExpandedId(isExpanded ? null : norma.id)}
                              style={{ fontWeight: 600, fontSize: "13px", lineHeight: 1.3, cursor: "pointer", color: "#1565c0", maxWidth: "350px" }}
                            >
                              {title}
                            </div>
                            {isExpanded && ementa && (
                              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "6px", lineHeight: 1.5, maxWidth: "350px" }}>
                                {ementa}
                              </div>
                            )}
                            {norma.unidade?.sigla && (
                              <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "3px" }}>
                                {norma.unidade.sigla}
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={tdStyle}>
                          {tipo && (
                            <span style={{
                              display: "inline-block", padding: "2px 8px", borderRadius: "4px",
                              fontSize: "11px", fontWeight: 600, background: "#f3e8ff", color: "#6b21a8",
                            }}>
                              {tipo}
                            </span>
                          )}
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "3px", maxWidth: "200px" }}>
                            {assuntos.slice(0, 2).map((a: any, i: number) => (
                              <span key={i} style={{
                                display: "inline-block", padding: "1px 6px", borderRadius: "3px",
                                fontSize: "10px", fontWeight: 500, background: "#dbeafe", color: "#1e40af",
                              }}>
                                {a.nome}
                              </span>
                            ))}
                            {assuntos.length > 2 && (
                              <span style={{ fontSize: "10px", color: "#94a3b8" }}>+{assuntos.length - 2}</span>
                            )}
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: "12px", color: "#64748b" }}>{date || "—"}</span>
                        </td>
                        <td style={tdStyle}>
                          {isVigente === true && (
                            <span style={{
                              display: "inline-block", padding: "2px 8px", borderRadius: "4px",
                              fontSize: "11px", fontWeight: 600, background: "#dcfce7", color: "#166534",
                            }}>
                              Sim
                            </span>
                          )}
                          {isVigente === false && (
                            <span style={{
                              display: "inline-block", padding: "2px 8px", borderRadius: "4px",
                              fontSize: "11px", fontWeight: 600, background: "#fee2e2", color: "#991b1b",
                            }}>
                              Não
                            </span>
                          )}
                          {isVigente === undefined || isVigente === null ? (
                            <span style={{ fontSize: "11px", color: "#cbd5e1" }}>—</span>
                          ) : null}
                        </td>
                        <td style={{ ...tdStyle, textAlign: "center" }}>
                          <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : norma.id)}
                              style={{
                                padding: "4px 8px", border: "1px solid #e2e5ec", borderRadius: "4px",
                                background: "white", cursor: "pointer", fontSize: "12px", color: "#64748b",
                              }}
                            >
                              {isExpanded ? <ChevronUp style={{ width: "14px", height: "14px" }} /> : <ChevronDown style={{ width: "14px", height: "14px" }} />}
                            </button>
                            {link && (
                              <a
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  padding: "4px 10px", border: "none", borderRadius: "4px",
                                  background: "#1a237e", color: "white", fontSize: "11px", fontWeight: 600,
                                  textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px",
                                }}
                              >
                                <ExternalLink style={{ width: "11px", height: "11px" }} />
                                Abrir
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{
                display: "flex", justifyContent: "center", alignItems: "center",
                gap: "8px", padding: "14px", borderTop: "1px solid #e2e5ec",
              }}>
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page <= 0}
                  style={{ ...paginationBtnStyle, opacity: page <= 0 ? 0.4 : 1, cursor: page <= 0 ? "not-allowed" : "pointer" }}
                >
                  Anterior
                </button>
                <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                  Página {page + 1} de {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  style={{ ...paginationBtnStyle, opacity: page >= totalPages - 1 ? 0.4 : 1, cursor: page >= totalPages - 1 ? "not-allowed" : "pointer" }}
                >
                  Próxima
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

function DOUBuscaContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [submittedTerm, setSubmittedTerm] = useState("");

  const { data, isLoading, error } = useDOUSearch(
    { q: submittedTerm, exact: false, limit: 20 },
    !!submittedTerm
  );

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedTerm(searchTerm.trim());
  }, [searchTerm]);

  const quickSearches = [
    "PDDE FNDE",
    "PNAE alimentação escolar",
    "PNATE transporte escolar",
    "FUNDEB educação básica",
    "INEP censo escolar",
  ];

  return (
    <>
      <div style={{
        background: "#eff6ff",
        borderLeft: "4px solid #3b82f6",
        padding: "16px 20px",
        borderRadius: "0 10px 10px 0",
        fontSize: "13px",
        color: "#1e40af",
        marginBottom: "16px",
        lineHeight: 1.7,
      }}>
        <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Info className="w-4 h-4" />
          Diário Oficial da União (DOU)
        </div>
        <p>Pesquise publicações oficiais no Diário Oficial da União para verificar vigência de normas, encontrar novas resoluções e acompanhar alterações na legislação educacional.</p>
        <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #bfdbfe", fontSize: "12px", color: "#1e3a8a" }}>
          <strong>Fonte:</strong> Portal da Imprensa Nacional (in.gov.br) | Os resultados são buscados diretamente no portal oficial
        </div>
      </div>

      <div style={{ background: "white", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #e2e5ec" }}>
        <form onSubmit={handleSearch}>
          <div style={{ padding: "16px 20px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "3px", flex: 1, minWidth: "200px" }}>
              <label style={labelStyle}>Buscar publicações</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar no Diário Oficial da União..."
                style={inputStyle}
              />
            </div>
            <button
              type="submit"
              disabled={!searchTerm.trim()}
              style={{
                padding: "8px 18px", border: "none", borderRadius: "6px",
                fontSize: "13px", fontWeight: 600, cursor: searchTerm.trim() ? "pointer" : "not-allowed",
                display: "inline-flex", alignItems: "center", gap: "6px",
                background: searchTerm.trim() ? "#1a237e" : "#94a3b8", color: "white",
                transition: "all 0.15s",
              }}
            >
              <Search style={{ width: "14px", height: "14px" }} />
              Buscar
            </button>
          </div>
        </form>
        <div style={{ padding: "0 20px 12px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
          <span style={{ fontSize: "11px", color: "#94a3b8", alignSelf: "center" }}>Sugestões:</span>
          {quickSearches.map((term) => (
            <button
              key={term}
              onClick={() => { setSearchTerm(term); setSubmittedTerm(term); }}
              style={{
                padding: "4px 10px", borderRadius: "20px", border: "none",
                fontSize: "11px", fontWeight: 500, cursor: "pointer",
                background: "#dbeafe", color: "#1e40af",
                transition: "all 0.15s",
              }}
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div style={{ textAlign: "center", padding: "48px", color: "#94a3b8" }}>
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: "#1a237e" }} />
          <div style={{ fontSize: "13px" }}>Consultando o Diário Oficial...</div>
        </div>
      )}

      {error && (
        <div style={{
          background: "#fffbeb", borderLeft: "3px solid #f59e0b",
          padding: "10px 14px", borderRadius: "0 6px 6px 0",
          fontSize: "12px", color: "#92400e", marginTop: "16px",
        }}>
          <AlertCircle className="w-4 h-4 inline mr-2" />
          Não foi possível consultar o DOU. O portal pode estar temporariamente indisponível.
        </div>
      )}

      {!isLoading && !error && data && data.results.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px" }}>
          <Newspaper className="w-10 h-10 mx-auto mb-3" style={{ color: "#3b82f6", opacity: 0.6 }} />
          <p style={{ fontSize: "14px", color: "#94a3b8", marginBottom: "12px" }}>
            Busca preparada para "{submittedTerm}"
          </p>
          {data.searchUrl && (
            <a
              href={data.searchUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                padding: "10px 20px", borderRadius: "6px",
                background: "#1a237e", color: "white", textDecoration: "none",
                fontSize: "13px", fontWeight: 600,
              }}
            >
              <ExternalLink style={{ width: "14px", height: "14px" }} />
              Abrir busca no site oficial do DOU
            </a>
          )}
          <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "12px", maxWidth: "400px", margin: "12px auto 0" }}>
            O portal do Diário Oficial requer acesso direto pelo navegador. 
            Clique no botão acima para ver os resultados no site da Imprensa Nacional.
          </p>
        </div>
      )}

      {data && data.results.length > 0 && (
        <div style={{ background: "white", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #e2e5ec", marginTop: "16px" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #e2e5ec", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 600 }}>Publicações encontradas</h3>
            <span style={{ fontSize: "12px", color: "#94a3b8", background: "#f1f5f9", padding: "3px 10px", borderRadius: "12px" }}>
              {data.total} publicação(ões)
            </span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Publicação</th>
                  <th style={thStyle}>Seção</th>
                  <th style={thStyle}>Data</th>
                  <th style={thStyle}>Órgão</th>
                  <th style={{ ...thStyle, textAlign: "center" }}>Link</th>
                </tr>
              </thead>
              <tbody>
                {data.results.map((item, index) => (
                  <tr key={`${item.href}-${index}`} style={{ background: index % 2 === 0 ? "transparent" : "#fcfcfd" }}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600, fontSize: "13px", lineHeight: 1.3, maxWidth: "400px" }}>{item.title}</div>
                      {item.abstract && (
                        <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px", lineHeight: 1.4, maxWidth: "400px" }}>
                          {item.abstract.length > 120 ? item.abstract.slice(0, 120) + "..." : item.abstract}
                        </div>
                      )}
                    </td>
                    <td style={tdStyle}>
                      {item.section && (
                        <span style={{
                          display: "inline-block", padding: "2px 8px", borderRadius: "4px",
                          fontSize: "11px", fontWeight: 600, background: "#dbeafe", color: "#1e40af",
                          textTransform: "capitalize",
                        }}>
                          {item.section}
                        </span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>{item.date || "—"}</span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>{item.hierarchy || "—"}</span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: "4px 10px", border: "none", borderRadius: "4px",
                          background: "#1a237e", color: "white", fontSize: "11px", fontWeight: 600,
                          textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px",
                        }}
                      >
                        <ExternalLink style={{ width: "11px", height: "11px" }} />
                        Abrir
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!submittedTerm && (
        <div style={{ textAlign: "center", padding: "48px", color: "#94a3b8" }}>
          <Newspaper className="w-10 h-10 mx-auto mb-3" style={{ opacity: 0.3 }} />
          <p style={{ fontSize: "14px" }}>Pesquise publicações no Diário Oficial da União</p>
          <p style={{ fontSize: "12px", marginTop: "4px", opacity: 0.7 }}>
            Encontre resoluções, portarias e outros atos publicados pelo governo federal
          </p>
        </div>
      )}
    </>
  );
}

function DOUCrossRefContent() {
  const [normaText, setNormaText] = useState("");
  const [submittedNorma, setSubmittedNorma] = useState("");

  const { data, isLoading, error } = useDOUCrossReference(
    submittedNorma || null,
    !!submittedNorma
  );

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedNorma(normaText.trim());
  }, [normaText]);

  const quickNormas = [
    "Resolução FNDE 15/2021",
    "Lei 11.947/2009",
    "Lei 14.113/2020",
    "Resolução FNDE PDDE",
  ];

  return (
    <>
      <div style={{
        background: "#eff6ff",
        borderLeft: "4px solid #3b82f6",
        padding: "16px 20px",
        borderRadius: "0 10px 10px 0",
        fontSize: "13px",
        color: "#1e40af",
        marginBottom: "16px",
        lineHeight: 1.7,
      }}>
        <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Info className="w-4 h-4" />
          Verificação de Vigência no DOU
        </div>
        <p>Verifique se uma norma específica foi publicada, alterada ou revogada consultando o Diário Oficial da União. Útil para confirmar a vigência de resoluções do FNDE, portarias do MEC e demais atos normativos.</p>
        <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #bfdbfe", fontSize: "12px", color: "#1e3a8a" }}>
          <strong>Como usar:</strong> Digite o nome ou número da norma (ex: "Resolução FNDE 15/2021") para encontrar publicações relacionadas no DOU.
        </div>
      </div>

      <div style={{ background: "white", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #e2e5ec" }}>
        <form onSubmit={handleSearch}>
          <div style={{ padding: "16px 20px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "3px", flex: 1, minWidth: "200px" }}>
              <label style={labelStyle}>Nome ou número da norma</label>
              <input
                type="text"
                value={normaText}
                onChange={(e) => setNormaText(e.target.value)}
                placeholder="Ex: Resolução FNDE 15/2021..."
                style={inputStyle}
              />
            </div>
            <button
              type="submit"
              disabled={!normaText.trim()}
              style={{
                padding: "8px 18px", border: "none", borderRadius: "6px",
                fontSize: "13px", fontWeight: 600, cursor: normaText.trim() ? "pointer" : "not-allowed",
                display: "inline-flex", alignItems: "center", gap: "6px",
                background: normaText.trim() ? "#1a237e" : "#94a3b8", color: "white",
                transition: "all 0.15s",
              }}
            >
              <Search style={{ width: "14px", height: "14px" }} />
              Verificar
            </button>
          </div>
        </form>
        <div style={{ padding: "0 20px 12px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
          <span style={{ fontSize: "11px", color: "#94a3b8", alignSelf: "center" }}>Exemplos:</span>
          {quickNormas.map((term) => (
            <button
              key={term}
              onClick={() => { setNormaText(term); setSubmittedNorma(term); }}
              style={{
                padding: "4px 10px", borderRadius: "20px", border: "none",
                fontSize: "11px", fontWeight: 500, cursor: "pointer",
                background: "#dbeafe", color: "#1e40af",
                transition: "all 0.15s",
              }}
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div style={{ textAlign: "center", padding: "48px", color: "#94a3b8" }}>
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: "#1a237e" }} />
          <div style={{ fontSize: "13px" }}>Verificando no Diário Oficial...</div>
        </div>
      )}

      {error && (
        <div style={{
          background: "#fffbeb", borderLeft: "3px solid #f59e0b",
          padding: "10px 14px", borderRadius: "0 6px 6px 0",
          fontSize: "12px", color: "#92400e", marginTop: "16px",
        }}>
          <AlertCircle className="w-4 h-4 inline mr-2" />
          Não foi possível consultar o DOU. O portal pode estar temporariamente indisponível.
        </div>
      )}

      {!isLoading && !error && data && submittedNorma && (
        <div style={{ marginTop: "16px" }}>
          {data.results.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px" }}>
              <Newspaper className="w-10 h-10 mx-auto mb-3" style={{ color: "#3b82f6", opacity: 0.6 }} />
              <p style={{ fontSize: "14px", color: "#94a3b8", marginBottom: "12px" }}>
                Busca preparada para "{submittedNorma}"
              </p>
              {data.searchUrl && (
                <a
                  href={data.searchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "8px",
                    padding: "10px 20px", borderRadius: "6px",
                    background: "#1a237e", color: "white", textDecoration: "none",
                    fontSize: "13px", fontWeight: 600,
                  }}
                >
                  <ExternalLink style={{ width: "14px", height: "14px" }} />
                  Verificar no site oficial do DOU
                </a>
              )}
            </div>
          ) : (
            <div style={{ background: "white", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #e2e5ec" }}>
              <div style={{
                background: "#f0fdf4", borderLeft: "3px solid #2e7d32",
                padding: "10px 14px", borderRadius: "0 6px 6px 0",
                fontSize: "12px", color: "#2e7d32", margin: "16px 16px 0",
              }}>
                {data.results.length} publicação(ões) encontrada(s) no DOU para "{submittedNorma}"
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Publicação</th>
                      <th style={thStyle}>Seção</th>
                      <th style={thStyle}>Data</th>
                      <th style={{ ...thStyle, textAlign: "center" }}>Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.results.map((item, index) => (
                      <tr key={`${item.href}-${index}`} style={{ background: index % 2 === 0 ? "transparent" : "#fcfcfd" }}>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: 600, fontSize: "13px", lineHeight: 1.3 }}>{item.title}</div>
                          {item.abstract && (
                            <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px", lineHeight: 1.4 }}>
                              {item.abstract.length > 150 ? item.abstract.slice(0, 150) + "..." : item.abstract}
                            </div>
                          )}
                        </td>
                        <td style={tdStyle}>
                          {item.section && (
                            <span style={{
                              display: "inline-block", padding: "2px 8px", borderRadius: "4px",
                              fontSize: "11px", fontWeight: 600, background: "#dbeafe", color: "#1e40af",
                            }}>
                              {item.section}
                            </span>
                          )}
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: "12px", color: "#64748b" }}>{item.date || "—"}</span>
                        </td>
                        <td style={{ ...tdStyle, textAlign: "center" }}>
                          <a
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: "4px 10px", border: "none", borderRadius: "4px",
                              background: "#1a237e", color: "white", fontSize: "11px", fontWeight: 600,
                              textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px",
                            }}
                          >
                            <ExternalLink style={{ width: "11px", height: "11px" }} />
                            Abrir
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {!submittedNorma && (
        <div style={{ textAlign: "center", padding: "48px", color: "#94a3b8" }}>
          <Scale className="w-10 h-10 mx-auto mb-3" style={{ opacity: 0.3 }} />
          <p style={{ fontSize: "14px" }}>Verifique a vigência de normas no DOU</p>
          <p style={{ fontSize: "12px", marginTop: "4px", opacity: 0.7 }}>
            Confirme se resoluções e atos normativos foram publicados, alterados ou revogados
          </p>
        </div>
      )}
    </>
  );
}

const thStyle: React.CSSProperties = {
  background: "#f8fafc",
  padding: "10px 14px",
  textAlign: "left",
  fontSize: "11px",
  fontWeight: 700,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  borderBottom: "2px solid #e2e5ec",
};

const tdStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderBottom: "1px solid #f1f5f9",
  fontSize: "13px",
  verticalAlign: "middle",
};

const labelStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.4px",
};

const inputStyle: React.CSSProperties = {
  padding: "8px 12px",
  border: "1px solid #e2e5ec",
  borderRadius: "6px",
  fontSize: "13px",
  background: "#fafbfc",
  color: "#1e293b",
  width: "100%",
  outline: "none",
};

const selectStyle: React.CSSProperties = {
  padding: "8px 12px",
  border: "1px solid #e2e5ec",
  borderRadius: "6px",
  fontSize: "13px",
  background: "#fafbfc",
  color: "#1e293b",
};

const paginationBtnStyle: React.CSSProperties = {
  padding: "6px 14px",
  border: "1px solid #e2e5ec",
  borderRadius: "6px",
  background: "white",
  fontSize: "12px",
  fontWeight: 500,
  color: "#64748b",
};

export default function Legislacao() {
  const [activeCategory, setActiveCategory] = useState<CategoryId>("cat-leis");
  const [activeSubTab, setActiveSubTab] = useState<SubTabId>("leis-todas");

  const switchCategory = (catId: CategoryId) => {
    setActiveCategory(catId);
    const cat = categories.find(c => c.id === catId);
    if (cat && cat.subTabs.length > 0) {
      setActiveSubTab(cat.subTabs[0].id);
    }
  };

  const renderContent = () => {
    if (activeSubTab.startsWith("leis-")) {
      return <LeisFundamentaisContent subTab={activeSubTab} />;
    }
    if (activeSubTab.startsWith("normas-")) {
      return <NormasContent subTab={activeSubTab} />;
    }
    if (activeSubTab === "dou-busca") {
      return <DOUBuscaContent />;
    }
    if (activeSubTab === "dou-crossref") {
      return <DOUCrossRefContent />;
    }
    return null;
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f5f6fa", fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif", color: "#1e293b", fontSize: "14px", lineHeight: 1.5 }}>
      <Navigation />

      <div style={{
        background: "linear-gradient(135deg, #0d1642 0%, #1a237e 50%, #3949ab 100%)",
        color: "white",
        padding: "20px 32px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
      }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.3px" }}>Painel de Legislação Educacional</h1>
            <p style={{ opacity: 0.75, fontSize: "12px", marginTop: "2px" }}>
              Leis fundamentais, normas do MEC e publicações do Diário Oficial da União
            </p>
          </div>
          <span style={{
            background: "rgba(255,255,255,0.15)",
            padding: "4px 12px",
            borderRadius: "20px",
            fontSize: "11px",
            fontWeight: 500,
          }}>
            Fontes oficiais
          </span>
        </div>
      </div>

      <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "20px 24px", flex: 1, width: "100%" }}>
        <nav style={{
          display: "flex",
          gap: "6px",
          background: "white",
          borderRadius: "10px 10px 0 0",
          padding: "6px 6px 0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
        }}>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => switchCategory(cat.id)}
              style={{
                padding: "12px 20px",
                borderRadius: "8px 8px 0 0",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 600,
                color: activeCategory === cat.id ? "white" : "#64748b",
                transition: "all 0.15s",
                whiteSpace: "nowrap",
                textAlign: "center",
                flexShrink: 0,
                border: "none",
                background: activeCategory === cat.id ? "#1a237e" : "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span style={{ fontSize: "18px" }}>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </nav>

        {categories.map(cat => (
          <div
            key={cat.id}
            style={{
              display: activeCategory === cat.id ? "flex" : "none",
              gap: "2px",
              background: "#f1f5f9",
              borderRadius: "0 0 10px 10px",
              padding: "4px 6px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              overflowX: "auto",
              WebkitOverflowScrolling: "touch",
              marginBottom: "20px",
            }}
          >
            {cat.subTabs.map(sub => (
              <button
                key={sub.id}
                onClick={() => setActiveSubTab(sub.id)}
                style={{
                  padding: "8px 14px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: activeSubTab === sub.id ? 600 : 500,
                  color: activeSubTab === sub.id ? "#1a237e" : "#64748b",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                  textAlign: "center",
                  flexShrink: 0,
                  border: "none",
                  background: activeSubTab === sub.id ? "white" : "none",
                  boxShadow: activeSubTab === sub.id ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                }}
              >
                {sub.label}
              </button>
            ))}
          </div>
        ))}

        {renderContent()}

        <div style={{
          background: "#fffbeb",
          borderLeft: "3px solid #f59e0b",
          padding: "10px 14px",
          borderRadius: "0 6px 6px 0",
          fontSize: "12px",
          color: "#92400e",
          marginTop: "24px",
        }}>
          <strong>Nota:</strong> Esta seção reúne as principais legislações de referência para a gestão escolar. 
          As abas "Normas do MEC" e "Diário Oficial" consultam dados diretamente dos portais oficiais do governo.
          Para dúvidas específicas sobre a aplicação dessas normas, consulte o{" "}
          <a href="/chat" style={{ color: "#1565c0", fontWeight: 600 }}>Caderno da Diretora</a>.
        </div>
      </main>

      <Footer />
    </div>
  );
}
