import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import {
  ExternalLink, Scale, FileText, Search, Landmark,
  Loader2, AlertCircle, Newspaper, BookMarked,
  Info, MapPin, Globe
} from "lucide-react";
import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMecNormasAll, useMecNormasTipos } from "@/hooks/use-mecnormas";
import { useDOUSearch, useMunicipalGazetteSearch, useStateGazetteSearch } from "@/hooks/use-dou";

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
  "Planejamento": { bg: "#e8f0e0", color: "#6d4c41" },
  "Gestão": { bg: "#e8f0e0", color: "#6d4c41" },
};

const doeLinks: { estado: string; sigla: string; url: string; searchUrl?: (q: string) => string }[] = [
  { estado: "Acre", sigla: "AC", url: "https://www.diario.ac.gov.br/", searchUrl: (q) => `https://www.diario.ac.gov.br/?s=${encodeURIComponent(q)}` },
  { estado: "Alagoas", sigla: "AL", url: "https://www.imprensaoficialal.com.br/" },
  { estado: "Amapá", sigla: "AP", url: "https://doe.ap.gov.br/" },
  { estado: "Amazonas", sigla: "AM", url: "https://diario.imprensaoficial.am.gov.br/" },
  { estado: "Bahia", sigla: "BA", url: "https://dool.egba.ba.gov.br/" },
  { estado: "Ceará", sigla: "CE", url: "https://pesquisa.doe.seplag.ce.gov.br/doepesquisa/" },
  { estado: "Distrito Federal", sigla: "DF", url: "https://www.dodf.df.gov.br/", searchUrl: (q) => `https://www.dodf.df.gov.br/index/pesquisar/q/${encodeURIComponent(q)}` },
  { estado: "Espírito Santo", sigla: "ES", url: "https://ioes.dio.es.gov.br/", searchUrl: (q) => `https://ioes.dio.es.gov.br/portal/visualizacoes/diario_oficial?txtPesquisa=${encodeURIComponent(q)}` },
  { estado: "Goiás", sigla: "GO", url: "https://diariooficial.abc.go.gov.br/" },
  { estado: "Maranhão", sigla: "MA", url: "https://www.diariooficial.ma.gov.br/" },
  { estado: "Mato Grosso", sigla: "MT", url: "https://www.iomat.mt.gov.br/" },
  { estado: "Mato Grosso do Sul", sigla: "MS", url: "https://www.do.ms.gov.br/" },
  { estado: "Minas Gerais", sigla: "MG", url: "https://www.jornalminasgerais.mg.gov.br/", searchUrl: (q) => `https://www.jornalminasgerais.mg.gov.br/pesquisa/pesquisar?texto=${encodeURIComponent(q)}` },
  { estado: "Pará", sigla: "PA", url: "https://www.ioepa.com.br/" },
  { estado: "Paraíba", sigla: "PB", url: "https://auniao.pb.gov.br/doe/" },
  { estado: "Paraná", sigla: "PR", url: "https://www.imprensaoficial.pr.gov.br/" },
  { estado: "Pernambuco", sigla: "PE", url: "https://www.cepe.com.br/diario-oficial" },
  { estado: "Piauí", sigla: "PI", url: "https://www.diariooficial.pi.gov.br/" },
  { estado: "Rio de Janeiro", sigla: "RJ", url: "https://www.ioerj.com.br/" },
  { estado: "Rio Grande do Norte", sigla: "RN", url: "https://www.diariooficial.rn.gov.br/" },
  { estado: "Rio Grande do Sul", sigla: "RS", url: "https://www.diariooficial.rs.gov.br/" },
  { estado: "Rondônia", sigla: "RO", url: "https://diof.ro.gov.br/" },
  { estado: "Roraima", sigla: "RR", url: "https://www.imprensaoficial.rr.gov.br/" },
  { estado: "Santa Catarina", sigla: "SC", url: "https://www.doe.sea.sc.gov.br/" },
  { estado: "São Paulo", sigla: "SP", url: "https://www.doe.sp.gov.br/", searchUrl: (q) => `https://www.doe.sp.gov.br/executivo/pesquisa?q=${encodeURIComponent(q)}` },
  { estado: "Sergipe", sigla: "SE", url: "https://www.diarioficial.se.gov.br/" },
  { estado: "Tocantins", sigla: "TO", url: "https://diariooficial.to.gov.br/" },
];

type CategoryId = "cat-normas" | "cat-dou";

function HandDrawnIcon({ children, className = "h-7 w-7" }: { children: React.ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`${className} overflow-visible`} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <g className="icon-sketch text-[#4f5b45]">{children}</g>
    </svg>
  );
}

const legislacaoCategorias = [
  {
    icon: <HandDrawnIcon><circle cx="12" cy="12" r="8.2" strokeDasharray="58" strokeDashoffset="58" style={{ animationDelay: "0.02s" }} /><path d="M8 12.1c1.3.1 2.7.1 4 .1 1.5 0 2.8 0 4-.1" strokeDasharray="9" strokeDashoffset="9" style={{ animationDelay: "0.14s" }} /><path d="M12 8.2v7.6" strokeDasharray="8" strokeDashoffset="8" style={{ animationDelay: "0.24s" }} /></HandDrawnIcon>,
    title: "Recursos e financiamento", count: "PDDE, FUNDEB, repasses", note: "PDDE, FUNDEB, repasses e uso do recurso",
    color: "from-[#f4e6a6] to-[#fff7d6]", tape: "rotate-[-2deg]",
    stickerBg: "#e6a817", stickerLabel: "R$", stickerSub: "FNDE",
  },
  {
    icon: <HandDrawnIcon><path d="M6.2 3.6h11.4v16l-1.8-.9-1.8.9-2-1-2 1-1.8-.9-1.8.9z" strokeDasharray="56" strokeDashoffset="56" style={{ animationDelay: "0.04s" }} /><path d="M9 8.2h6.1" strokeDasharray="7" strokeDashoffset="7" style={{ animationDelay: "0.18s" }} /><path d="M9 12.1h5.4" strokeDasharray="6" strokeDashoffset="6" style={{ animationDelay: "0.26s" }} /></HandDrawnIcon>,
    title: "Prestação de contas", count: "Transparência e documentação", note: "transparência, documentação e cuidados",
    color: "from-[#dcead7] to-[#f3faf0]", tape: "rotate-[1deg]",
    stickerBg: "#3d9e5f", stickerLabel: "PC", stickerSub: "SIGPC",
  },
  {
    icon: <HandDrawnIcon><path d="M4.3 6.1h5.6v13.4H4.3z" strokeDasharray="38" strokeDashoffset="38" style={{ animationDelay: "0.03s" }} /><path d="M14.1 6.1h5.6v13.4h-5.6z" strokeDasharray="38" strokeDashoffset="38" style={{ animationDelay: "0.15s" }} /><path d="M10.2 7.2v11" strokeDasharray="11" strokeDashoffset="11" style={{ animationDelay: "0.23s" }} /><path d="M13.8 7.2v11" strokeDasharray="11" strokeDashoffset="11" style={{ animationDelay: "0.29s" }} /></HandDrawnIcon>,
    title: "Currículo e ensino", count: "BNCC e diretrizes pedagógicas", note: "BNCC, diretrizes e organização pedagógica",
    color: "from-[#e8ddf3] to-[#faf5ff]", tape: "rotate-[-1deg]",
    stickerBg: "#8b4dbf", stickerLabel: "✏️", stickerSub: "BNCC",
  },
  {
    icon: <HandDrawnIcon><path d="M3.4 10.2 12 4.4l8.6 5.8" strokeDasharray="21" strokeDashoffset="21" style={{ animationDelay: "0.03s" }} /><path d="M5.1 10.2v9.5h13.8v-9.5" strokeDasharray="33" strokeDashoffset="33" style={{ animationDelay: "0.15s" }} /><path d="M10.1 19.7v-5.8h3.8v5.8" strokeDasharray="16" strokeDashoffset="16" style={{ animationDelay: "0.25s" }} /></HandDrawnIcon>,
    title: "Gestão escolar", count: "Funcionamento e atribuições", note: "funcionamento da escola e atribuições da gestão",
    color: "from-[#f1dfd8] to-[#fff8f4]", tape: "rotate-[2deg]",
    stickerBg: "#d14f3a", stickerLabel: "🏫", stickerSub: "GESTÃO",
  },
  {
    icon: <HandDrawnIcon><path d="M11.8 8.2c1.8-2.7 5.8-2 6 2 .2 4.8-3 7.7-5.9 7.7-3.1 0-6.2-2.9-6-7.7.2-4 4.1-4.7 5.9-2" strokeDasharray="42" strokeDashoffset="42" style={{ animationDelay: "0.04s" }} /><path d="M12.1 6c-.1-1.6 1.2-2.8 2.8-3.1" strokeDasharray="6" strokeDashoffset="6" style={{ animationDelay: "0.18s" }} /></HandDrawnIcon>,
    title: "Alimentação escolar", count: "PNAE e cardápio", note: "PNAE, compra de alimentos e cardápio",
    color: "from-[#ffe1cf] to-[#fff6ef]", tape: "rotate-[-2deg]",
    stickerBg: "#d46b1a", stickerLabel: "🍎", stickerSub: "PNAE",
  },
  {
    icon: <HandDrawnIcon><rect x="4.2" y="5.2" width="15.6" height="10.8" rx="2.2" strokeDasharray="44" strokeDashoffset="44" style={{ animationDelay: "0.03s" }} /><circle cx="8.1" cy="18" r="1.8" strokeDasharray="12" strokeDashoffset="12" style={{ animationDelay: "0.18s" }} /><circle cx="15.9" cy="18" r="1.8" strokeDasharray="12" strokeDashoffset="12" style={{ animationDelay: "0.26s" }} /><path d="M6.7 9.1h10.7" strokeDasharray="11" strokeDashoffset="11" style={{ animationDelay: "0.34s" }} /></HandDrawnIcon>,
    title: "Transporte escolar", count: "PNATE e deslocamento", note: "PNATE e regras para deslocamento dos estudantes",
    color: "from-[#dce7f6] to-[#f7fbff]", tape: "rotate-[1deg]",
    stickerBg: "#2b7ec1", stickerLabel: "🚌", stickerSub: "PNATE",
  },
];

