import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import {
  ExternalLink, Scale, FileText, BookOpen, Landmark, GraduationCap,
  Utensils, Bus, Coins, Users, ShieldCheck, ClipboardList, Search,
  Loader2, AlertCircle, Newspaper, ChevronDown, ChevronUp, BookMarked,
  Calendar, Building2, Info, MapPin, Globe
} from "lucide-react";
import { useState, useCallback } from "react";
import { useMecNormasAll, useMecNormasTipos } from "@/hooks/use-mecnormas";
import { useDOUSearch, useDOUCrossReference, useMunicipalGazetteSearch } from "@/hooks/use-dou";

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
    descricao: "Autoriza o repasse de recursos financeiros diretamente às escolas públicas de educação básica, sem necessidade de convênio.",
    link: "https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2009/lei/l11947.htm",
    categoria: "Programas FNDE",
    icon: FileText,
    destaque: "Dinheiro direto na conta da escola",
  },
  {
    titulo: "Resolução FNDE nº 15/2021 - PDDE Básico",
    numero: "Resolução CD/FNDE nº 15/2021",
    descricao: "Dispõe sobre os critérios e as formas de transferência e de prestação de contas dos recursos do PDDE.",
    link: "https://www.fnde.gov.br/index.php/legislacoes/resolucoes",
    categoria: "Programas FNDE",
    icon: ClipboardList,
  },
  {
    titulo: "PNAE - Programa Nacional de Alimentação Escolar",
    numero: "Lei nº 11.947/2009 (Art. 1 a 21)",
    descricao: "Garante alimentação escolar e ações de educação alimentar e nutricional. Determina que no mínimo 30% dos recursos sejam investidos na compra de alimentos da agricultura familiar.",
    link: "https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2009/lei/l11947.htm",
    categoria: "Programas FNDE",
    icon: Utensils,
    destaque: "Alimentação escolar de qualidade",
  },
  {
    titulo: "PNATE - Programa Nacional de Apoio ao Transporte Escolar",
    numero: "Lei nº 10.880/2004",
    descricao: "Garante o transporte escolar dos alunos da educação básica pública que residem em área rural.",
    link: "https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2004/lei/l10.880.htm",
    categoria: "Programas FNDE",
    icon: Bus,
  },
  {
    titulo: "PNLD - Programa Nacional do Livro e do Material Didático",
    numero: "Decreto nº 9.099/2017",
    descricao: "Avalia e disponibiliza obras didáticas, pedagógicas e literárias, além de outros materiais de apoio à prática educativa.",
    link: "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2017/decreto/d9099.htm",
    categoria: "Programas FNDE",
    icon: BookOpen,
  },
  {
    titulo: "Plano Nacional de Educação (PNE)",
    numero: "Lei nº 14.934/2024",
    descricao: "Estabelece 18 metas e estratégias para a educação brasileira no decênio 2024-2034.",
    link: "https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2024/lei/L14934.htm",
    categoria: "Planejamento",
    icon: GraduationCap,
    destaque: "Metas para a educação 2024-2034",
  },
  {
    titulo: "Estatuto da Criança e do Adolescente (ECA)",
    numero: "Lei nº 8.069/1990",
    descricao: "Dispõe sobre a proteção integral à criança e ao adolescente. Estabelece o direito à educação, à cultura, ao esporte e ao lazer.",
    link: "https://www.planalto.gov.br/ccivil_03/leis/l8069.htm",
    categoria: "Base Legal",
    icon: ShieldCheck,
  },
  {
    titulo: "Gestão Democrática na Educação",
    numero: "Lei nº 14.644/2023",
    descricao: "Institui a política de gestão democrática nas redes públicas de educação básica, regulamentando a escolha de diretores escolares.",
    link: "https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/lei/L14644.htm",
    categoria: "Gestão",
    icon: Users,
    destaque: "Gestão democrática e escolha de diretores",
  },
  {
    titulo: "Lei de Responsabilidade Fiscal",
    numero: "Lei Complementar nº 101/2000",
    descricao: "Estabelece normas de finanças públicas voltadas para a responsabilidade na gestão fiscal.",
    link: "https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp101.htm",
    categoria: "Financiamento",
    icon: Coins,
  },
];

