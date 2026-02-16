import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import {
  ExternalLink, Scale, FileText, Search, Landmark,
  Loader2, AlertCircle, Newspaper, BookMarked,
  Info, MapPin, Globe
} from "lucide-react";
import { useState, useCallback } from "react";
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
  "Planejamento": { bg: "#f3e8ff", color: "#6b21a8" },
  "Gestão": { bg: "#dbeafe", color: "#1e40af" },
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
                          <div style={{
                            fontSize: "12px", color: "#2d3748", lineHeight: 1.5, maxWidth: "300px",
                            background: "#fffbeb", padding: "8px 10px", borderRadius: "6px",
                            borderLeft: "3px solid #f59e0b",
                          }}>
                            {gerarExplicacaoDiretora(title, ementa, tipo)}
                          </div>
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

function GazetteResultsTable({ gazettes, bgColor }: { gazettes: any[]; bgColor: string }) {
  return (
    <div style={{ maxHeight: "500px", overflowY: "auto", overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "650px" }}>
        <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
          <tr>
            <th style={thStyle}>Município / UF</th>
            <th style={thStyle}>Trecho</th>
            <th style={thStyle}>Data</th>
            <th style={{ ...thStyle, textAlign: "center" }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {gazettes.map((g: any, index: number) => (
            <tr key={`gz-${index}`} style={{ background: index % 2 === 0 ? "transparent" : bgColor }}>
              <td style={tdStyle}>
                <div style={{ fontWeight: 600, fontSize: "13px", color: "#1e293b" }}>{g.territory_name}</div>
                <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "2px" }}>{g.state_code}</div>
              </td>
              <td style={tdStyle}>
                {g.excerpts && g.excerpts.length > 0 ? (
                  <div
                    style={{ fontSize: "11px", color: "#64748b", lineHeight: 1.4, maxWidth: "400px" }}
                    dangerouslySetInnerHTML={{
                      __html: g.excerpts[0].length > 180 ? g.excerpts[0].slice(0, 180) + "..." : g.excerpts[0]
                    }}
                  />
                ) : (
                  <span style={{ fontSize: "11px", color: "#cbd5e1" }}>—</span>
                )}
              </td>
              <td style={tdStyle}>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  {g.date ? new Date(g.date + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
                </span>
              </td>
              <td style={{ ...tdStyle, textAlign: "center" }}>
                <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                  <a href={g.url} target="_blank" rel="noopener noreferrer" style={{ padding: "4px 10px", border: "none", borderRadius: "4px", background: "#166534", color: "white", fontSize: "11px", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <ExternalLink style={{ width: "11px", height: "11px" }} />
                    PDF
                  </a>
                  {g.txt_url && (
                    <a href={g.txt_url} target="_blank" rel="noopener noreferrer" style={{ padding: "4px 10px", border: "1px solid #e2e5ec", borderRadius: "4px", background: "white", color: "#64748b", fontSize: "11px", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}>
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
    { id: "dou", label: "DOU Federal", icon: <Landmark style={{ width: "14px", height: "14px" }} />, color: "#1e40af" },
    { id: "doe", label: "DOE Estados", icon: <Globe style={{ width: "14px", height: "14px" }} />, color: "#6b21a8" },
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

  return (
    <>
      <div style={{
        background: "#eff6ff",
        borderLeft: "4px solid #3b82f6",
        padding: "14px 20px",
        borderRadius: "0 10px 10px 0",
        fontSize: "13px",
        color: "#1e40af",
        marginBottom: "16px",
        lineHeight: 1.6,
      }}>
        <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Info className="w-4 h-4" />
          Diários Oficiais
        </div>
        <p>Busque publicações oficiais do DOU (federal), dos diários estaduais (DOE) e dos diários municipais. Escolha a aba desejada abaixo.</p>
        <div style={{ marginTop: "6px", paddingTop: "6px", borderTop: "1px solid #bfdbfe", fontSize: "12px", color: "#1e3a8a" }}>
          <strong>Fontes: Imprensa Nacional (in.gov.br) | Querido Diário API (queridodiario.ok.org.br)</strong>
        </div>
      </div>

      <div style={{ display: "flex", gap: "4px", marginBottom: "16px", flexWrap: "wrap" }}>
        {subTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            style={{
              padding: "10px 18px",
              borderRadius: "8px 8px 0 0",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 600,
              border: activeSubTab === tab.id ? `2px solid ${tab.color}` : "1px solid #e2e5ec",
              borderBottom: activeSubTab === tab.id ? "2px solid white" : "1px solid #e2e5ec",
              background: activeSubTab === tab.id ? "white" : "#fafbfc",
              color: activeSubTab === tab.id ? tab.color : "#64748b",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.15s",
              marginBottom: "-1px",
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === "dou" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ background: "white", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #e2e5ec" }}>
            <form onSubmit={(e) => { e.preventDefault(); setDouSubmitted(douSearch.trim()); }}>
              <div style={{ padding: "16px 20px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "3px", flex: 1, minWidth: "200px" }}>
                  <label style={labelStyle}>Buscar no DOU (Diário Oficial da União)</label>
                  <input
                    type="text"
                    value={douSearch}
                    onChange={(e) => setDouSearch(e.target.value)}
                    placeholder="Ex: PDDE, alimentação escolar, prestação de contas..."
                    style={inputStyle}
                  />
                </div>
                <button type="submit" disabled={!douSearch.trim()} style={{ padding: "8px 18px", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: douSearch.trim() ? "pointer" : "not-allowed", display: "inline-flex", alignItems: "center", gap: "6px", background: douSearch.trim() ? "#1e40af" : "#94a3b8", color: "white", transition: "all 0.15s" }}>
                  <Search style={{ width: "14px", height: "14px" }} />
                  Buscar
                </button>
              </div>
            </form>
            <div style={{ padding: "0 20px 12px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
              <span style={{ fontSize: "11px", color: "#94a3b8", alignSelf: "center" }}>Sugestões:</span>
              {quickSearches.map((term) => (
                <button key={term} onClick={() => { setDouSearch(term); setDouSubmitted(term); }} style={{ padding: "4px 10px", borderRadius: "20px", border: "none", fontSize: "11px", fontWeight: 500, cursor: "pointer", background: "#dbeafe", color: "#1e40af", transition: "all 0.15s" }}>
                  {term}
                </button>
              ))}
            </div>
          </div>

          {douQuery.isLoading && (
            <div style={{ textAlign: "center", padding: "48px", color: "#94a3b8" }}>
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: "#1e40af" }} />
              <div style={{ fontSize: "13px" }}>Consultando o DOU (Imprensa Nacional)...</div>
            </div>
          )}

          {douQuery.error && (
            <div style={{ background: "#fffbeb", borderLeft: "3px solid #f59e0b", padding: "10px 14px", borderRadius: "0 6px 6px 0", fontSize: "12px", color: "#92400e" }}>
              <AlertCircle className="w-4 h-4 inline mr-2" />
              DOU temporariamente indisponível. Tente novamente em instantes.
            </div>
          )}

          {!douQuery.isLoading && douSubmitted && !douQuery.error && (
            <div style={{ background: "white", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #e2e5ec" }}>
              <div style={{ padding: "12px 20px", borderBottom: "1px solid #e2e5ec", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", color: "#1e40af", fontWeight: 600 }}>
                  Resultados para "{douSubmitted}"
                </span>
                <span style={{ fontSize: "11px", color: "#64748b" }}>
                  {douResults.length > 0 ? `${douResults.length} publicação(ões)` : "Nenhum resultado"}
                </span>
              </div>
              {douResults.length > 0 ? (
                <>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
                      <thead>
                        <tr>
                          <th style={thStyle}>Publicação</th>
                          <th style={thStyle}>Data</th>
                          <th style={thStyle}>Órgão</th>
                          <th style={{ ...thStyle, textAlign: "center" }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {douResults.map((item, index) => (
                          <tr key={`dou-${index}`} style={{ background: index % 2 === 0 ? "transparent" : "#f0f4ff" }}>
                            <td style={tdStyle}>
                              <div style={{ maxWidth: "450px" }}>
                                <div style={{ fontWeight: 600, fontSize: "13px", lineHeight: 1.3, color: "#1e293b" }}>{item.title}</div>
                                {item.abstract && (
                                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", lineHeight: 1.4 }}>
                                    {item.abstract.length > 180 ? item.abstract.slice(0, 180) + "..." : item.abstract}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td style={tdStyle}><span style={{ fontSize: "12px", color: "#64748b" }}>{item.date || "—"}</span></td>
                            <td style={tdStyle}><span style={{ fontSize: "12px", color: "#64748b" }}>{item.hierarchy || "Governo Federal"}</span></td>
                            <td style={{ ...tdStyle, textAlign: "center" }}>
                              <a href={item.href} target="_blank" rel="noopener noreferrer" style={{ padding: "4px 10px", border: "none", borderRadius: "4px", background: "#1e40af", color: "white", fontSize: "11px", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                <ExternalLink style={{ width: "11px", height: "11px" }} /> Abrir
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {douSearchUrl && (
                    <div style={{ padding: "10px 20px", borderTop: "1px solid #e2e5ec", textAlign: "center" }}>
                      <a href={douSearchUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: "#1e40af", textDecoration: "none", fontWeight: 600 }}>
                        Ver mais resultados no site oficial do DOU →
                      </a>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ padding: "24px 20px", textAlign: "center" }}>
                  <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "12px" }}>
                    {douQuery.data?.message || `Nenhum resultado encontrado para "${douSubmitted}" no DOU.`}
                  </p>
                  {douSearchUrl && (
                    <a href={douSearchUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "6px", background: "#1e40af", color: "white", textDecoration: "none", fontSize: "12px", fontWeight: 600 }}>
                      <ExternalLink style={{ width: "12px", height: "12px" }} /> Buscar diretamente no site do DOU
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {!douSubmitted && (
            <div style={{ textAlign: "center", padding: "32px 48px", color: "#94a3b8" }}>
              <Newspaper className="w-10 h-10 mx-auto mb-3" style={{ opacity: 0.3 }} />
              <p style={{ fontSize: "14px" }}>Busque publicações no Diário Oficial da União</p>
              <p style={{ fontSize: "12px", marginTop: "4px", opacity: 0.7 }}>Fonte: Imprensa Nacional (in.gov.br)</p>
            </div>
          )}
        </div>
      )}

      {activeSubTab === "doe" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ background: "white", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #e2e5ec" }}>
            <form onSubmit={(e) => { e.preventDefault(); if (doeSearch.trim() && doeState) { setDoeSubmitted(doeSearch.trim()); setDoeOffset(0); } }}>
              <div style={{ padding: "16px 20px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: "160px" }}>
                  <label style={labelStyle}>Estado (UF)</label>
                  <select
                    value={doeState}
                    onChange={(e) => { setDoeState(e.target.value); setDoeOffset(0); }}
                    style={selectStyle}
                  >
                    <option value="">Selecione o estado...</option>
                    {estados.map(e => (
                      <option key={e.sigla} value={e.sigla}>{e.sigla} — {e.nome}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "3px", flex: 1, minWidth: "200px" }}>
                  <label style={labelStyle}>Buscar nos diários do estado</label>
                  <input
                    type="text"
                    value={doeSearch}
                    onChange={(e) => setDoeSearch(e.target.value)}
                    placeholder="Ex: PDDE, alimentação escolar..."
                    style={inputStyle}
                  />
                </div>
                <button type="submit" disabled={!doeSearch.trim() || !doeState} style={{ padding: "8px 18px", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: (doeSearch.trim() && doeState) ? "pointer" : "not-allowed", display: "inline-flex", alignItems: "center", gap: "6px", background: (doeSearch.trim() && doeState) ? "#6b21a8" : "#94a3b8", color: "white", transition: "all 0.15s" }}>
                  <Search style={{ width: "14px", height: "14px" }} />
                  Buscar
                </button>
              </div>
            </form>
            <div style={{ padding: "0 20px 12px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
              <span style={{ fontSize: "11px", color: "#94a3b8", alignSelf: "center" }}>Sugestões:</span>
              {quickSearches.map((term) => (
                <button key={term} onClick={() => { setDoeSearch(term); if (doeState) { setDoeSubmitted(term); setDoeOffset(0); } }} style={{ padding: "4px 10px", borderRadius: "20px", border: "none", fontSize: "11px", fontWeight: 500, cursor: "pointer", background: "#f3e8ff", color: "#6b21a8", transition: "all 0.15s" }}>
                  {term}
                </button>
              ))}
            </div>
          </div>

          {doeQuery.isLoading && (
            <div style={{ textAlign: "center", padding: "48px", color: "#94a3b8" }}>
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: "#6b21a8" }} />
              <div style={{ fontSize: "13px" }}>Consultando diários de {doeState} via Querido Diário...</div>
            </div>
          )}

          {doeQuery.error && (
            <div style={{ background: "#fffbeb", borderLeft: "3px solid #f59e0b", padding: "10px 14px", borderRadius: "0 6px 6px 0", fontSize: "12px", color: "#92400e" }}>
              <AlertCircle className="w-4 h-4 inline mr-2" />
              Erro ao consultar diários de {doeState}. Tente novamente.
            </div>
          )}

          {!doeQuery.isLoading && doeSubmitted && doeState && !doeQuery.error && (
            <div style={{ background: "white", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #e2e5ec" }}>
              <div style={{ padding: "12px 20px", borderBottom: "1px solid #e2e5ec", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                <span style={{ fontSize: "13px", color: "#6b21a8", fontWeight: 600 }}>
                  Resultados para "{doeSubmitted}" em {doeState}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>
                    {doeGazettes.length > 0 ? `${doeTotal.toLocaleString("pt-BR")} resultado(s)` : "Nenhum resultado"}
                  </span>
                  {doePortal && (
                    <a href={doePortal.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "11px", color: "#6b21a8", textDecoration: "none", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "3px" }}>
                      <Globe style={{ width: "10px", height: "10px" }} />
                      Portal oficial
                    </a>
                  )}
                </div>
              </div>
              {doeGazettes.length > 0 ? (
                <>
                  <GazetteResultsTable gazettes={doeGazettes} bgColor="#faf5ff" />
                  {doeTotalPages > 1 && (
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", padding: "14px", borderTop: "1px solid #e2e5ec" }}>
                      <button onClick={() => setDoeOffset(Math.max(0, doeOffset - doePageSize))} disabled={doeOffset <= 0} style={{ ...paginationBtnStyle, opacity: doeOffset <= 0 ? 0.4 : 1, cursor: doeOffset <= 0 ? "not-allowed" : "pointer" }}>
                        Anterior
                      </button>
                      <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                        Página {doeCurrentPage + 1} de {doeTotalPages > 100 ? "100+" : doeTotalPages}
                      </span>
                      <button onClick={() => setDoeOffset(doeOffset + doePageSize)} disabled={doeCurrentPage >= doeTotalPages - 1 || doeCurrentPage >= 99} style={{ ...paginationBtnStyle, opacity: doeCurrentPage >= doeTotalPages - 1 ? 0.4 : 1, cursor: doeCurrentPage >= doeTotalPages - 1 ? "not-allowed" : "pointer" }}>
                        Próxima
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ padding: "24px 20px", textAlign: "center" }}>
                  <p style={{ fontSize: "13px", color: "#64748b" }}>
                    {doeQuery.data?.message || `Nenhum resultado para "${doeSubmitted}" em ${doeState}.`}
                  </p>
                  {doePortal && (
                    <a href={doePortal.searchUrl ? doePortal.searchUrl(doeSubmitted) : doePortal.url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "6px", background: "#6b21a8", color: "white", textDecoration: "none", fontSize: "12px", fontWeight: 600, marginTop: "8px" }}>
                      <ExternalLink style={{ width: "12px", height: "12px" }} /> Buscar no portal oficial de {doeState}
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {(!doeSubmitted || !doeState) && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ textAlign: "center", padding: "24px 48px", color: "#94a3b8" }}>
                <Globe className="w-10 h-10 mx-auto mb-3" style={{ opacity: 0.3 }} />
                <p style={{ fontSize: "14px" }}>Selecione um estado e pesquise nos diários oficiais</p>
                <p style={{ fontSize: "12px", marginTop: "4px", opacity: 0.7 }}>
                  Dados de {doeLinks.length} estados via Querido Diário (queridodiario.ok.org.br)
                </p>
              </div>
              <div style={{ background: "white", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #e2e5ec" }}>
                <div style={{ padding: "12px 20px", borderBottom: "1px solid #e2e5ec" }}>
                  <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#6b21a8" }}>Portais oficiais dos DOEs</h4>
                </div>
                <div style={{ padding: "14px 20px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {doeLinks.map(doe => (
                    <a key={doe.sigla} href={doe.url} target="_blank" rel="noopener noreferrer" title={doe.estado} style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 12px", borderRadius: "6px", border: "1px solid #e2e5ec", background: "#fafbfc", color: "#6b21a8", fontSize: "12px", fontWeight: 600, textDecoration: "none", transition: "all 0.15s" }}>
                      <Globe style={{ width: "11px", height: "11px" }} />
                      {doe.sigla}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeSubTab === "municipal" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ background: "white", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #e2e5ec" }}>
            <form onSubmit={(e) => { e.preventDefault(); setMunSubmitted(munSearch.trim()); setMunOffset(0); }}>
              <div style={{ padding: "16px 20px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "3px", flex: 1, minWidth: "200px" }}>
                  <label style={labelStyle}>Buscar nos diários municipais (350+ cidades)</label>
                  <input
                    type="text"
                    value={munSearch}
                    onChange={(e) => setMunSearch(e.target.value)}
                    placeholder="Ex: PDDE, alimentação escolar, prestação de contas..."
                    style={inputStyle}
                  />
                </div>
                <button type="submit" disabled={!munSearch.trim()} style={{ padding: "8px 18px", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: munSearch.trim() ? "pointer" : "not-allowed", display: "inline-flex", alignItems: "center", gap: "6px", background: munSearch.trim() ? "#166534" : "#94a3b8", color: "white", transition: "all 0.15s" }}>
                  <Search style={{ width: "14px", height: "14px" }} />
                  Buscar
                </button>
              </div>
            </form>
            <div style={{ padding: "0 20px 12px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
              <span style={{ fontSize: "11px", color: "#94a3b8", alignSelf: "center" }}>Sugestões:</span>
              {quickSearches.map((term) => (
                <button key={term} onClick={() => { setMunSearch(term); setMunSubmitted(term); setMunOffset(0); }} style={{ padding: "4px 10px", borderRadius: "20px", border: "none", fontSize: "11px", fontWeight: 500, cursor: "pointer", background: "#dcfce7", color: "#166534", transition: "all 0.15s" }}>
                  {term}
                </button>
              ))}
            </div>
          </div>

          {munQuery.isLoading && (
            <div style={{ textAlign: "center", padding: "48px", color: "#94a3b8" }}>
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: "#166534" }} />
              <div style={{ fontSize: "13px" }}>Consultando diários municipais via Querido Diário...</div>
            </div>
          )}

          {munQuery.error && (
            <div style={{ background: "#fffbeb", borderLeft: "3px solid #f59e0b", padding: "10px 14px", borderRadius: "0 6px 6px 0", fontSize: "12px", color: "#92400e" }}>
              <AlertCircle className="w-4 h-4 inline mr-2" />
              Diários municipais temporariamente indisponíveis. Tente novamente.
            </div>
          )}

          {!munQuery.isLoading && munSubmitted && !munQuery.error && (
            <div style={{ background: "white", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #e2e5ec" }}>
              <div style={{ padding: "12px 20px", borderBottom: "1px solid #e2e5ec", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", color: "#166534", fontWeight: 600 }}>
                  Resultados para "{munSubmitted}"
                </span>
                <span style={{ fontSize: "11px", color: "#64748b" }}>
                  {munGazettes.length > 0 ? `${munTotal.toLocaleString("pt-BR")} resultado(s)` : "Nenhum resultado"}
                </span>
              </div>
              {munGazettes.length > 0 ? (
                <>
                  <GazetteResultsTable gazettes={munGazettes} bgColor="#f0fdf4" />
                  {munTotalPages > 1 && (
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", padding: "14px", borderTop: "1px solid #e2e5ec" }}>
                      <button onClick={() => setMunOffset(Math.max(0, munOffset - munPageSize))} disabled={munOffset <= 0} style={{ ...paginationBtnStyle, opacity: munOffset <= 0 ? 0.4 : 1, cursor: munOffset <= 0 ? "not-allowed" : "pointer" }}>
                        Anterior
                      </button>
                      <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                        Página {munCurrentPage + 1} de {munTotalPages > 100 ? "100+" : munTotalPages}
                      </span>
                      <button onClick={() => setMunOffset(munOffset + munPageSize)} disabled={munCurrentPage >= munTotalPages - 1 || munCurrentPage >= 99} style={{ ...paginationBtnStyle, opacity: munCurrentPage >= munTotalPages - 1 ? 0.4 : 1, cursor: munCurrentPage >= munTotalPages - 1 ? "not-allowed" : "pointer" }}>
                        Próxima
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ padding: "24px 20px", textAlign: "center" }}>
                  <p style={{ fontSize: "13px", color: "#64748b" }}>
                    Nenhum resultado para "{munSubmitted}" nos diários municipais.
                  </p>
                  <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "6px" }}>
                    A busca cobre mais de 350 municípios via Querido Diário
                  </p>
                </div>
              )}
            </div>
          )}

          {!munSubmitted && (
            <div style={{ textAlign: "center", padding: "32px 48px", color: "#94a3b8" }}>
              <MapPin className="w-10 h-10 mx-auto mb-3" style={{ opacity: 0.3 }} />
              <p style={{ fontSize: "14px" }}>Pesquise nos diários municipais de 350+ cidades</p>
              <p style={{ fontSize: "12px", marginTop: "4px", opacity: 0.7 }}>Fonte: Querido Diário (queridodiario.ok.org.br)</p>
            </div>
          )}
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