const legislacaoTimeline = [
  { year: "1988", title: "Constituição Federal", note: "educação como direito de todos" },
  { year: "1996", title: "LDB", note: "organiza a educação brasileira" },
  { year: "2001", title: "PNE", note: "metas para a educação" },
  { year: "2007", title: "FUNDEB", note: "financiamento da educação básica" },
  { year: "2014", title: "Novo PNE", note: "planejamento educacional" },
  { year: "2017", title: "BNCC", note: "aprendizagens essenciais" },
  { year: "2020", title: "Novo FUNDEB", note: "financiamento permanente" },
  { year: "2024", title: "PNE 2024–2034", note: "18 metas para a próxima década" },
];

function gerarExplicacaoDiretora(titulo: string, ementa: string, tipo: string): string {
  const tit = (titulo || "").toLowerCase();
  const eme = (ementa || "").toLowerCase();
  const texto = `${tit} ${eme}`;
  const tipoLower = (tipo || "").toLowerCase();

  if (/pdde|dinheiro direto|programa dinheiro/.test(texto))
    return "Trata do dinheiro que chega direto na conta da escola. A diretora precisa acompanhar os repasses, decidir os gastos com o conselho escolar e prestar contas corretamente.";
  if (/pnae|alimentação escolar|merenda/.test(texto) && !/pnate|transporte/.test(texto))
    return "Relacionada à merenda escolar. A diretora deve garantir que os alunos recebam alimentação adequada e que as regras de compra (como os 30% da agricultura familiar) sejam cumpridas.";
  if (/pnate|transporte escolar|transporte do estudante/.test(texto))
    return "Sobre o transporte dos alunos até a escola. Se a escola recebe alunos da zona rural, a diretora pode ajudar a identificar quem precisa desse apoio.";
  if (/pnld|livro didático|material didático/.test(texto))
    return "Trata dos livros e materiais que o governo envia para a escola. A diretora e os professores participam da escolha e precisam cuidar da conservação do acervo.";
  if (/fundeb|fundo de manutenção|financiamento da educação básica/.test(texto))
    return "Sobre o principal fundo que financia a educação. O dinheiro é distribuído conforme o número de alunos — quanto mais alunos matriculados, mais recursos a escola pode receber.";
  if (/prestação de contas|prestar contas|comprovação/.test(texto))
    return "Define como a escola deve comprovar o uso do dinheiro público. A diretora precisa guardar notas fiscais, recibos e documentos para mostrar que tudo foi gasto corretamente.";
  if (/conselho escolar|colegiado|gestão democrática/.test(texto))
    return "Sobre a participação da comunidade nas decisões da escola. A diretora trabalha junto com o conselho escolar (pais, professores, alunos) para decidir como usar os recursos.";
  if (/formação continuada|capacitação|formação de professores|formação docente/.test(texto))
    return "Trata da formação e capacitação dos profissionais da educação. A diretora pode usar essa norma para justificar a participação da equipe em cursos e treinamentos.";
  if (/censo escolar|censo da educação/.test(texto))
    return "Relacionada ao Censo Escolar, que conta quantos alunos, professores e escolas existem no país. A diretora precisa preencher os dados da escola corretamente — eles definem quanto dinheiro a escola vai receber.";
  if (/educação especial|inclusão|acessibilidade|deficiência|atendimento educacional especializado|aee/.test(texto))
    return "Sobre inclusão de alunos com deficiência ou necessidades especiais. A diretora deve garantir que a escola tenha condições de acolher todos os alunos, com adaptações necessárias.";
  if (/educação integral|tempo integral|escola integral|jornada ampliada/.test(texto))
    return "Trata da escola em tempo integral. Se a escola funciona nesse modelo, a diretora precisa organizar as atividades do dia inteiro — aulas, refeições, esporte, cultura.";
  if (/educação infantil|creche|pré-escola/.test(texto))
    return "Norma sobre educação infantil (creche e pré-escola). Define regras de funcionamento para crianças de 0 a 5 anos — importante para diretoras que atendem essa faixa etária.";
  if (/ensino fundamental|anos iniciais|anos finais/.test(texto))
    return "Sobre o ensino fundamental (1º ao 9º ano). Define como essa etapa deve funcionar — currículo, carga horária, avaliação dos alunos.";
  if (/ensino médio|reforma do ensino médio|novo ensino médio/.test(texto))
    return "Trata do ensino médio e suas regras. Importante para diretoras de escolas que oferecem essa etapa, especialmente com as mudanças do Novo Ensino Médio.";
  if (/bncc|base nacional comum|curricular/.test(texto))
    return "Relacionada ao currículo — o que os alunos devem aprender em cada ano. A diretora usa isso para orientar o projeto pedagógico da escola.";
  if (/enem|saeb|prova brasil|ideb|provinha/.test(texto))
    return "Sobre avaliações e indicadores educacionais. Os resultados ajudam a diretora a identificar onde a escola precisa melhorar e planejar ações pedagógicas.";
  if (/infraestrutura|obra|construção|reforma|ampliação/.test(texto))
    return "Trata de obras, reformas ou manutenção das escolas. A diretora pode usar essa norma para solicitar melhorias no prédio e nas instalações.";
  if (/tecnologia|digital|internet|conectividade|computador/.test(texto))
    return "Sobre tecnologia e conectividade nas escolas. A diretora pode buscar recursos para melhorar o acesso à internet e aos equipamentos digitais.";
  if (/professor|magistério|docente|carreira|remuneração|piso salarial/.test(texto))
    return "Relacionada aos professores — carreira, salário ou condições de trabalho. Afeta diretamente a equipe que a diretora coordena na escola.";
  if (/evasão|abandono|frequência|infrequência|busca ativa/.test(texto))
    return "Sobre manter os alunos na escola. A diretora tem papel fundamental em identificar alunos que faltam muito e agir para que não abandonem os estudos.";
  if (/educação do campo|rural|quilombola|indígena|ribeirinha/.test(texto))
    return "Norma sobre educação em contextos específicos (campo, quilombola, indígena). Importante para diretoras de escolas nessas comunidades.";
  if (/eja|educação de jovens e adultos|alfabetização/.test(texto))
    return "Trata da educação de jovens e adultos que não estudaram na idade certa. Relevante para escolas que oferecem turmas de EJA.";
  if (/licitação|compra|aquisição|contratação|pregão/.test(texto))
    return "Sobre regras de compras e contratações com dinheiro público. A diretora precisa seguir essas regras ao adquirir materiais ou contratar serviços para a escola.";
  if (/convênio|termo de compromisso|pacto|adesão/.test(texto))
    return "Trata de acordos entre órgãos públicos. Pode envolver repasses de recursos ou compromissos que afetam o funcionamento da escola.";
  if (/bolsa|auxílio|benefício|transferência de renda|bolsa família/.test(texto))
    return "Sobre benefícios e programas sociais ligados à educação. A escola pode precisar confirmar a frequência dos alunos beneficiários.";
  if (/fnde/.test(texto))
    return "Norma do FNDE que regulamenta programas educacionais. Define regras que a diretora deve seguir para receber e usar os recursos federais na escola.";

  if (/cebas|certificação|entidade beneficente|filantr/.test(texto))
    return "Sobre certificação de entidades beneficentes na educação. Pode impactar parcerias da escola com organizações sociais da comunidade.";
  if (/educação profissional|ensino técnico|tecnológica|aprendizagem profissional/.test(texto))
    return "Norma sobre educação profissional e técnica. Relevante para escolas que oferecem cursos técnicos ou encaminham alunos para formação profissional.";
  if (/educação a distância|ead|ensino remoto|aulas remotas/.test(texto))
    return "Sobre educação a distância ou ensino remoto. A diretora pode precisar organizar recursos tecnológicos e acompanhar alunos nessa modalidade.";
  if (/universidade|ensino superior|graduação|pós-graduação|ifes|instituto federal/.test(texto))
    return "Norma voltada ao ensino superior ou institutos federais. Pode ter impacto indireto na escola básica quando envolve formação de professores ou parcerias.";
  if (/orçamento|crédito|dotação|despesa|recurso|financeiro/.test(texto))
    return "Trata de questões orçamentárias e financeiras na educação. Pode afetar os recursos que chegam à escola ou a forma como devem ser geridos.";
  if (/credenciamento|autorização|reconhecimento|recredenciamento/.test(texto))
    return "Sobre credenciamento ou autorização de instituições de ensino. A diretora pode acompanhar essa norma se sua escola passa por processos de regularização.";
  if (/comissão|comitê|grupo de trabalho|designar/.test(texto))
    return "Cria ou altera comissão/grupo de trabalho no MEC. Pode resultar em novas orientações ou programas que cheguem à escola no futuro.";
  if (/vestibular|seleção|processo seletivo|sisu|prouni|fies/.test(texto))
    return "Sobre acesso ao ensino superior (vestibular, SISU, ProUni, FIES). A diretora pode orientar alunos do ensino médio sobre essas oportunidades.";
  if (/direitos humanos|diversidade|gênero|étnico|racial|afro/.test(texto))
    return "Norma sobre diversidade e direitos humanos na educação. A diretora pode usar como base para ações de respeito e inclusão na escola.";
  if (/meio ambiente|ambiental|sustentabilidade|ecológic/.test(texto))
    return "Trata de educação ambiental e sustentabilidade. A diretora pode integrar esses temas no projeto pedagógico e nas práticas da escola.";
  if (/saúde|vacinação|pandemia|covid|sanitár/.test(texto))
    return "Norma sobre saúde na escola ou protocolos sanitários. A diretora deve garantir que a escola siga as orientações de saúde e bem-estar dos alunos.";
  if (/segurança|violência|proteção|bullying|conflito/.test(texto))
    return "Sobre segurança escolar e proteção dos alunos. A diretora tem papel importante na prevenção de violência e na promoção de um ambiente seguro.";
  if (/esporte|desporto|jogos escolares|olimpíada/.test(texto))
    return "Norma sobre esporte e competições escolares. A diretora pode apoiar a participação dos alunos em atividades esportivas e olimpíadas.";
  if (/cultura|arte|música|patrimônio|cultural/.test(texto))
    return "Sobre cultura e arte na educação. A diretora pode promover atividades culturais e artísticas como parte do currículo escolar.";
  if (/biblioteca|leitura|acervo|literário/.test(texto))
    return "Norma sobre bibliotecas, leitura e acervos escolares. A diretora deve cuidar para que os alunos tenham acesso a livros e incentivo à leitura.";
  if (/estágio|residência pedagógica|pibid|prática/.test(texto))
    return "Trata de estágio ou programas de formação prática. A escola pode receber estagiários ou participar de programas como o PIBID.";
  if (/servidor|funcionário|pessoal|terceirizad/.test(texto))
    return "Sobre servidores e funcionários da educação. Pode impactar a equipe administrativa e de apoio que trabalha na escola com a diretora.";

  const resumoEmenta = extrairResumoSimples(eme, tit);

  if (tipoLower.includes("portaria interministerial"))
    return `Portaria conjunta entre ministérios${resumoEmenta}. Pode envolver ações coordenadas que impactam a escola.`;
  if (tipoLower.includes("portaria"))
    return `Portaria do MEC${resumoEmenta}. A diretora deve conferir se essa determinação afeta o dia a dia da sua escola.`;
  if (tipoLower.includes("resolução"))
    return `Resolução com regras para a educação${resumoEmenta}. A diretora pode verificar se traz orientações que sua escola precisa seguir.`;
  if (tipoLower.includes("lei"))
    return `Lei federal${resumoEmenta}. Estabelece regras que a escola pública deve cumprir.`;
  if (tipoLower.includes("decreto"))
    return `Decreto do governo${resumoEmenta}. Pode trazer novas regras ou ajustes em programas educacionais.`;
  if (tipoLower.includes("edital"))
    return `Edital com oportunidade${resumoEmenta}. A diretora pode avaliar se a escola pode participar ou se beneficiar.`;
  if (tipoLower.includes("parecer"))
    return `Parecer com orientação oficial${resumoEmenta}. Pode ajudar a diretora a entender como agir em situações específicas.`;
  if (tipoLower.includes("nota técnica"))
    return `Nota técnica com esclarecimentos${resumoEmenta}. Útil para a diretora tirar dúvidas sobre procedimentos.`;

  return `Norma do MEC${resumoEmenta}. A diretora deve verificar se há impacto direto na gestão da sua escola.`;
}

