import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import {
  ExternalLink, Scale, FileText, Search, Landmark,
  Loader2, AlertCircle, Newspaper, BookMarked,
  Info, MapPin, Globe
} from "lucide-react";
import { useState, useCallback } from "react";
import { useMecNormasAll, useMecNormasTipos } from "@/hooks/use-mecnormas";
import { useDOUSearch, useMunicipalGazetteSearch } from "@/hooks/use-dou";

interface LeiFundamental {
  titulo: string;
  numero: string;
  descricao: string;
  link: string;
  categoria: string;
  paraADiretora: string;
}

const leisFundamentais: LeiFundamental[] = [
  {
    titulo: "Lei de Diretrizes e Bases da Educação Nacional (LDB)",
    numero: "Lei nº 9.394/1996",
    descricao: "Estabelece as diretrizes e bases da educação nacional.",
    link: "https://www.planalto.gov.br/ccivil_03/leis/l9394.htm",
    categoria: "Base Legal",
    paraADiretora: "A \"lei mãe\" da educação. Define como a escola deve funcionar: quantas horas de aula, como organizar as turmas, o que ensinar. Diz que a diretora tem autonomia para montar o projeto pedagógico da escola junto com a comunidade.",
  },
  {
    titulo: "Constituição Federal - Capítulo da Educação",
    numero: "CF/1988 - Arts. 205 a 214",
    descricao: "Define a educação como direito de todos e dever do Estado.",
    link: "https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm",
    categoria: "Base Legal",
    paraADiretora: "A base de tudo. Garante que toda criança tem direito a estudar de graça. Obriga o governo a investir pelo menos 18% (União) e 25% (estados e municípios) do dinheiro público em educação. Se não cumprir, é inconstitucional.",
  },
  {
    titulo: "FUNDEB - Fundo de Manutenção e Desenvolvimento da Educação Básica",
    numero: "Lei nº 14.113/2020",
    descricao: "Regulamenta o FUNDEB permanente, principal mecanismo de financiamento da educação básica.",
    link: "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2020/lei/l14113.htm",
    categoria: "Financiamento",
    paraADiretora: "O \"cofrinho\" principal da educação. Junta dinheiro de impostos e distribui para as escolas conforme o número de alunos. Quanto mais alunos sua escola tem, mais dinheiro ela recebe. Agora é permanente - não precisa mais renovar a cada 14 anos.",
  },
  {
    titulo: "PDDE - Programa Dinheiro Direto na Escola",
    numero: "Lei nº 11.947/2009 (Art. 22 a 30)",
    descricao: "Autoriza o repasse de recursos financeiros diretamente às escolas.",
    link: "https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2009/lei/l11947.htm",
    categoria: "Programas FNDE",
    paraADiretora: "Dinheiro que cai direto na conta da escola, sem precisar pedir para a prefeitura. A diretora decide, junto com o conselho escolar, como gastar: pode comprar material, consertar a escola, pagar pequenos serviços. Precisa prestar contas direitinho depois.",
  },
  {
    titulo: "Resolução FNDE nº 15/2021 - PDDE Básico",
    numero: "Resolução CD/FNDE nº 15/2021",
    descricao: "Dispõe sobre critérios de transferência e prestação de contas do PDDE.",
    link: "https://www.fnde.gov.br/index.php/legislacoes/resolucoes",
    categoria: "Programas FNDE",
    paraADiretora: "O \"manual de instruções\" do PDDE. Explica passo a passo: como o dinheiro chega, o que pode e o que não pode comprar, como guardar as notas fiscais e como fazer a prestação de contas. Se seguir direitinho, não tem erro.",
  },
  {
    titulo: "PNAE - Programa Nacional de Alimentação Escolar",
    numero: "Lei nº 11.947/2009 (Art. 1 a 21)",
    descricao: "Garante alimentação escolar e ações de educação alimentar e nutricional.",
    link: "https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2009/lei/l11947.htm",
    categoria: "Programas FNDE",
    paraADiretora: "Garante a merenda na escola. Regra importante: pelo menos 30% do dinheiro tem que ser gasto comprando comida de agricultores da região. A diretora precisa acompanhar o cardápio (feito por nutricionista) e garantir que os alunos comam bem.",
  },
  {
    titulo: "PNATE - Programa Nacional de Apoio ao Transporte Escolar",
    numero: "Lei nº 10.880/2004",
    descricao: "Garante o transporte escolar dos alunos da educação básica que residem em área rural.",
    link: "https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2004/lei/l10.880.htm",
    categoria: "Programas FNDE",
    paraADiretora: "Dinheiro para levar e trazer os alunos que moram no campo até a escola. Se sua escola recebe alunos da zona rural, esse programa garante que eles tenham como chegar. A diretora pode ajudar a identificar alunos que precisam do transporte.",
  },
  {
    titulo: "PNLD - Programa Nacional do Livro e do Material Didático",
    numero: "Decreto nº 9.099/2017",
    descricao: "Disponibiliza obras didáticas, pedagógicas e literárias para as escolas.",
    link: "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2017/decreto/d9099.htm",
    categoria: "Programas FNDE",
    paraADiretora: "O governo manda livros e materiais para a escola de graça. A diretora e os professores escolhem quais livros querem entre as opções aprovadas. Importante: cuidar bem dos livros porque eles são reutilizados por outros alunos nos anos seguintes.",
  },
  {
    titulo: "Plano Nacional de Educação (PNE)",
    numero: "Lei nº 14.934/2024",
    descricao: "Estabelece 18 metas e estratégias para a educação brasileira 2024-2034.",
    link: "https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2024/lei/L14934.htm",
    categoria: "Planejamento",
    paraADiretora: "O \"plano de 10 anos\" da educação no Brasil. Tem 18 metas que o país precisa cumprir até 2034: alfabetizar todas as crianças, ter mais escolas em tempo integral, valorizar os professores. A diretora pode usar essas metas para justificar melhorias na escola.",
  },
  {
    titulo: "Estatuto da Criança e do Adolescente (ECA)",
    numero: "Lei nº 8.069/1990",
    descricao: "Dispõe sobre a proteção integral à criança e ao adolescente.",
    link: "https://www.planalto.gov.br/ccivil_03/leis/l8069.htm",
    categoria: "Base Legal",
    paraADiretora: "Protege todas as crianças e adolescentes. A escola é obrigada a comunicar ao Conselho Tutelar se perceber maus-tratos, faltas excessivas sem justificativa ou evasão escolar. A diretora tem papel fundamental nessa proteção.",
  },
  {
    titulo: "Gestão Democrática na Educação",
    numero: "Lei nº 14.644/2023",
    descricao: "Institui a gestão democrática nas redes públicas de educação básica.",
    link: "https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/lei/L14644.htm",
    categoria: "Gestão",
    paraADiretora: "Define como diretores escolares são escolhidos: com participação da comunidade (eleição, consulta pública). A diretora precisa governar junto com o conselho escolar, ouvir pais, alunos e professores nas decisões importantes da escola.",
  },
  {
    titulo: "Lei de Responsabilidade Fiscal",
    numero: "Lei Complementar nº 101/2000",
    descricao: "Estabelece normas de finanças públicas voltadas para a responsabilidade fiscal.",
    link: "https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp101.htm",
    categoria: "Financiamento",
    paraADiretora: "Regra de ouro do dinheiro público: não pode gastar mais do que recebe. A diretora precisa planejar os gastos da escola com cuidado, guardar todos os comprovantes e nunca usar o dinheiro público para fins pessoais. Transparência total.",
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

const categories: { id: CategoryId; label: string; icon: string }[] = [
  {
    id: "cat-normas",
    label: "Normas",
    icon: "\uD83D\uDCD6",
  },
  {
    id: "cat-dou",
    label: "Diário Oficial",
    icon: "\uD83D\uDCF0",
  },
];

function NormasContent() {
  const [page, setPage] = useState(0);
  const [selectedTipo, setSelectedTipo] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const pageSize = 30;

  const { data: tiposData, isLoading: tiposLoading } = useMecNormasTipos();

  const { data, isLoading, error } = useMecNormasAll({
    page,
    size: pageSize,
    tipo: selectedTipo || undefined,
    q: submittedSearch || undefined,
  });

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedSearch(searchTerm.trim());
    setPage(0);
  }, [searchTerm]);

  const handleClearSearch = useCallback(() => {
    setSearchTerm("");
    setSubmittedSearch("");
    setPage(0);
  }, []);

  const normas: any[] = data?.entidades || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 0;
  const showFundamentais = page === 0 && !submittedSearch && !selectedTipo;

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
          Normas
        </div>
        <p>Acervo completo de atos normativos do Ministério da Educação, com as {leisFundamentais.length} leis fundamentais da educação em destaque. Pesquise por palavras-chave, filtre por tipo e confira o status de vigência de cada norma.</p>
        <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #bfdbfe", fontSize: "12px", color: "#1e3a8a" }}>
          <strong>Total no acervo: {tiposData?.totalGeral?.toLocaleString("pt-BR") || "carregando..."} normas | Fonte: MEC Normas - Ministério da Educação</strong>
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
                background: selectedTipo === String(tipo.id) ? "#f0f4ff" : "white",
                borderRadius: "10px",
                padding: "16px 20px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
                border: selectedTipo === String(tipo.id) ? "1px solid #93c5fd" : "1px solid #e2e5ec",
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
          <form onSubmit={handleSearch} style={{ display: "flex", gap: "10px", flex: 1, minWidth: "200px", alignItems: "flex-end" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "3px", flex: 1 }}>
              <label style={labelStyle}>Pesquisar normas</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ex: PDDE, PNAE, alimentação escolar, prestação de contas..."
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
          {(selectedTipo || submittedSearch) && (
            <button
              onClick={() => { setSelectedTipo(""); handleClearSearch(); }}
              style={{
                padding: "8px 14px", border: "1px solid #e2e5ec", borderRadius: "6px",
                fontSize: "12px", fontWeight: 500, cursor: "pointer",
                background: "white", color: "#64748b",
              }}
            >
              Limpar filtros
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

        {!isLoading && !error && normas.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px", color: "#94a3b8" }}>
            <BookMarked className="w-10 h-10 mx-auto mb-3" style={{ opacity: 0.4 }} />
            <p style={{ fontSize: "14px" }}>Nenhuma norma encontrada</p>
          </div>
        )}

        {showFundamentais && (
          <>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #e2e5ec", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fffbeb" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#92400e", display: "flex", alignItems: "center", gap: "8px" }}>
                <Scale style={{ width: "16px", height: "16px" }} />
                Leis Fundamentais da Educação
              </h3>
              <span style={{ fontSize: "12px", color: "#92400e", background: "#fef3c7", padding: "3px 10px", borderRadius: "12px", fontWeight: 600 }}>
                {leisFundamentais.length} normas essenciais
              </span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Norma</th>
                    <th style={thStyle}>Categoria</th>
                    <th style={thStyle}>Para a Diretora</th>
                    <th style={{ ...thStyle, textAlign: "center" }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {leisFundamentais.map((lei, index) => {
                    const catColor = categoriaColors[lei.categoria] || { bg: "#f1f5f9", color: "#1a237e" };
                    return (
                      <tr key={lei.numero} style={{ background: index % 2 === 0 ? "#fffef5" : "#fefce8" }}>
                        <td style={tdStyle}>
                          <div style={{ maxWidth: "300px" }}>
                            <div style={{ fontWeight: 600, fontSize: "13px", lineHeight: 1.3, color: "#1e293b" }}>
                              {lei.titulo}
                            </div>
                            <div style={{ fontSize: "11px", fontFamily: "monospace", color: "#94a3b8", marginTop: "2px" }}>
                              {lei.numero}
                            </div>
                            <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "4px", lineHeight: 1.5 }}>
                              {lei.descricao}
                            </div>
                          </div>
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
                          <div style={{
                            fontSize: "12px", color: "#4a5568", lineHeight: 1.6, maxWidth: "350px",
                            background: "#f0fdf4", padding: "8px 12px", borderRadius: "6px",
                            borderLeft: "3px solid #22c55e",
                          }}>
                            {lei.paraADiretora}
                          </div>
                        </td>
                        <td style={{ ...tdStyle, textAlign: "center" }}>
                          <a href={lei.link} target="_blank" rel="noopener noreferrer"
                            style={{
                              padding: "6px 14px", border: "none", borderRadius: "6px",
                              background: "#1a237e", color: "white", fontSize: "11px", fontWeight: 600,
                              textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px",
                            }}>
                            <ExternalLink style={{ width: "11px", height: "11px" }} />
                            Abrir
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{
              padding: "12px 20px",
              borderTop: "2px solid #e2e5ec",
              borderBottom: "1px solid #e2e5ec",
              background: "#f8fafc",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1a237e", display: "flex", alignItems: "center", gap: "8px" }}>
                <FileText style={{ width: "16px", height: "16px" }} />
                Demais Normas
              </h3>
              <span style={{ fontSize: "12px", color: "#94a3b8", background: "#f1f5f9", padding: "3px 10px", borderRadius: "12px" }}>
                {total.toLocaleString("pt-BR")} norma(s) no acervo
              </span>
            </div>
          </>
        )}

        {!showFundamentais && normas.length > 0 && (
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #e2e5ec", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 600 }}>
              {submittedSearch ? `Resultados para "${submittedSearch}"` : "Normas"}
            </h3>
            <span style={{ fontSize: "12px", color: "#94a3b8", background: "#f1f5f9", padding: "3px 10px", borderRadius: "12px" }}>
              {total.toLocaleString("pt-BR")} norma(s)
            </span>
          </div>
        )}

        {normas.length > 0 && (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Norma</th>
                    <th style={thStyle}>Tipo</th>
                    <th style={thStyle}>Vigência</th>
                    <th style={thStyle}>Para a Diretora</th>
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
                    const isVigente = norma.vigente;
                    const correlacoes = norma.correlacoes || [];
                    const hasAlteracao = correlacoes.length > 0;
                    const encerraVigencia = correlacoes.some((c: any) => c.encerraVigencia);

                    return (
                      <tr key={norma.id} style={{ background: index % 2 === 0 ? "transparent" : "#fcfcfd" }}>
                        <td style={tdStyle}>
                          <div style={{ maxWidth: "350px" }}>
                            <div style={{ fontWeight: 600, fontSize: "13px", lineHeight: 1.3, color: "#1e293b" }}>
                              {title}
                            </div>
                            {ementa && (
                              <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "4px", lineHeight: 1.5 }}>
                                {ementa.length > 150 ? ementa.slice(0, 150) + "..." : ementa}
                              </div>
                            )}
                            {date && (
                              <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "3px" }}>
                                {norma.unidade?.sigla ? `${norma.unidade.sigla} | ` : ""}{date}
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
                          <div>
                            {isVigente === true && !encerraVigencia && (
                              <span style={{
                                display: "inline-block", padding: "2px 8px", borderRadius: "4px",
                                fontSize: "11px", fontWeight: 600, background: "#dcfce7", color: "#166534",
                              }}>
                                Vigente
                              </span>
                            )}
                            {isVigente === true && encerraVigencia && (
                              <span style={{
                                display: "inline-block", padding: "2px 8px", borderRadius: "4px",
                                fontSize: "11px", fontWeight: 600, background: "#fef3c7", color: "#92400e",
                              }}>
                                Com alteração
                              </span>
                            )}
                            {isVigente === false && (
                              <span style={{
                                display: "inline-block", padding: "2px 8px", borderRadius: "4px",
                                fontSize: "11px", fontWeight: 600, background: "#fee2e2", color: "#991b1b",
                              }}>
                                Revogada
                              </span>
                            )}
                            {(isVigente === undefined || isVigente === null) && (
                              <span style={{ fontSize: "11px", color: "#cbd5e1" }}>—</span>
                            )}
                            {hasAlteracao && correlacoes.slice(0, 1).map((c: any, ci: number) => (
                              <div key={ci} style={{ fontSize: "10px", color: "#94a3b8", marginTop: "3px", lineHeight: 1.3 }}>
                                {c.textoCorrelacao}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td style={tdStyle}>
                          {ementa ? (
                            <div style={{
                              fontSize: "12px", color: "#4a5568", lineHeight: 1.5, maxWidth: "300px",
                              background: "#f8fafc", padding: "6px 10px", borderRadius: "6px",
                              borderLeft: "3px solid #94a3b8",
                            }}>
                              {ementa.length > 120 ? ementa.slice(0, 120) + "..." : ementa}
                            </div>
                          ) : (
                            <span style={{ fontSize: "11px", color: "#cbd5e1" }}>—</span>
                          )}
                        </td>
                        <td style={{ ...tdStyle, textAlign: "center" }}>
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

function DiarioOficialContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [submittedTerm, setSubmittedTerm] = useState("");
  const [munOffset, setMunOffset] = useState(0);
  const munPageSize = 10;

  const douQuery = useDOUSearch(
    { q: submittedTerm, exact: false, limit: 20 },
    !!submittedTerm
  );

  const munQuery = useMunicipalGazetteSearch(
    { q: submittedTerm, size: munPageSize, offset: munOffset },
    !!submittedTerm
  );

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedTerm(searchTerm.trim());
    setMunOffset(0);
  }, [searchTerm]);

  const quickSearches = [
    "PDDE FNDE",
    "PNAE alimentação escolar",
    "PNATE transporte escolar",
    "FUNDEB educação básica",
    "educação escolar",
  ];

  const douResults = douQuery.data?.results || [];
  const douSearchUrl = douQuery.data?.searchUrl;
  const munGazettes = munQuery.data?.gazettes || [];
  const munTotal = munQuery.data?.total || 0;
  const munTotalPages = Math.ceil(munTotal / munPageSize);
  const munCurrentPage = Math.floor(munOffset / munPageSize);
  const isLoading = douQuery.isLoading || munQuery.isLoading;
  const hasResults = douResults.length > 0 || munGazettes.length > 0;

  type UnifiedResult = {
    type: "federal" | "municipal";
    title: string;
    subtitle: string;
    date: string;
    source: string;
    badge: string;
    link: string;
    extraLink?: string;
    excerpt?: string;
  };

  const unifiedResults: UnifiedResult[] = [];

  douResults.forEach(item => {
    unifiedResults.push({
      type: "federal",
      title: item.title,
      subtitle: item.abstract || "",
      date: item.date || "",
      source: item.hierarchy || "Governo Federal",
      badge: "União",
      link: item.href,
    });
  });

  munGazettes.forEach(g => {
    unifiedResults.push({
      type: "municipal",
      title: g.territory_name,
      subtitle: g.excerpts && g.excerpts.length > 0 ? g.excerpts[0] : "",
      date: g.date ? new Date(g.date + "T12:00:00").toLocaleDateString("pt-BR") : "",
      source: `${g.territory_name} - ${g.state_code}`,
      badge: "Município",
      link: g.url,
      extraLink: g.txt_url || undefined,
    });
  });

  const sourceBadgeStyle = (type: string): React.CSSProperties => {
    if (type === "federal") return { display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: "#dbeafe", color: "#1e40af", border: "1px solid #93c5fd" };
    if (type === "municipal") return { display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: "#dcfce7", color: "#166534", border: "1px solid #86efac" };
    return { display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: "#f3e8ff", color: "#6b21a8", border: "1px solid #c4b5fd" };
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
          Diários Oficiais
        </div>
        <p>Busca unificada nos diários oficiais: DOU (União), diários municipais (350+ cidades via Querido Diário) e portais estaduais (27 DOEs). Os resultados são classificados por origem.</p>
        <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #bfdbfe", fontSize: "12px", color: "#1e3a8a" }}>
          <strong>Fontes: Imprensa Nacional (in.gov.br) | Querido Diário (queridodiario.ok.org.br) | Portais estaduais</strong>
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
        <div style={{ ...sourceBadgeStyle("federal"), cursor: "default" }}>
          <Landmark style={{ width: "12px", height: "12px" }} />
          União (DOU)
        </div>
        <div style={{ ...sourceBadgeStyle("municipal"), cursor: "default" }}>
          <MapPin style={{ width: "12px", height: "12px" }} />
          Município (350+ cidades)
        </div>
        <div style={{ ...sourceBadgeStyle("estado"), cursor: "default" }}>
          <Globe style={{ width: "12px", height: "12px" }} />
          Estados ({doeLinks.length} portais)
        </div>
      </div>

      <div style={{ background: "white", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #e2e5ec" }}>
        <form onSubmit={handleSearch}>
          <div style={{ padding: "16px 20px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "3px", flex: 1, minWidth: "200px" }}>
              <label style={labelStyle}>Buscar nos diários oficiais</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ex: PDDE, alimentação escolar, prestação de contas..."
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
              onClick={() => { setSearchTerm(term); setSubmittedTerm(term); setMunOffset(0); }}
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
          <div style={{ fontSize: "13px" }}>Consultando diários oficiais (federal e municipais)...</div>
        </div>
      )}

      {(douQuery.error || munQuery.error) && (
        <div style={{
          background: "#fffbeb", borderLeft: "3px solid #f59e0b",
          padding: "10px 14px", borderRadius: "0 6px 6px 0",
          fontSize: "12px", color: "#92400e", marginTop: "16px",
        }}>
          <AlertCircle className="w-4 h-4 inline mr-2" />
          {douQuery.error && munQuery.error
            ? "Não foi possível consultar os diários oficiais. Tente novamente em alguns instantes."
            : douQuery.error
              ? "DOU temporariamente indisponível. Mostrando resultados municipais."
              : "Diários municipais temporariamente indisponíveis. Mostrando resultados do DOU."
          }
        </div>
      )}

      {!isLoading && submittedTerm && !hasResults && (
        <div style={{ textAlign: "center", padding: "48px" }}>
          <Newspaper className="w-10 h-10 mx-auto mb-3" style={{ color: "#3b82f6", opacity: 0.6 }} />
          <p style={{ fontSize: "14px", color: "#94a3b8", marginBottom: "12px" }}>
            Nenhum resultado encontrado para "{submittedTerm}"
          </p>
          {douSearchUrl && (
            <a
              href={douSearchUrl}
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
              Tentar busca direta no site do DOU
            </a>
          )}
        </div>
      )}

      {hasResults && (
        <div style={{ background: "white", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #e2e5ec", marginTop: "16px" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #e2e5ec", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 600 }}>Resultados para "{submittedTerm}"</h3>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {douResults.length > 0 && (
                <span style={{ fontSize: "11px", color: "#1e40af", background: "#dbeafe", padding: "3px 10px", borderRadius: "12px", fontWeight: 600 }}>
                  {douResults.length} da União
                </span>
              )}
              {munTotal > 0 && (
                <span style={{ fontSize: "11px", color: "#166534", background: "#dcfce7", padding: "3px 10px", borderRadius: "12px", fontWeight: 600 }}>
                  {munTotal.toLocaleString("pt-BR")} municipais
                </span>
              )}
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Origem</th>
                  <th style={thStyle}>Publicação</th>
                  <th style={thStyle}>Data</th>
                  <th style={thStyle}>Fonte</th>
                  <th style={{ ...thStyle, textAlign: "center" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {unifiedResults.map((r, index) => (
                  <tr key={`${r.type}-${index}`} style={{ background: index % 2 === 0 ? "transparent" : "#fcfcfd" }}>
                    <td style={tdStyle}>
                      <span style={sourceBadgeStyle(r.type)}>
                        {r.type === "federal" && <Landmark style={{ width: "11px", height: "11px" }} />}
                        {r.type === "municipal" && <MapPin style={{ width: "11px", height: "11px" }} />}
                        {r.badge}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ maxWidth: "400px" }}>
                        <div style={{ fontWeight: 600, fontSize: "13px", lineHeight: 1.3 }}>{r.title}</div>
                        {r.subtitle && (
                          r.type === "municipal" ? (
                            <div
                              style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px", lineHeight: 1.4, maxWidth: "400px" }}
                              dangerouslySetInnerHTML={{
                                __html: r.subtitle.length > 150 ? r.subtitle.slice(0, 150) + "..." : r.subtitle
                              }}
                            />
                          ) : (
                            <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px", lineHeight: 1.4, maxWidth: "400px" }}>
                              {r.subtitle.length > 150 ? r.subtitle.slice(0, 150) + "..." : r.subtitle}
                            </div>
                          )
                        )}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>{r.date || "—"}</span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>{r.source}</span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                        <a
                          href={r.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: "4px 10px", border: "none", borderRadius: "4px",
                            background: "#1a237e", color: "white", fontSize: "11px", fontWeight: 600,
                            textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px",
                          }}
                        >
                          <ExternalLink style={{ width: "11px", height: "11px" }} />
                          {r.type === "municipal" ? "PDF" : "Abrir"}
                        </a>
                        {r.extraLink && (
                          <a
                            href={r.extraLink}
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

          {munTotalPages > 1 && (
            <div style={{
              display: "flex", justifyContent: "center", alignItems: "center",
              gap: "8px", padding: "14px", borderTop: "1px solid #e2e5ec",
            }}>
              <span style={{ fontSize: "11px", color: "#94a3b8", marginRight: "8px" }}>Resultados municipais:</span>
              <button
                onClick={() => setMunOffset(Math.max(0, munOffset - munPageSize))}
                disabled={munOffset <= 0}
                style={{ ...paginationBtnStyle, opacity: munOffset <= 0 ? 0.4 : 1, cursor: munOffset <= 0 ? "not-allowed" : "pointer" }}
              >
                Anterior
              </button>
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                Página {munCurrentPage + 1} de {munTotalPages > 100 ? "100+" : munTotalPages}
              </span>
              <button
                onClick={() => setMunOffset(munOffset + munPageSize)}
                disabled={munCurrentPage >= munTotalPages - 1 || munCurrentPage >= 99}
                style={{ ...paginationBtnStyle, opacity: munCurrentPage >= munTotalPages - 1 ? 0.4 : 1, cursor: munCurrentPage >= munTotalPages - 1 ? "not-allowed" : "pointer" }}
              >
                Próxima
              </button>
            </div>
          )}
        </div>
      )}

      {!submittedTerm && (
        <>
          <div style={{ textAlign: "center", padding: "32px 48px", color: "#94a3b8" }}>
            <Newspaper className="w-10 h-10 mx-auto mb-3" style={{ opacity: 0.3 }} />
            <p style={{ fontSize: "14px" }}>Pesquise nos diários oficiais (federal e municipais)</p>
            <p style={{ fontSize: "12px", marginTop: "4px", opacity: 0.7 }}>
              A busca consulta simultaneamente o DOU e mais de 350 diários municipais
            </p>
          </div>

          <div style={{ background: "white", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #e2e5ec", marginTop: "8px" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #e2e5ec", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
                <Globe style={{ width: "16px", height: "16px", color: "#6b21a8" }} />
                Portais Estaduais (DOE)
              </h3>
              <span style={{ fontSize: "12px", color: "#6b21a8", background: "#f3e8ff", padding: "3px 10px", borderRadius: "12px", fontWeight: 600 }}>
                {doeLinks.length} estados
              </span>
            </div>
            <div style={{ padding: "16px 20px" }}>
              <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "12px" }}>
                Os diários estaduais possuem portais próprios. Clique em um estado para acessar diretamente:
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {doeLinks.map(doe => (
                  <a
                    key={doe.sigla}
                    href={doe.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "4px",
                      padding: "6px 12px", borderRadius: "6px",
                      border: "1px solid #e2e5ec", background: "#fafbfc",
                      color: "#3949ab", fontSize: "12px", fontWeight: 600,
                      textDecoration: "none",
                      transition: "all 0.15s",
                    }}
                  >
                    <Globe style={{ width: "11px", height: "11px" }} />
                    {doe.sigla}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </>
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
  const [activeCategory, setActiveCategory] = useState<CategoryId>("cat-normas");

  const renderContent = () => {
    if (activeCategory === "cat-normas") {
      return <NormasContent />;
    }
    if (activeCategory === "cat-dou") {
      return <DiarioOficialContent />;
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
              Normas e publicações dos diários oficiais (federal, estaduais e municipais)
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
              onClick={() => setActiveCategory(cat.id)}
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

        <div style={{ marginBottom: "20px" }} />

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
          As abas "Normas" e "Diário Oficial" consultam dados diretamente dos portais oficiais do governo.
          Para dúvidas específicas sobre a aplicação dessas normas, consulte o{" "}
          <a href="/chat" style={{ color: "#1565c0", fontWeight: 600 }}>Caderno da Diretora</a>.
        </div>
      </main>

      <Footer />
    </div>
  );
}