const categoriaColors: Record<string, { bg: string; color: string }> = {
  "Base Legal": { bg: "#dcfce7", color: "#166534" },
  "Financiamento": { bg: "#ffedd5", color: "#9a3412" },
  "Programas FNDE": { bg: "#fee2e2", color: "#991b1b" },
  "Planejamento": { bg: "#f3e8ff", color: "#6b21a8" },
  "Gestão": { bg: "#dbeafe", color: "#1e40af" },
};

const doeLinks: { estado: string; sigla: string; url: string }[] = [
  { estado: "Acre", sigla: "AC", url: "https://www.diario.ac.gov.br/" },
  { estado: "Alagoas", sigla: "AL", url: "https://www.imprensaoficialal.com.br/" },
  { estado: "Amapá", sigla: "AP", url: "https://doe.ap.gov.br/" },
  { estado: "Amazonas", sigla: "AM", url: "https://diario.imprensaoficial.am.gov.br/" },
  { estado: "Bahia", sigla: "BA", url: "https://dool.egba.ba.gov.br/" },
  { estado: "Ceará", sigla: "CE", url: "https://www.ceara.gov.br/diario-oficial/" },
  { estado: "Distrito Federal", sigla: "DF", url: "https://www.dodf.df.gov.br/" },
  { estado: "Espírito Santo", sigla: "ES", url: "https://ioes.dio.es.gov.br/" },
  { estado: "Goiás", sigla: "GO", url: "https://diariooficial.abc.go.gov.br/" },
  { estado: "Maranhão", sigla: "MA", url: "https://www.diariooficial.ma.gov.br/" },
  { estado: "Mato Grosso", sigla: "MT", url: "https://www.iomat.mt.gov.br/" },
  { estado: "Mato Grosso do Sul", sigla: "MS", url: "https://www.do.ms.gov.br/" },
  { estado: "Minas Gerais", sigla: "MG", url: "https://www.jornalminasgerais.mg.gov.br/" },
  { estado: "Pará", sigla: "PA", url: "https://www.ioepa.com.br/" },
  { estado: "Paraíba", sigla: "PB", url: "https://auniao.pb.gov.br/doe/" },
  { estado: "Paraná", sigla: "PR", url: "https://www.legislacao.pr.gov.br/diario" },
  { estado: "Pernambuco", sigla: "PE", url: "https://www.cepe.com.br/diariooficial" },
  { estado: "Piauí", sigla: "PI", url: "https://www.diariooficial.pi.gov.br/" },
  { estado: "Rio de Janeiro", sigla: "RJ", url: "https://www.ioerj.com.br/" },
  { estado: "Rio Grande do Norte", sigla: "RN", url: "https://www.diariooficial.rn.gov.br/" },
  { estado: "Rio Grande do Sul", sigla: "RS", url: "https://www.diariooficial.rs.gov.br/" },
  { estado: "Rondônia", sigla: "RO", url: "https://diof.ro.gov.br/" },
  { estado: "Roraima", sigla: "RR", url: "https://www.imprensaoficial.rr.gov.br/" },
  { estado: "Santa Catarina", sigla: "SC", url: "https://www.doe.sea.sc.gov.br/" },
  { estado: "São Paulo", sigla: "SP", url: "https://www.doe.sp.gov.br/" },
  { estado: "Sergipe", sigla: "SE", url: "https://www.diarioficial.se.gov.br/" },
  { estado: "Tocantins", sigla: "TO", url: "https://diariooficial.to.gov.br/" },
];

type CategoryId = "cat-normas" | "cat-dou";
type SubTabId = "normas-leis" | "normas-todas" | "normas-vigentes" | "normas-busca" | "dou-federal" | "dou-municipal" | "dou-estadual";