function extrairResumoSimples(ementa: string, titulo: string): string {
  if (!ementa && !titulo) return "";

  const t = ementa || titulo;

  const temas: { regex: RegExp; desc: string }[] = [
    { regex: /dispon.*sobre (.{10,60}?)(,|\.|;|$)/i, desc: "" },
    { regex: /institui (.{10,60}?)(,|\.|;|$)/i, desc: "" },
    { regex: /regulamenta (.{10,60}?)(,|\.|;|$)/i, desc: "" },
    { regex: /estabelece (.{10,60}?)(,|\.|;|$)/i, desc: "" },
    { regex: /altera (.{10,60}?)(,|\.|;|$)/i, desc: "" },
    { regex: /aprova (.{10,60}?)(,|\.|;|$)/i, desc: "" },
    { regex: /define (.{10,60}?)(,|\.|;|$)/i, desc: "" },
    { regex: /autoriza (.{10,60}?)(,|\.|;|$)/i, desc: "" },
    { regex: /cria (.{10,60}?)(,|\.|;|$)/i, desc: "" },
    { regex: /prorroga (.{10,60}?)(,|\.|;|$)/i, desc: "" },
    { regex: /revoga (.{10,60}?)(,|\.|;|$)/i, desc: "" },
    { regex: /designa (.{10,60}?)(,|\.|;|$)/i, desc: "" },
    { regex: /nomeia (.{10,60}?)(,|\.|;|$)/i, desc: "" },
    { regex: /homologa (.{10,60}?)(,|\.|;|$)/i, desc: "" },
  ];

  for (const tema of temas) {
    const match = t.match(tema.regex);
    if (match && match[1]) {
      let trecho = match[1].trim();
      if (trecho.length > 55) trecho = trecho.slice(0, 52) + "...";
      trecho = trecho.charAt(0).toLowerCase() + trecho.slice(1);
      const verbo = (t.match(/(dispõe|institui|regulamenta|estabelece|altera|aprova|define|autoriza|cria|prorroga|revoga|designa|nomeia|homologa)/i) || ["trata"])[0].toLowerCase();
      return ` que ${verbo} ${trecho}`;
    }
  }

  const palavras = t.split(/\s+/).slice(0, 8).join(" ");
  if (palavras.length > 10) {
    let resumo = palavras.charAt(0).toLowerCase() + palavras.slice(1);
    if (!resumo.endsWith("...")) resumo += "...";
    return ` sobre ${resumo}`;
  }

  return "";
}

const TIPO_COLORS: Record<string, { bg: string; text: string }> = {
  "Portaria":            { bg: "#f4e6a6", text: "#7a5e10" },
  "Resolução":           { bg: "#dcead7", text: "#3d6e4a" },
  "Lei":                 { bg: "#dce7f6", text: "#3b5a82" },
  "Decreto":             { bg: "#f1dfd8", text: "#7a3d2e" },
  "Instrução Normativa": { bg: "#e8ddf3", text: "#5a3d82" },
  "Nota Técnica":        { bg: "#fff3cd", text: "#8a6a14" },
};

function tipoStyle(nome: string) {
  return TIPO_COLORS[nome] || { bg: "#f3eedf", text: "#6b6a58" };
}

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
    <div className="space-y-6">

      {/* Filtros de tipo — chips clicáveis */}
      {!tiposLoading && tiposData?.tipos && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setSelectedTipo(""); setPage(0); }}
            className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.12em] transition ${!selectedTipo ? "bg-[#5d7452] text-white shadow-md" : "border border-[#d9ceb8] bg-white text-[#60705d] hover:bg-[#f0ebe0]"}`}
          >
            Todos · {tiposData.totalGeral.toLocaleString("pt-BR")}
          </button>
          {tiposData.tipos.slice(0, 7).map(tipo => {
            const s = tipoStyle(tipo.nome);
            const isActive = selectedTipo === String(tipo.id);
            return (
              <button
                key={tipo.id}
                onClick={() => { setSelectedTipo(isActive ? "" : String(tipo.id)); setPage(0); }}
                className="rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.12em] transition border hover:shadow-sm"
                style={{
                  background: isActive ? s.bg : "white",
                  color: isActive ? s.text : "#60705d",
                  borderColor: isActive ? s.bg : "#d9ceb8",
                  boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                }}
              >
                {tipo.nome} · {tipo.total.toLocaleString("pt-BR")}
              </button>
            );
          })}
        </div>
      )}

      {/* Barra de busca */}
      <form onSubmit={handleSearch} className="grid gap-3 md:grid-cols-[1fr_auto]">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Pesquisar lei, portaria, resolução, PDDE, alimentação..."
          className="w-full rounded-2xl border border-[#e3d8c8] bg-white px-4 py-3 text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-[#8fa37f]/40"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!searchTerm.trim()}
            className="rounded-2xl px-5 py-3 text-sm font-black text-white shadow-sm transition disabled:opacity-50"
            style={{ background: "#5d7452" }}
          >
            <Search className="w-4 h-4 inline mr-1.5" />
            Buscar
          </button>
          {(selectedTipo || submittedSearch) && (
            <button
              type="button"
              onClick={() => { setSelectedTipo(""); handleClearSearch(); }}
              className="rounded-2xl border border-[#d9ceb8] bg-white px-4 py-3 text-xs font-semibold text-[#6b7066] hover:bg-[#f0ebe0] transition"
            >
              Limpar
            </button>
          )}
        </div>
      </form>

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center gap-3 py-12 text-[#8a9a84]">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#5d7452" }} />
          <span className="text-sm">Carregando normas do MEC...</span>
        </div>
      )}

      {/* Erro */}
      {error && (
        <div className="rounded-2xl border border-[#f5e6b8] bg-[#fffbeb] px-5 py-4 text-sm text-[#92400e]">
          <AlertCircle className="w-4 h-4 inline mr-2" />
          Não foi possível consultar o MEC Normas. Tente novamente em alguns instantes.
        </div>
      )}

      {/* Vazio */}
      {!isLoading && !error && normas.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-12 text-[#8a9a84]">
          <BookMarked className="w-10 h-10 opacity-30" />
          <p className="text-sm">Nenhuma norma encontrada</p>
        </div>
      )}

      {/* Leis Fundamentais (estado padrão, sem busca) */}
      {showFundamentais && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1.5 rounded-full bg-[#d1a43c]" />
            <h3 className="text-lg font-black text-[#43513d]">
              Leis Fundamentais da Educação
              <span className="ml-2 rounded-full bg-[#fef3c7] px-2 py-0.5 text-xs font-bold text-[#92400e]">{leisFundamentais.length} normas</span>
            </h3>
          </div>
          {leisFundamentais.map(lei => {
            const catColor = categoriaColors[lei.categoria] || { bg: "#e8f0e0", color: "#5a6e4e" };
            return (
              <div key={lei.numero} className="grid gap-4 rounded-[24px] border border-[#e6ddcf] bg-white p-5 md:grid-cols-[2fr_1fr_2fr_auto] md:items-start">
                <div>
                  <h4 className="text-base font-black text-[#46543f] leading-snug">{lei.titulo}</h4>
                  <div className="mt-1 text-xs text-[#94a3b8] font-mono">{lei.numero}</div>
                  <p className="mt-2 text-sm leading-6 text-[#60685a]">{lei.descricao}</p>
                </div>
                <div className="flex flex-wrap gap-2 items-start">
                  <span className="inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em]"
                    style={{ background: catColor.bg, color: catColor.color }}>
                    {lei.categoria}
                  </span>
                </div>
                <div className="rounded-[18px] border border-[#e8ddd0] bg-[#fffdf8] p-3">
                  <div className="text-[10px] font-black uppercase tracking-[0.14em] text-[#9b7a2c] mb-1">Para a diretora</div>
                  <p className="text-xs leading-5 text-[#5d6558]">{lei.paraADiretora}</p>
                </div>
                <div>
                  <a href={lei.link} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#d4c7b3] bg-[#5d7452] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#526847] whitespace-nowrap">
                    <ExternalLink className="w-3 h-3" /> Abrir lei
                  </a>
                </div>
              </div>
            );
          })}

          {/* Separador para demais normas */}
          <div className="flex items-center gap-3 pt-2">
            <div className="h-8 w-1.5 rounded-full bg-[#cf7e3f]" />
            <h3 className="text-lg font-black text-[#43513d]">
              Demais Normas
              <span className="ml-2 rounded-full bg-[#f3eedf] px-2 py-0.5 text-xs font-semibold text-[#6b6a58]">{total.toLocaleString("pt-BR")} no acervo</span>
            </h3>
          </div>
        </div>
      )}

      {/* Título quando filtrando / buscando */}
      {!showFundamentais && normas.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="h-8 w-1.5 rounded-full bg-[#8fa37f]" />
          <h3 className="text-lg font-black text-[#43513d]">
            {submittedSearch ? `Resultados para "${submittedSearch}"` : "Normas"}
            <span className="ml-2 rounded-full bg-[#f3eedf] px-2 py-0.5 text-xs font-semibold text-[#6b6a58]">{total.toLocaleString("pt-BR")}</span>
          </h3>
        </div>
      )}

      {/* Lista de normas — novo card design */}
      {normas.length > 0 && (
        <div className="space-y-3">
          {normas.map((norma: any) => {
            const title = norma.titulo || norma.tituloAto || norma.identificacao || `Ato ${norma.id}`;
            const ementa = norma.ementa || norma.resumo || "";
            const date = norma.dataDePublicacaoString || norma.dataPublicacao || norma.dataPublicacaoAto || norma.dataDePublicacao || "";
            const tipo = norma.tipo?.nome || "";
            const link = norma.disponivelEm || norma.disponivel_em || "";
            const isVigente = norma.vigente;
            const correlacoes = norma.correlacoes || [];
            const encerraVigencia = correlacoes.some((c: any) => c.encerraVigencia);
            const s = tipoStyle(tipo);

            const vigenciaBadge = isVigente === true && !encerraVigencia
              ? { label: "Vigente", bg: "#dcead7", text: "#4e7a4d" }
              : isVigente === true && encerraVigencia
              ? { label: "Com alteração", bg: "#f5e6b8", text: "#8a6a14" }
              : isVigente === false
              ? { label: "Revogada", bg: "#f3d2cf", text: "#9b4b45" }
              : null;

            return (
              <div key={norma.id} className="grid gap-4 rounded-[24px] border border-[#e6ddcf] bg-white p-4 md:grid-cols-[2fr_1fr_1fr_auto] md:items-center transition hover:-translate-y-0.5 hover:shadow-md">
                <div>
                  <h4 className="text-sm font-black text-[#46543f] leading-snug">{title}</h4>
                  {ementa && <p className="mt-1.5 text-xs leading-5 text-[#60685a]">{ementa.length > 160 ? ementa.slice(0, 160) + "…" : ementa}</p>}
                  {date && <div className="mt-1 text-[10px] text-[#94a3b8]">{norma.unidade?.sigla ? `${norma.unidade.sigla} · ` : ""}{date}</div>}
                </div>
                <div className="flex flex-wrap gap-2 items-start">
                  {tipo && (
                    <span className="inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em]"
                      style={{ background: s.bg, color: s.text }}>
                      {tipo}
                    </span>
                  )}
                </div>
                <div>
                  {vigenciaBadge ? (
                    <span className="inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em]"
                      style={{ background: vigenciaBadge.bg, color: vigenciaBadge.text }}>
                      {vigenciaBadge.label}
                    </span>
                  ) : <span className="text-xs text-[#cbd5e1]">—</span>}
                  {correlacoes.slice(0, 1).map((c: any, ci: number) => (
                    <div key={ci} className="mt-1 text-[10px] text-[#94a3b8] leading-4">{c.textoCorrelacao}</div>
                  ))}
                </div>
                <div>
                  {link ? (
                    <a href={link} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#d4c7b3] bg-[#5d7452] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#526847] whitespace-nowrap">
                      <ExternalLink className="w-3 h-3" /> Abrir
                    </a>
                  ) : (
                    <span className="inline-flex rounded-full border border-[#e6ddcf] bg-[#f9f6ef] px-4 py-2.5 text-[10px] font-semibold text-[#94a3b8]">Sem link</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page <= 0}
            className="rounded-full border border-[#d9ceb8] bg-white px-5 py-2.5 text-sm font-semibold text-[#6b7066] shadow-sm transition disabled:opacity-40 hover:bg-[#f0ebe0]"
          >
            Anterior
          </button>
          <span className="text-sm font-semibold text-[#8a9a84]">Página {page + 1} de {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="rounded-full border border-[#d9ceb8] bg-white px-5 py-2.5 text-sm font-semibold text-[#6b7066] shadow-sm transition disabled:opacity-40 hover:bg-[#f0ebe0]"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}

function GazetteResultsTable({ gazettes }: { gazettes: any[]; bgColor?: string }) {
  return (
    <div className="space-y-3">
      {gazettes.map((g: any, index: number) => (
        <div key={`gz-${index}`}
          className="grid gap-3 rounded-[22px] border border-[#e6ddcf] bg-white p-4 md:grid-cols-[2fr_1fr_auto] md:items-start transition hover:-translate-y-0.5 hover:shadow-md">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-black text-sm text-[#46543f]">{g.territory_name || g.title || "—"}</span>
              {g.state_code && (
                <span className="inline-flex rounded-full bg-[#eef3e8] px-2 py-0.5 text-[10px] font-bold text-[#4e7a4d]">{g.state_code}</span>
              )}
            </div>
            {g.excerpts && g.excerpts.length > 0 ? (
              <div className="mt-1.5 text-xs leading-5 text-[#60685a]"
                dangerouslySetInnerHTML={{
                  __html: g.excerpts[0].length > 200 ? g.excerpts[0].slice(0, 200) + "…" : g.excerpts[0]
                }}
              />
            ) : g.abstract ? (
              <p className="mt-1.5 text-xs leading-5 text-[#60685a]">
                {g.abstract.length > 200 ? g.abstract.slice(0, 200) + "…" : g.abstract}
              </p>
            ) : null}
          </div>
          <div className="text-[10px] text-[#94a3b8] md:pt-0.5">
            {g.date ? new Date(g.date + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={g.url || g.href} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#5d7452] px-3 py-2 text-[10px] font-bold text-white shadow-sm transition hover:opacity-90">
              <ExternalLink className="w-3 h-3" />PDF
            </a>
            {g.txt_url && (
              <a href={g.txt_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#d8dcd3] bg-white px-3 py-2 text-[10px] font-semibold text-[#5e6659] transition hover:bg-[#f8faf7]">
                <FileText className="w-3 h-3" />TXT
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

type DiarioSubTab = "dou" | "doe" | "municipal";

function DiarioOficialContent() {
  const [activeSubTab, setActiveSubTab] = useState<DiarioSubTab>("dou");

  const [douSearch, setDouSearch] = useState("");
  const [douSubmitted, setDouSubmitted] = useState("");

  const [doeSearch, setDoeSearch] = useState("");
  const [doeSubmitted, setDoeSubmitted] = useState("");
  const [doeState, setDoeState] = useState("");
  const [doeOffset, setDoeOffset] = useState(0);
  const doePageSize = 10;

  const [munSearch, setMunSearch] = useState("");
  const [munSubmitted, setMunSubmitted] = useState("");
  const [munOffset, setMunOffset] = useState(0);
  const munPageSize = 10;

  const douQuery = useDOUSearch(
    { q: douSubmitted, exact: false, limit: 20 },
    !!douSubmitted
  );

  const doeQuery = useStateGazetteSearch(
    { q: doeSubmitted, state: doeState, size: doePageSize, offset: doeOffset },
    !!doeSubmitted && !!doeState
  );

  const munQuery = useMunicipalGazetteSearch(
    { q: munSubmitted, size: munPageSize, offset: munOffset },
    !!munSubmitted
  );

  const quickSearches = [
    "PDDE",
    "PNAE alimentação escolar",
    "PNATE transporte",
    "FUNDEB",
    "prestação de contas",
  ];

  const subTabs: { id: DiarioSubTab; label: string; icon: React.ReactNode; color: string }[] = [
    { id: "dou", label: "DOU Federal", icon: <Landmark style={{ width: "14px", height: "14px" }} />, color: "#6d4c41" },
    { id: "doe", label: "DOE Estados", icon: <Globe style={{ width: "14px", height: "14px" }} />, color: "#6d4c41" },
    { id: "municipal", label: "Diários Municipais", icon: <MapPin style={{ width: "14px", height: "14px" }} />, color: "#166534" },
  ];

  const estados = [
    { sigla: "AC", nome: "Acre" }, { sigla: "AL", nome: "Alagoas" }, { sigla: "AM", nome: "Amazonas" },
    { sigla: "AP", nome: "Amapá" }, { sigla: "BA", nome: "Bahia" }, { sigla: "CE", nome: "Ceará" },
    { sigla: "DF", nome: "Distrito Federal" }, { sigla: "ES", nome: "Espírito Santo" }, { sigla: "GO", nome: "Goiás" },
    { sigla: "MA", nome: "Maranhão" }, { sigla: "MG", nome: "Minas Gerais" }, { sigla: "MS", nome: "Mato Grosso do Sul" },
    { sigla: "MT", nome: "Mato Grosso" }, { sigla: "PA", nome: "Pará" }, { sigla: "PB", nome: "Paraíba" },
    { sigla: "PE", nome: "Pernambuco" }, { sigla: "PI", nome: "Piauí" }, { sigla: "PR", nome: "Paraná" },
    { sigla: "RJ", nome: "Rio de Janeiro" }, { sigla: "RN", nome: "Rio Grande do Norte" }, { sigla: "RO", nome: "Rondônia" },
    { sigla: "RR", nome: "Roraima" }, { sigla: "RS", nome: "Rio Grande do Sul" }, { sigla: "SC", nome: "Santa Catarina" },
    { sigla: "SE", nome: "Sergipe" }, { sigla: "SP", nome: "São Paulo" }, { sigla: "TO", nome: "Tocantins" },
  ];

  const douResults = douQuery.data?.results || [];
  const douSearchUrl = douQuery.data?.searchUrl;

  const doeGazettes = doeQuery.data?.gazettes || [];
  const doeTotal = doeQuery.data?.total || 0;
  const doeTotalPages = Math.ceil(doeTotal / doePageSize);
  const doeCurrentPage = Math.floor(doeOffset / doePageSize);

  const munGazettes = munQuery.data?.gazettes || [];
  const munTotal = munQuery.data?.total || 0;
  const munTotalPages = Math.ceil(munTotal / munPageSize);
  const munCurrentPage = Math.floor(munOffset / munPageSize);

  const doePortal = doeState ? doeLinks.find(d => d.sigla === doeState) : null;

  const currentSearch = activeSubTab === "dou" ? douSubmitted : activeSubTab === "doe" ? doeSubmitted : munSubmitted;
  const isLoading = activeSubTab === "dou" ? douQuery.isLoading : activeSubTab === "doe" ? doeQuery.isLoading : munQuery.isLoading;
  const hasError = activeSubTab === "dou" ? !!douQuery.error : activeSubTab === "doe" ? !!doeQuery.error : !!munQuery.error;
  const hasResults =
    activeSubTab === "dou" ? douResults.length > 0 :
    activeSubTab === "doe" ? doeGazettes.length > 0 :
    munGazettes.length > 0;

  return (
    <div className="space-y-6">
      {/* ── 1. Hero ── */}
      <div className="rounded-[28px] border border-[#d8cab4] bg-[#eef3e8] p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="mt-1 shrink-0 text-[#4f5b45]">
            <svg viewBox="0 0 24 24" className="h-8 w-8 overflow-visible" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <g className="icon-sketch">
                <path d="M4.3 4.3h15.4v15.4H4.3z" strokeDasharray="48" strokeDashoffset="48" style={{ animationDelay: "0.03s" }} />
                <path d="M7.1 8.1h9.9" strokeDasharray="10" strokeDashoffset="10" style={{ animationDelay: "0.13s" }} />
                <path d="M7.1 12h6.1" strokeDasharray="7" strokeDashoffset="7" style={{ animationDelay: "0.21s" }} />
                <path d="M7.1 15.9h8.1" strokeDasharray="9" strokeDashoffset="9" style={{ animationDelay: "0.29s" }} />
              </g>
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#43513d]">Diários oficiais</h2>
            <p className="mt-2 text-sm leading-6 text-[#5f6659]">
              Busque publicações do DOU, dos diários estaduais e dos diários municipais. A mesma estética do Chegou a Conta, com cara de painel de clipping e acompanhamento.
            </p>
            <p className="mt-3 text-sm font-semibold text-[#4f6944]">
              Fontes: Imprensa Nacional · Querido Diário (queridodiario.ok.org.br)
            </p>
          </div>
        </div>
      </div>

      {/* ── 2. Sub-tab switcher ── */}
      <div className="rounded-[24px] border border-[#ddd2bc] bg-[#f6f2e9] p-3 shadow-sm">
        <div className="flex flex-wrap gap-3">
          {subTabs.map(tab => (
            <button key={tab.id} type="button" onClick={() => setActiveSubTab(tab.id)}
              className={`rounded-[18px] px-5 py-3 text-sm font-black transition ${
                activeSubTab === tab.id
                  ? "border-2 border-[#9b7a66] bg-[#fffdf8] text-[#7b5d4a] shadow-sm"
                  : "border border-[#ddd2bc] bg-white text-[#64715f]"
              }`}>
              <span className="flex items-center gap-2">{tab.icon}{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── 3. Search panel ── */}
      <div className="rounded-[30px] border border-[#d7cab4] bg-white p-5 shadow-[0_14px_36px_rgba(90,80,50,0.08)]">
        <div className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-[#7c8b75]">
          {activeSubTab === "dou" ? "Buscar no DOU Federal" : activeSubTab === "doe" ? "Buscar nos diários estaduais" : "Buscar nos diários municipais"}
        </div>

        {activeSubTab === "doe" && (
          <div className="mb-3">
            <select value={doeState} onChange={(e) => { setDoeState(e.target.value); setDoeOffset(0); }}
              className="w-full rounded-2xl border border-[#d8dcd3] bg-[#f8faf7] px-4 py-3 text-sm text-[#5e6659] shadow-inner focus:outline-none sm:w-auto">
              <option value="">Selecione o estado (UF)...</option>
              {estados.map(e => <option key={e.sigla} value={e.sigla}>{e.sigla} — {e.nome}</option>)}
            </select>
          </div>
        )}

        <form onSubmit={(e) => {
          e.preventDefault();
          if (activeSubTab === "dou") { setDouSubmitted(douSearch.trim()); }
          else if (activeSubTab === "doe") { if (doeSearch.trim() && doeState) { setDoeSubmitted(doeSearch.trim()); setDoeOffset(0); } }
          else { setMunSubmitted(munSearch.trim()); setMunOffset(0); }
        }} className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <input
            type="text"
            value={activeSubTab === "dou" ? douSearch : activeSubTab === "doe" ? doeSearch : munSearch}
            onChange={(e) => {
              if (activeSubTab === "dou") setDouSearch(e.target.value);
              else if (activeSubTab === "doe") setDoeSearch(e.target.value);
              else setMunSearch(e.target.value);
            }}
            placeholder="Ex.: PDDE, alimentação escolar, prestação de contas..."
            className="w-full rounded-2xl border border-[#d8dcd3] bg-[#f8faf7] px-4 py-3 text-sm shadow-inner focus:outline-none"
          />
          <button type="submit"
            className="rounded-2xl bg-[#8b9ab0] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
            disabled={activeSubTab === "doe" ? (!doeSearch.trim() || !doeState) : activeSubTab === "dou" ? !douSearch.trim() : !munSearch.trim()}>
            <span className="flex items-center gap-2"><Search className="w-4 h-4" />Buscar</span>
          </button>
        </form>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-[#93a08f]">Sugestões:</span>
          {quickSearches.map((term) => (
            <button key={term} type="button"
              onClick={() => {
                if (activeSubTab === "dou") { setDouSearch(term); setDouSubmitted(term); }
                else if (activeSubTab === "doe") { setDoeSearch(term); if (doeState) { setDoeSubmitted(term); setDoeOffset(0); } }
                else { setMunSearch(term); setMunSubmitted(term); setMunOffset(0); }
              }}
              className="rounded-full bg-[#edf1e5] px-3 py-1.5 text-xs font-semibold text-[#6d745e] transition hover:-translate-y-0.5">
              {term}
            </button>
          ))}
        </div>
      </div>

      {/* ── 4. Loading / Error ── */}
      {isLoading && (
        <div className="flex flex-col items-center gap-3 rounded-[24px] border border-[#e6ddcf] bg-white py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#6d4c41]" />
          <p className="text-sm text-[#94a3b8]">
            {activeSubTab === "dou" ? "Consultando o DOU (Imprensa Nacional)..." :
             activeSubTab === "doe" ? `Consultando diários de ${doeState} via Querido Diário...` :
             "Consultando diários municipais via Querido Diário..."}
          </p>
        </div>
      )}

      {hasError && !isLoading && (
        <div className="rounded-[22px] border-l-4 border-[#f59e0b] bg-[#fffbeb] px-5 py-4 text-sm text-[#92400e]">
          <AlertCircle className="mr-2 inline h-4 w-4" />
          {activeSubTab === "dou" ? "DOU temporariamente indisponível. Tente novamente em instantes." :
           activeSubTab === "doe" ? `Erro ao consultar diários de ${doeState}. Tente novamente.` :
           "Diários municipais temporariamente indisponíveis. Tente novamente."}
        </div>
      )}

      {/* ── 5a. Results (when search was done and there are results) ── */}
      {!isLoading && !hasError && currentSearch && hasResults && (
        <div className="rounded-[30px] border border-[#d7cab4] bg-[#f9f6ef] p-5 shadow-[0_14px_36px_rgba(90,80,50,0.08)]">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-[#44513e]">
                Resultados para "{currentSearch}"
                {activeSubTab === "doe" && doeState ? ` em ${doeState}` : ""}
              </h3>
              <p className="mt-0.5 text-xs text-[#8a9a84]">
                {activeSubTab === "dou" ? `${douResults.length} publicação(ões)` :
                 activeSubTab === "doe" ? `${doeTotal.toLocaleString("pt-BR")} resultado(s)` :
                 `${munTotal.toLocaleString("pt-BR")} resultado(s)`}
              </p>
            </div>
            {activeSubTab === "dou" && douSearchUrl && (
              <a href={douSearchUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#d4c7b3] bg-white px-4 py-2 text-xs font-semibold text-[#6d4c41] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <ExternalLink className="w-3 h-3" /> Ver mais no DOU
              </a>
            )}
            {activeSubTab === "doe" && doePortal && (
              <a href={doePortal.url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#d4c7b3] bg-white px-4 py-2 text-xs font-semibold text-[#6d4c41] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <Globe className="w-3 h-3" /> Portal oficial
              </a>
            )}
          </div>

          {activeSubTab === "dou" && (
            <div className="space-y-3">
              {douResults.map((item: any, index: number) => (
                <div key={`dou-${index}`}
                  className="grid gap-3 rounded-[22px] border border-[#e6ddcf] bg-white p-4 md:grid-cols-[2fr_1fr_auto] md:items-start transition hover:-translate-y-0.5 hover:shadow-md">
                  <div>
                    <h4 className="font-black text-sm text-[#46543f] leading-snug">{item.title}</h4>
                    {item.abstract && (
                      <p className="mt-1.5 text-xs leading-5 text-[#60685a]">
                        {item.abstract.length > 200 ? item.abstract.slice(0, 200) + "…" : item.abstract}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    {item.date && <div className="text-[10px] text-[#94a3b8]">{item.date}</div>}
                    {item.hierarchy && <div className="text-[10px] font-semibold text-[#7c8b75]">{item.hierarchy}</div>}
                  </div>
                  <div>
                    <a href={item.href} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#5d7452] px-3 py-2 text-[10px] font-bold text-white shadow-sm transition hover:opacity-90">
                      <ExternalLink className="w-3 h-3" /> Abrir
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeSubTab === "doe" && (
            <>
              <GazetteResultsTable gazettes={doeGazettes} />
              {doeTotalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-3">
                  <button onClick={() => setDoeOffset(Math.max(0, doeOffset - doePageSize))} disabled={doeOffset <= 0}
                    className="rounded-full border border-[#d8dcd3] bg-white px-5 py-2 text-xs font-semibold text-[#5e6659] shadow-sm disabled:opacity-40 transition hover:-translate-y-0.5">
                    Anterior
                  </button>
                  <span className="text-xs text-[#94a3b8]">Página {doeCurrentPage + 1} de {doeTotalPages > 100 ? "100+" : doeTotalPages}</span>
                  <button onClick={() => setDoeOffset(doeOffset + doePageSize)} disabled={doeCurrentPage >= doeTotalPages - 1 || doeCurrentPage >= 99}
                    className="rounded-full border border-[#d8dcd3] bg-white px-5 py-2 text-xs font-semibold text-[#5e6659] shadow-sm disabled:opacity-40 transition hover:-translate-y-0.5">
                    Próxima
                  </button>
                </div>
              )}
            </>
          )}

          {activeSubTab === "municipal" && (
            <>
              <GazetteResultsTable gazettes={munGazettes} />
              {munTotalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-3">
                  <button onClick={() => setMunOffset(Math.max(0, munOffset - munPageSize))} disabled={munOffset <= 0}
                    className="rounded-full border border-[#d8dcd3] bg-white px-5 py-2 text-xs font-semibold text-[#5e6659] shadow-sm disabled:opacity-40 transition hover:-translate-y-0.5">
                    Anterior
                  </button>
                  <span className="text-xs text-[#94a3b8]">Página {munCurrentPage + 1} de {munTotalPages > 100 ? "100+" : munTotalPages}</span>
                  <button onClick={() => setMunOffset(munOffset + munPageSize)} disabled={munCurrentPage >= munTotalPages - 1 || munCurrentPage >= 99}
                    className="rounded-full border border-[#d8dcd3] bg-white px-5 py-2 text-xs font-semibold text-[#5e6659] shadow-sm disabled:opacity-40 transition hover:-translate-y-0.5">
                    Próxima
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── 5b. No results message (searched but nothing found) ── */}
      {!isLoading && !hasError && currentSearch && !hasResults && (
        <div className="rounded-[28px] border border-dashed border-[#ddd2bc] bg-[#f9f6ef] p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#ded8ca] bg-white text-[#9eaa99]">
            <Newspaper className="h-7 w-7 opacity-50" />
          </div>
          <h3 className="text-lg font-black text-[#8c9ab0]">Nenhum resultado encontrado</h3>
          <p className="mt-2 text-sm leading-6 text-[#9da6b2]">
            {activeSubTab === "dou" && douQuery.data?.message ? douQuery.data.message :
             activeSubTab === "doe" ? `Nenhum resultado para "${currentSearch}" em ${doeState}.` :
             `Nenhum resultado para "${currentSearch}" nos diários municipais.`}
          </p>
          {activeSubTab === "dou" && douSearchUrl && (
            <a href={douSearchUrl} target="_blank" rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#6d4c41] px-5 py-3 text-sm font-bold text-white shadow transition hover:opacity-90">
              <Search className="w-4 h-4" /> Buscar no site do DOU
            </a>
          )}
          {activeSubTab === "doe" && doePortal && (
            <a href={doePortal.searchUrl ? doePortal.searchUrl(currentSearch) : doePortal.url} target="_blank" rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#6d4c41] px-5 py-3 text-sm font-bold text-white shadow transition hover:opacity-90">
              <ExternalLink className="w-4 h-4" /> Buscar no portal oficial de {doeState}
            </a>
          )}
        </div>
      )}

      {/* ── 6. Como usar + empty state (when no search yet) ── */}
      {!currentSearch && !isLoading && (
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-[28px] border border-[#d7cab4] bg-[#fffaf2] p-6 shadow-sm">
            <div className="mb-4 inline-flex rotate-[-2deg] rounded-full bg-[#c95c4b] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white">
              monitoramento
            </div>
            <h3 className="text-xl font-black text-[#44513e]">Como usar esta aba</h3>
            <div className="mt-4 space-y-3">
              {[
                "Pesquise por programa, assunto ou palavra-chave.",
                "Veja resultados recentes do diário escolhido.",
                "Abra a publicação original ou leia um resumo curto.",
                "Acompanhe normas novas, alteradas e revogações.",
              ].map((item) => (
                <div key={item} className="rounded-[18px] border border-[#e9dfcf] bg-white p-3 text-sm text-[#5e6659]">
                  ✓ {item}
                </div>
              ))}
            </div>
            {activeSubTab === "doe" && (
              <div className="mt-5 rounded-[22px] border border-[#e6ddcf] bg-[#f9f6ef] p-4">
                <div className="mb-2 text-xs font-black uppercase tracking-[0.15em] text-[#9b7a2c]">Portais oficiais dos estados</div>
                <div className="flex flex-wrap gap-2">
                  {doeLinks.map(doe => (
                    <a key={doe.sigla} href={doe.url} target="_blank" rel="noopener noreferrer" title={doe.estado}
                      className="inline-flex items-center gap-1 rounded-full border border-[#d8dcd3] bg-white px-3 py-1 text-xs font-semibold text-[#6d4c41] transition hover:-translate-y-0.5 hover:shadow-sm">
                      <Globe className="w-2.5 h-2.5" />{doe.sigla}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-[28px] border border-dashed border-[#ddd2bc] bg-[#f9f6ef] p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[#ded8ca] bg-white text-[#9eaa99]">
              <svg viewBox="0 0 24 24" className="h-8 w-8 overflow-visible" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <g className="icon-sketch">
                  <path d="M4.3 4.3h15.4v15.4H4.3z" strokeDasharray="48" strokeDashoffset="48" style={{ animationDelay: "0.04s" }} />
                  <path d="M7.1 8.1h9.9" strokeDasharray="10" strokeDashoffset="10" style={{ animationDelay: "0.13s" }} />
                  <path d="M7.1 12h6.1" strokeDasharray="7" strokeDashoffset="7" style={{ animationDelay: "0.21s" }} />
                  <path d="M7.1 15.9h8.1" strokeDasharray="9" strokeDashoffset="9" style={{ animationDelay: "0.29s" }} />
                </g>
              </svg>
            </div>
            <h3 className="text-xl font-black text-[#8c9ab0]">Busque publicações no Diário Oficial</h3>
            <p className="mt-2 text-sm leading-6 text-[#9da6b2]">
              Aqui aparecem os resultados do DOU, dos diários estaduais ou dos diários municipais, com link para a publicação original e um pequeno resumo contextual.
            </p>
          </div>
        </div>
      )}

      {/* ── 7. Nota de rodapé ── */}
      <div className="rounded-[22px] border-l-4 border-[#e9a42e] bg-[#fbf6e8] px-5 py-4 text-sm leading-6 text-[#99602f] shadow-sm">
        <strong>Nota:</strong> Esta aba reúne publicações dos diários oficiais que podem impactar a gestão escolar. Funciona como complemento do acervo de normas e pode destacar novidades relevantes para a diretora.
      </div>
    </div>
  );
}


const ICON_SKETCH_CSS = `
  .icon-sketch > * {
    vector-effect: non-scaling-stroke;
    will-change: stroke-dashoffset, opacity;
    animation: sketch-draw 0.88s ease-out forwards;
    filter: drop-shadow(0.2px 0.4px 0 rgba(79,91,69,0.14));
  }
  .icon-sketch > *:nth-child(odd) { transform: rotate(-1.1deg); transform-origin: center; }
  .icon-sketch > *:nth-child(even) { transform: rotate(0.8deg) translateY(0.15px); transform-origin: center; }
  @keyframes sketch-draw {
    from { stroke-dashoffset: var(--dash, 60); opacity: 0.2; }
    70% { opacity: 1; }
    to { stroke-dashoffset: 0; opacity: 1; }
  }