const categories: { id: CategoryId; label: string; icon: string; subTabs: { id: SubTabId; label: string }[] }[] = [
  {
    id: "cat-normas",
    label: "Normas do MEC",
    icon: "\uD83D\uDCD6",
    subTabs: [
      { id: "normas-leis", label: "Leis Fundamentais" },
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
      { id: "dou-federal", label: "DOU (Federal)" },
      { id: "dou-municipal", label: "Diários Municipais" },
      { id: "dou-estadual", label: "DOE (Estados)" },
    ],
  },
];

function LeisFundamentaisContent() {
  const [filterCat, setFilterCat] = useState("Todos");
  const categoriasUnicas = ["Todos", ...Array.from(new Set(legislacoes.map(l => l.categoria)))];

  const leis = filterCat === "Todos"
    ? legislacoes
    : legislacoes.filter(l => l.categoria === filterCat);

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
          Leis Fundamentais da Educação
        </div>
        <p>Conjunto das principais leis, decretos e resoluções que orientam a gestão financeira e pedagógica das escolas públicas brasileiras. Inclui a base legal constitucional, normas de financiamento, programas do FNDE e instrumentos de planejamento e gestão.</p>
        <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #bfdbfe", fontSize: "12px", color: "#1e3a8a" }}>
          <strong>Total: {legislacoes.length} normas fundamentais | Fonte: Planalto - Legislação Federal Brasileira</strong>
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: "12px",
        marginBottom: "16px",
      }}>
        {categoriasUnicas.filter(c => c !== "Todos").map(cat => {
          const count = legislacoes.filter(l => l.categoria === cat).length;
          const colors = categoriaColors[cat] || { bg: "#f1f5f9", color: "#1a237e" };
          return (
            <div key={cat}
              onClick={() => setFilterCat(filterCat === cat ? "Todos" : cat)}
              style={{
                background: filterCat === cat ? colors.bg : "white",
                borderRadius: "10px",
                padding: "16px 20px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
                border: "1px solid #e2e5ec",
                borderLeft: `3px solid ${colors.color}`,
                cursor: "pointer",
                transition: "all 0.15s",
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
              {leis.map((lei, index) => {
                const catColor = categoriaColors[lei.categoria] || { bg: "#f1f5f9", color: "#1a237e" };
                return (
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
                        background: catColor.bg, color: catColor.color,
                      }}>
                        {lei.categoria}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {lei.destaque ? (
                        <span style={{ fontSize: "11px", color: "#1565c0", fontWeight: 500 }}>{lei.destaque}</span>
                      ) : (
                        <span style={{ fontSize: "11px", color: "#cbd5e1" }}>—</span>
                      )}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      <a href={lei.link} target="_blank" rel="noopener noreferrer"
                        style={{
                          display: "inline-flex", alignItems: "center", gap: "6px",
                          padding: "6px 14px", border: "none", borderRadius: "6px",
                          fontSize: "12px", fontWeight: 600, cursor: "pointer",
                          background: "#1a237e", color: "white", textDecoration: "none",
                        }}>
                        <ExternalLink style={{ width: "12px", height: "12px" }} />
                        Abrir
                      </a>
                    </td>
                  </tr>
                );
              })}
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

function DOUFederalContent() {
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
        <p>Pesquise publicações oficiais no Diário Oficial da União para verificar vigência de normas, encontrar novas resoluções e acompanhar alterações na legislação educacional federal.</p>
        <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #bfdbfe", fontSize: "12px", color: "#1e3a8a" }}>
          <strong>Fonte: Portal da Imprensa Nacional (in.gov.br)</strong>
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

function DOUMunicipalContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [submittedTerm, setSubmittedTerm] = useState("");
  const [offset, setOffset] = useState(0);
  const pageSize = 10;

  const { data, isLoading, error } = useMunicipalGazetteSearch(
    { q: submittedTerm, size: pageSize, offset },
    !!submittedTerm
  );

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedTerm(searchTerm.trim());
    setOffset(0);
  }, [searchTerm]);

  const quickSearches = [
    "educação escolar",
    "PDDE prestação de contas",
    "alimentação escolar",
    "transporte escolar",
    "conselho escolar",
  ];

  const total = data?.total || 0;
  const gazettes = data?.gazettes || [];
  const totalPages = Math.ceil(total / pageSize);
  const currentPage = Math.floor(offset / pageSize);

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
          Diários Oficiais Municipais
        </div>
        <p>Pesquise publicações nos diários oficiais de mais de 350 municípios brasileiros. Os dados são fornecidos pelo projeto Querido Diário (Open Knowledge Brasil), que coleta e disponibiliza diários oficiais municipais em formato aberto.</p>
        <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #bfdbfe", fontSize: "12px", color: "#1e3a8a" }}>
          <strong>Fonte: Querido Diário (queridodiario.ok.org.br) | Dados abertos - Creative Commons 4.0</strong>
        </div>
      </div>

      <div style={{ background: "white", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #e2e5ec" }}>
        <form onSubmit={handleSearch}>
          <div style={{ padding: "16px 20px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "3px", flex: 1, minWidth: "200px" }}>
              <label style={labelStyle}>Buscar nos diários municipais</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ex: educação, PDDE, alimentação escolar..."
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
              onClick={() => { setSearchTerm(term); setSubmittedTerm(term); setOffset(0); }}
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
          <div style={{ fontSize: "13px" }}>Consultando diários municipais...</div>
        </div>
      )}

      {error && (
        <div style={{
          background: "#fffbeb", borderLeft: "3px solid #f59e0b",
          padding: "10px 14px", borderRadius: "0 6px 6px 0",
          fontSize: "12px", color: "#92400e", marginTop: "16px",
        }}>
          <AlertCircle className="w-4 h-4 inline mr-2" />
          Não foi possível consultar os diários municipais. Tente novamente em alguns instantes.
        </div>
      )}

      {!isLoading && !error && data && gazettes.length === 0 && submittedTerm && (
        <div style={{ textAlign: "center", padding: "48px", color: "#94a3b8" }}>
          <MapPin className="w-10 h-10 mx-auto mb-3" style={{ opacity: 0.4 }} />
          <p style={{ fontSize: "14px" }}>Nenhuma publicação encontrada para "{submittedTerm}"</p>
          <p style={{ fontSize: "12px", marginTop: "4px", opacity: 0.7 }}>Tente outros termos ou verifique se o município está disponível no Querido Diário</p>
        </div>
      )}

      {gazettes.length > 0 && (
        <div style={{ background: "white", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #e2e5ec", marginTop: "16px" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #e2e5ec", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 600 }}>Publicações Municipais</h3>
            <span style={{ fontSize: "12px", color: "#94a3b8", background: "#f1f5f9", padding: "3px 10px", borderRadius: "12px" }}>
              {total.toLocaleString("pt-BR")} resultado(s)
            </span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Município</th>
                  <th style={thStyle}>UF</th>
                  <th style={thStyle}>Data</th>
                  <th style={thStyle}>Trecho</th>
                  <th style={{ ...thStyle, textAlign: "center" }}>Link</th>
                </tr>
              </thead>
              <tbody>
                {gazettes.map((g, index) => (
                  <tr key={`${g.territory_id}-${g.date}-${index}`} style={{ background: index % 2 === 0 ? "transparent" : "#fcfcfd" }}>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <MapPin style={{ width: "14px", height: "14px", color: "#3949ab", flexShrink: 0 }} />
                        <span style={{ fontWeight: 600, fontSize: "13px" }}>{g.territory_name}</span>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        display: "inline-block", padding: "2px 8px", borderRadius: "4px",
                        fontSize: "11px", fontWeight: 600, background: "#dbeafe", color: "#1e40af",
                      }}>
                        {g.state_code}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>
                        {g.date ? new Date(g.date + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {g.excerpts && g.excerpts.length > 0 ? (
                        <div
                          style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.5, maxWidth: "400px" }}
                          dangerouslySetInnerHTML={{
                            __html: g.excerpts[0].length > 200
                              ? g.excerpts[0].slice(0, 200) + "..."
                              : g.excerpts[0]
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: "11px", color: "#cbd5e1" }}>—</span>
                      )}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                        <a
                          href={g.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: "4px 10px", border: "none", borderRadius: "4px",
                            background: "#1a237e", color: "white", fontSize: "11px", fontWeight: 600,
                            textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px",
                          }}
                        >
                          <ExternalLink style={{ width: "11px", height: "11px" }} />
                          PDF
                        </a>
                        {g.txt_url && (
                          <a
                            href={g.txt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: "4px 10px", border: "1px solid #e2e5ec", borderRadius: "4px",
                              background: "white", color: "#64748b", fontSize: "11px", fontWeight: 600,
                              textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px",
                            }}
                          >
                            <FileText style={{ width: "11px", height: "11px" }} />
                            TXT
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{
              display: "flex", justifyContent: "center", alignItems: "center",
              gap: "8px", padding: "14px", borderTop: "1px solid #e2e5ec",
            }}>
              <button
                onClick={() => setOffset(Math.max(0, offset - pageSize))}
                disabled={offset <= 0}
                style={{ ...paginationBtnStyle, opacity: offset <= 0 ? 0.4 : 1, cursor: offset <= 0 ? "not-allowed" : "pointer" }}
              >
                Anterior
              </button>
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                Página {currentPage + 1} de {totalPages > 100 ? "100+" : totalPages}
              </span>
              <button
                onClick={() => setOffset(offset + pageSize)}
                disabled={currentPage >= totalPages - 1 || currentPage >= 99}
                style={{ ...paginationBtnStyle, opacity: currentPage >= totalPages - 1 ? 0.4 : 1, cursor: currentPage >= totalPages - 1 ? "not-allowed" : "pointer" }}
              >
                Próxima
              </button>
            </div>
          )}
        </div>
      )}

      {!submittedTerm && (
        <div style={{ textAlign: "center", padding: "48px", color: "#94a3b8" }}>
          <MapPin className="w-10 h-10 mx-auto mb-3" style={{ opacity: 0.3 }} />
          <p style={{ fontSize: "14px" }}>Pesquise nos diários oficiais municipais</p>
          <p style={{ fontSize: "12px", marginTop: "4px", opacity: 0.7 }}>
            Mais de 350 municípios disponíveis via Querido Diário
          </p>
        </div>
      )}
    </>
  );
}

function DOEEstadualContent() {
  const [filterState, setFilterState] = useState("");

  const filtered = filterState
    ? doeLinks.filter(d => d.sigla === filterState)
    : doeLinks;

  const regions: Record<string, string[]> = {
    "Norte": ["AC", "AP", "AM", "PA", "RO", "RR", "TO"],
    "Nordeste": ["AL", "BA", "CE", "MA", "PB", "PE", "PI", "RN", "SE"],
    "Centro-Oeste": ["DF", "GO", "MT", "MS"],
    "Sudeste": ["ES", "MG", "RJ", "SP"],
    "Sul": ["PR", "RS", "SC"],
  };

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
          Diários Oficiais dos Estados (DOE)
        </div>
        <p>Acesse os diários oficiais de cada estado brasileiro. Cada estado possui seu próprio portal de publicações oficiais, onde é possível encontrar decretos, resoluções e atos normativos estaduais relacionados à educação.</p>
        <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #bfdbfe", fontSize: "12px", color: "#1e3a8a" }}>
          <strong>Total: {doeLinks.length} portais estaduais + Distrito Federal | Links diretos para os portais oficiais</strong>
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: "12px",
        marginBottom: "16px",
      }}>
        {Object.entries(regions).map(([region, states]) => {
          const regionColors: Record<string, string> = {
            "Norte": "#2e7d32",
            "Nordeste": "#ef6c00",
            "Centro-Oeste": "#c62828",
            "Sudeste": "#1565c0",
            "Sul": "#6b21a8",
          };
          return (
            <div key={region} style={{
              background: "white",
              borderRadius: "10px",
              padding: "16px 20px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
              border: "1px solid #e2e5ec",
              borderLeft: `3px solid ${regionColors[region] || "#1a237e"}`,
            }}>
              <div style={{ fontSize: "26px", fontWeight: 800, color: "#1a237e", lineHeight: 1.1 }}>
                {states.length}
              </div>
              <div style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: "4px" }}>{region}</div>
            </div>
          );
        })}
      </div>

      <div style={{ background: "white", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #e2e5ec" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e5ec", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 600 }}>Portais Estaduais</h3>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <select
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
              style={selectStyle}
            >
              <option value="">Todos os estados</option>
              {doeLinks.map(d => (
                <option key={d.sigla} value={d.sigla}>{d.sigla} - {d.estado}</option>
              ))}
            </select>
            <span style={{ fontSize: "12px", color: "#94a3b8", background: "#f1f5f9", padding: "3px 10px", borderRadius: "12px" }}>
              {filtered.length} estado(s)
            </span>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "500px" }}>
            <thead>
              <tr>
                <th style={thStyle}>Estado</th>
                <th style={thStyle}>UF</th>
                <th style={thStyle}>Região</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Portal</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doe, index) => {
                const region = Object.entries(regions).find(([_, states]) => states.includes(doe.sigla));
                return (
                  <tr key={doe.sigla} style={{ background: index % 2 === 0 ? "transparent" : "#fcfcfd" }}>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Globe style={{ width: "14px", height: "14px", color: "#3949ab", flexShrink: 0 }} />
                        <span style={{ fontWeight: 600, fontSize: "13px" }}>{doe.estado}</span>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        display: "inline-block", padding: "2px 8px", borderRadius: "4px",
                        fontSize: "11px", fontWeight: 600, background: "#e8eaf6", color: "#3949ab",
                      }}>
                        {doe.sigla}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>{region ? region[0] : "—"}</span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      <a
                        href={doe.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: "6px 14px", border: "none", borderRadius: "6px",
                          background: "#1a237e", color: "white", fontSize: "12px", fontWeight: 600,
                          textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px",
                        }}
                      >
                        <ExternalLink style={{ width: "12px", height: "12px" }} />
                        Acessar DOE
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
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
  const [activeCategory, setActiveCategory] = useState<CategoryId>("cat-normas");
  const [activeSubTab, setActiveSubTab] = useState<SubTabId>("normas-leis");

  const switchCategory = (catId: CategoryId) => {
    setActiveCategory(catId);
    const cat = categories.find(c => c.id === catId);
    if (cat && cat.subTabs.length > 0) {
      setActiveSubTab(cat.subTabs[0].id);
    }
  };

  const renderContent = () => {
    if (activeSubTab === "normas-leis") {
      return <LeisFundamentaisContent />;
    }
    if (activeSubTab === "normas-todas" || activeSubTab === "normas-vigentes" || activeSubTab === "normas-busca") {
      return <NormasContent subTab={activeSubTab} />;
    }
    if (activeSubTab === "dou-federal") {
      return <DOUFederalContent />;
    }
    if (activeSubTab === "dou-municipal") {
      return <DOUMunicipalContent />;
    }
    if (activeSubTab === "dou-estadual") {
      return <DOEEstadualContent />;
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
              Normas do MEC e publicações dos diários oficiais (federal, estaduais e municipais)
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
          <strong>Nota:</strong> Esta seção reúne normas e publicações oficiais para a gestão escolar.
          As abas "Normas do MEC" e "Diário Oficial" consultam dados diretamente dos portais oficiais do governo.
          Para dúvidas específicas sobre a aplicação dessas normas, consulte o{" "}
          <a href="/chat" style={{ color: "#1565c0", fontWeight: 600 }}>Caderno da Diretora</a>.
        </div>
      </main>

      <Footer />
    </div>
  );
}