`;

const LEIS_DESTAQUE = [
  {
    label: "Essencial para a escola", labelColor: "bg-[#6b8d57] text-white",
    titulo: "Lei de Diretrizes e Bases da Educação Nacional",
    short: "LDB", year: "1996", type: "Lei Federal",
    numero: "Lei nº 9.394/1996",
    what: "Organiza a educação brasileira e define responsabilidades da União, dos estados, dos municípios e das escolas.",
    why: "Ajuda a entender como a escola se estrutura, como o ensino é organizado e quais princípios orientam a gestão.",
    use: ["organização do ensino", "gestão democrática", "responsabilidades da direção"],
    link: "https://www.planalto.gov.br/ccivil_03/leis/l9394.htm",
    border: "border-[#d7c7a3]", pin: "bg-[#c95c4b]", angle: "rotate-[-1deg]",
  },
  {
    label: "Importante para o financeiro", labelColor: "bg-[#d79e39] text-white",
    titulo: "Programa Dinheiro Direto na Escola",
    short: "PDDE", year: "1995", type: "Programa Federal",
    numero: "Lei nº 11.947/2009",
    what: "Envia recursos diretamente para apoiar melhorias, materiais e ações pedagógicas da escola.",
    why: "Norma mais consultada pela gestão no uso correto do dinheiro e prestação de contas.",
    use: ["compras permitidas", "pequenos reparos", "prestação de contas no SIGPC"],
    link: "https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2009/lei/l11947.htm",
    border: "border-[#e2c98b]", pin: "bg-[#d79e39]", angle: "rotate-[1deg]",
  },
  {
    label: "Atenção à execução", labelColor: "bg-[#d96b63] text-white",
    titulo: "Programa Nacional de Alimentação Escolar",
    short: "PNAE", year: "1955", type: "Programa Federal",
    numero: "Lei nº 11.947/2009",
    what: "Regula a alimentação escolar e orienta critérios de aquisição e oferta dos alimentos.",
    why: "Impacta compras, cardápio, agricultura familiar e o cuidado diário com a alimentação escolar.",
    use: ["compra da agricultura familiar", "cardápio com nutricionista", "uso do recurso corretamente"],
    link: "https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2009/lei/l11947.htm",
    border: "border-[#efc0b7]", pin: "bg-[#d96b63]", angle: "rotate-[-1deg]",
  },
];

const MESES_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function AtualizacoesLegislativas() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const monthLabel = `${MESES_PT[currentMonth - 1]} ${currentYear}`;
  const monthPattern = `/${String(currentMonth).padStart(2, "0")}/${currentYear}`;

  const yearStr = String(currentYear);

  const { data: dataNew, isLoading: loadingNew } = useMecNormasAll({ q: yearStr, size: 50, page: 0 });
  const { data: dataRevoked, isLoading: loadingRevoked } = useMecNormasAll({ q: yearStr, vigente: "false", size: 30, page: 0 });

  const isLoading = loadingNew || loadingRevoked;

  const allNew: any[] = dataNew?.entidades || [];
  const allRevoked: any[] = dataRevoked?.entidades || [];

  function matchesMonth(norma: any) {
    const d = norma.dataDePublicacaoString || norma.dataPublicacao || norma.dataPublicacaoAto || norma.dataDePublicacao || "";
    return d.includes(monthPattern);
  }

  const novas = allNew.filter(n => matchesMonth(n) && n.vigente !== false && !((n.correlacoes || []).some((c: any) => c.encerraVigencia)));
  const alteradas = allNew.filter(n => matchesMonth(n) && n.vigente !== false && (n.correlacoes || []).some((c: any) => c.encerraVigencia));
  const revogadas = allRevoked.filter(n => matchesMonth(n));

  const total = novas.length + alteradas.length + revogadas.length;

  if (!isLoading && total === 0) {
    return (
      <div className="mb-10 rounded-[28px] border border-[#e6ddcf] bg-[#fffdf8] p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-8 w-1.5 rounded-full bg-[#b3c4a0]" />
          <h2 className="text-lg font-black text-[#43513d]">
            Atualizações Legislativas
            <span className="ml-2 text-xs font-semibold text-[#94a3b8]">— {monthLabel}</span>
          </h2>
        </div>
        <p className="text-sm text-[#8a9a84] pl-5">Nenhuma norma nova, alterada ou revogada encontrada no MEC neste mês.</p>
      </div>
    );
  }

  return (
    <div className="mb-10 rounded-[28px] border border-[#d9e4d1] bg-[#f5faf3] p-5 sm:p-6 shadow-[0_8px_24px_rgba(90,120,70,0.08)]">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="h-10 w-2 rounded-full bg-[#7f9a70]" />
        <div>
          <h2 className="text-xl font-black text-[#3a4d35]">Atualizações Legislativas</h2>
          <p className="text-sm text-[#6b7a66]">{monthLabel} · normas novas, alteradas ou revogadas no MEC</p>
        </div>
        {!isLoading && (
          <span className="ml-auto rounded-full bg-[#7f9a70] px-3 py-1 text-xs font-black text-white shadow-sm">
            {total} atualização{total !== 1 ? "ões" : ""}
          </span>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center gap-3 py-4 pl-5 text-[#7f9a70]">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Verificando atualizações deste mês...</span>
        </div>
      )}

      {!isLoading && (
        <div className="space-y-8">
          {[
            {
              items: novas,
              badge: { label: "Nova", bg: "#dcead7", text: "#4e7a4d" },
              subtitle: (n: number) => `${n} norma${n !== 1 ? "s" : ""} publicada${n !== 1 ? "s" : ""} este mês`,
              btnBg: "#5d7452", btnHover: "#4e6344", isRevoked: false,
            },
            {
              items: alteradas,
              badge: { label: "Alterada", bg: "#f5e6b8", text: "#8a6a14" },
              subtitle: (n: number) => `${n} norma${n !== 1 ? "s" : ""} com alteração este mês`,
              btnBg: "#c9913a", btnHover: "#b57e30", isRevoked: false,
            },
            {
              items: revogadas,
              badge: { label: "Revogada", bg: "#f3d2cf", text: "#9b4b45" },
              subtitle: (n: number) => `${n} norma${n !== 1 ? "s" : ""} revogada${n !== 1 ? "s" : ""} este mês`,
              btnBg: "#9b4b45", btnHover: "#7a3d3a", isRevoked: true,
            },
          ].map(group => group.items.length > 0 && (
            <div key={group.badge.label}>
              <div className="mb-3 flex items-center gap-2">
                <span className="inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em]"
                  style={{ background: group.badge.bg, color: group.badge.text }}>
                  {group.badge.label}
                </span>
                <span className="text-xs font-semibold text-[#8a9a84]">{group.subtitle(group.items.length)}</span>
              </div>
              <div className="space-y-3">
                {group.items.map((n: any) => {
                  const title = n.titulo || n.tituloAto || n.identificacao || `Ato ${n.id}`;
                  const ementa = n.ementa || n.resumo || "";
                  const tipo = n.tipo?.nome || "";
                  const date = n.dataDePublicacaoString || n.dataPublicacao || "";
                  const link = n.disponivelEm || n.disponivel_em || "";
                  const s = tipoStyle(tipo);
                  return (
                    <div key={n.id}
                      className="grid gap-4 rounded-[24px] border border-[#e6ddcf] bg-white p-4 md:grid-cols-[2fr_1fr_1fr_auto] md:items-center transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div>
                        <h4 className={`text-sm font-black leading-snug text-[#46543f] ${group.isRevoked ? "line-through decoration-[#e08080]/60 text-[#7a3d3a]" : ""}`}>
                          {title}
                        </h4>
                        {ementa && <p className="mt-1.5 text-xs leading-5 text-[#60685a]">{ementa.length > 130 ? ementa.slice(0, 130) + "…" : ementa}</p>}
                        {date && <div className="mt-1 text-[10px] text-[#94a3b8]">{date}</div>}
                      </div>
                      <div>
                        {tipo && (
                          <span className="inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em]"
                            style={{ background: s.bg, color: s.text }}>
                            {tipo}
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em]"
                          style={{ background: group.badge.bg, color: group.badge.text }}>
                          {group.badge.label}
                        </span>
                      </div>
                      <div>
                        {link ? (
                          <a href={link} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full border border-[#d4c7b3] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:opacity-90 whitespace-nowrap"
                            style={{ background: group.btnBg }}>
                            <ExternalLink className="w-3 h-3" /> Abrir
                          </a>
                        ) : (
                          <span className="inline-flex rounded-full border border-[#e6ddcf] bg-[#f9f6ef] px-4 py-2.5 text-[10px] font-semibold text-[#94a3b8]">Sem link</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Legislacao() {
  const [activeTab, setActiveTab] = useState<CategoryId>("cat-normas");
  const { data: settings } = useQuery<Record<string, string>>({ queryKey: ["/api/settings"] });

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f4efe4", color: "#3f4637" }}>
      <style>{ICON_SKETCH_CSS}</style>
      <Navigation />

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1">
        <div className="relative overflow-hidden rounded-[34px] border border-[#d9ceb8] bg-[#fbf7ee] shadow-[0_20px_60px_rgba(90,80,50,0.10)]">

          <div className="relative px-5 pb-8 pt-8 sm:px-8 lg:px-10">

            {/* Seletor de abas */}
            <div className="mb-8 rounded-[28px] border border-[#ddd2bc] bg-[#f6f2e9] p-3 shadow-sm">
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => setActiveTab("cat-normas")}
                  className={`rounded-[18px] px-5 py-3 text-sm font-black transition ${activeTab === "cat-normas" ? "bg-[#5d7452] text-white shadow-md" : "border border-[#ddd2bc] bg-white text-[#60705d]"}`}>
                  <span className="flex items-center gap-2">
                    <HandDrawnIcon className="h-4 w-4"><path d="M4.3 6.1h5.6v13.4H4.3z" strokeDasharray="38" strokeDashoffset="38" style={{ animationDelay: "0.02s" }} /><path d="M14.1 6.1h5.6v13.4h-5.6z" strokeDasharray="38" strokeDashoffset="38" style={{ animationDelay: "0.12s" }} /></HandDrawnIcon>
                    Normas
                  </span>
                </button>
                <button type="button" onClick={() => setActiveTab("cat-dou")}
                  className={`rounded-[18px] px-5 py-3 text-sm font-black transition ${activeTab === "cat-dou" ? "bg-[#5d7452] text-white shadow-md" : "border border-[#ddd2bc] bg-white text-[#60705d]"}`}>
                  <span className="flex items-center gap-2">
                    <HandDrawnIcon className="h-4 w-4"><path d="M4.3 4.3h15.4v15.4H4.3z" strokeDasharray="48" strokeDashoffset="48" style={{ animationDelay: "0.02s" }} /><path d="M7.1 8.1h9.9" strokeDasharray="10" strokeDashoffset="10" style={{ animationDelay: "0.13s" }} /><path d="M7.1 12h6.1" strokeDasharray="7" strokeDashoffset="7" style={{ animationDelay: "0.21s" }} /></HandDrawnIcon>
                    Diário Oficial
                  </span>
                </button>
              </div>
            </div>

            {/* ── ABA NORMAS ── */}
            {activeTab === "cat-normas" && (
              <>
                {/* Hero */}
                <div className="mb-10">
                    <h1 className="max-w-3xl text-3xl font-black tracking-tight text-[#40513b] sm:text-4xl">
                      {settings?.legislacao_normas_titulo || "Normas da gestão escolar"}
                    </h1>
                    <p className="mt-4 max-w-3xl text-base leading-7 text-[#5f6659]">
                      {settings?.legislacao_normas_desc || "Com as leis fundamentais da educação em destaque, pesquise por palavras-chave, filtre por tipo e confira o status de vigência de cada norma."}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3 text-sm text-[#5e6659]">
                      <span className="rounded-full border border-[#d8cdb5] bg-[#f8f4ea] px-4 py-2 font-semibold">Fonte: MEC Normas – Ministério da Educação</span>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-3">
                      {(settings?.legislacao_chips || "prestação de contas,PDDE,alimentação escolar,transporte")
                        .split(",").map(t => t.trim()).filter(Boolean).map(tag => (
                          <span key={tag} className="rounded-full border border-[#d9ceb8] bg-white px-4 py-2 text-sm font-medium text-[#53604f] shadow-sm">{tag}</span>
                        ))}
                    </div>
                </div>

                {/* Mapa de categorias */}
                <section className="mb-10">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="h-10 w-2 rounded-full bg-[#8fa37f]" />
                    <div>
                      <h2 className="text-2xl font-black text-[#43513d]">Mapa da legislação da escola</h2>
                      <p className="text-sm text-[#6b7066]">Consulta organizada por temas da rotina escolar</p>
                    </div>
                  </div>
                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {legislacaoCategorias.map(item => (
                      <article key={item.title} className={`group relative overflow-hidden rounded-[28px] border border-[#d8cab4] bg-gradient-to-br ${item.color} p-5 shadow-[0_8px_18px_rgba(90,80,50,0.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_14px_28px_rgba(90,80,50,0.10)]`}>
                        {/* post-it sticker */}
                        <div
                          className={`absolute right-4 top-4 flex flex-col items-center justify-center gap-0.5 rounded-[6px] ${item.tape} select-none`}
                          style={{
                            width: 52, height: 52,
                            background: item.stickerBg,
                            boxShadow: '2px 3px 10px rgba(0,0,0,0.28)',
                          }}
                        >
                          <span className="text-xl font-black leading-none text-white drop-shadow-sm">{item.stickerLabel}</span>
                          <span className="text-[9px] font-black tracking-widest text-white/80 uppercase leading-none">{item.stickerSub}</span>
                          {/* fold corner */}
                          <span
                            className="absolute bottom-0 right-0"
                            style={{
                              width: 0, height: 0,
                              borderStyle: 'solid',
                              borderWidth: '10px 10px 0 0',
                              borderColor: `transparent rgba(0,0,0,0.18) transparent transparent`,
                            }}
                          />
                        </div>
                        <div className="relative flex items-start gap-4">
                          <div className="mt-1 text-3xl">{item.icon}</div>
                          <div>
                            <h3 className="text-xl font-black text-[#44533d]">{item.title}</h3>
                            <p className="mt-1 text-sm font-semibold text-[#61715b]">{item.count}</p>
                            <p className="mt-3 text-sm leading-6 text-[#596151]">{item.note}</p>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>

                {/* Leis fundamentais + Timeline */}
                <section className="mb-10 grid gap-8 xl:grid-cols-2">
                  <div>
                    <div className="mb-5 flex items-center gap-3">
                      <div className="h-10 w-2 rounded-full bg-[#d1a43c]" />
                      <div>
                        <h2 className="text-2xl font-black text-[#43513d]">Leis fundamentais</h2>
                        <p className="text-sm text-[#6b7066]">As normas mais importantes com explicação direta e link para o texto original</p>
                      </div>
                    </div>
                    <div className="space-y-6">
                      {LEIS_DESTAQUE.map(card => (
                        <article key={card.short} className={`relative ${card.angle} rounded-[28px] border-2 ${card.border} bg-[#fffdf8] p-6 shadow-[0_16px_40px_rgba(90,80,50,0.10)]`}>
                          <div className={`absolute left-8 top-0 h-5 w-14 -translate-y-1/2 rounded-full ${card.pin} shadow-md`} />
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] ${card.labelColor}`}>{card.label}</span>
                              <h3 className="mt-3 text-xl font-black text-[#3f493b]">{card.titulo}</h3>
                              <div className="mt-2 flex flex-wrap gap-2 text-sm text-[#697062]">
                                <span className="rounded-full bg-[#f3eedf] px-3 py-1">{card.short}</span>
                                <span className="rounded-full bg-[#f3eedf] px-3 py-1">{card.year}</span>
                                <span className="rounded-full bg-[#f3eedf] px-3 py-1">{card.type}</span>
                              </div>
                            </div>
                            <a href={card.link} target="_blank" rel="noopener noreferrer" className="rounded-full border border-[#d7cab4] bg-white px-4 py-2 text-sm font-semibold text-[#52604d] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md flex items-center gap-1.5">
                              <ExternalLink className="w-3 h-3" /> Abrir lei
                            </a>
                          </div>
                          <div className="mt-5 grid gap-3 md:grid-cols-3">
                            {[
                              { label: "O que é", text: card.what },
                              { label: "Por que importa", text: card.why },
                              { label: "Aplicação prática", items: card.use },
                            ].map(col => (
                              <div key={col.label} className="rounded-[22px] border border-[#ece3d5] bg-[#fcfaf4] p-4">
                                <div className="text-xs font-black uppercase tracking-[0.15em] text-[#9b7a2c]">{col.label}</div>
                                {col.text ? (
                                  <p className="mt-2 text-sm leading-6 text-[#5a6153]">{col.text}</p>
                                ) : (
                                  <ul className="mt-2 space-y-1.5 text-sm text-[#5a6153]">
                                    {col.items?.map(i => <li key={i} className="flex gap-2"><span>•</span><span>{i}</span></li>)}
                                  </ul>
                                )}
                              </div>
                            ))}
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="rounded-[30px] border border-[#d7cab4] bg-[#fffaf2] p-6 shadow-[0_16px_40px_rgba(90,80,50,0.08)]">
                    <div className="mb-4 inline-flex rotate-[-2deg] rounded-full bg-[#c95c4b] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white">linha do tempo</div>
                    <h3 className="text-2xl font-black text-[#44513e]">Principais marcos da legislação educacional</h3>
                    <div className="mt-6 space-y-4">
                      {legislacaoTimeline.map((item, index) => (
                        <div key={item.year} className="relative pl-8">
                          {index !== legislacaoTimeline.length - 1 && (
                            <div className="absolute left-[11px] top-7 h-full w-[2px] bg-[#d9cfbd]" />
                          )}
                          <div className="absolute left-0 top-1 h-6 w-6 rounded-full border-4 border-[#fffaf2] bg-[#7f9a70] shadow-sm" />
                          <div className="rounded-[20px] border border-[#ece3d2] bg-white p-4">
                            <div className="text-xs font-black uppercase tracking-[0.16em] text-[#9b7a2c]">{item.year}</div>
                            <div className="mt-1 text-lg font-black text-[#46543f]">{item.title}</div>
                            <div className="mt-0.5 text-sm text-[#61695c]">{item.note}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Atualizações legislativas do mês */}
                <AtualizacoesLegislativas />

                {/* Acervo de normas — dados reais da API MEC */}
                <div className="rounded-[30px] border border-[#d7cab4] bg-[#f9f6ef] p-4 sm:p-6 shadow-[0_14px_36px_rgba(90,80,50,0.08)]">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="h-10 w-2 rounded-full bg-[#cf7e3f]" />
                    <div>
                      <h2 className="text-2xl font-black text-[#43513d]">Acervo de normas</h2>
                      <p className="text-sm text-[#6b7066]">Resoluções, portarias, decretos e outros atos do Ministério da Educação</p>
                    </div>
                  </div>
                  <NormasContent />
                </div>
              </>
            )}

            {/* ── ABA DIÁRIO OFICIAL ── */}
            {activeTab === "cat-dou" && (
              <DiarioOficialContent />
            )}

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

// categoriaColors mantida para compatibilidade com imports existentes
void categoriaColors;
