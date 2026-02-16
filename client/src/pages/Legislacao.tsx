import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { ExternalLink, Scale, FileText, BookOpen, Landmark, GraduationCap, Utensils, Bus, Coins, Users, ShieldCheck, ClipboardList } from "lucide-react";
import { useState } from "react";

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

export default function Legislacao() {
  const [categoriaAtiva, setCategoriaAtiva] = useState("Todos");

  const leisFiltradas = categoriaAtiva === "Todos"
    ? legislacoes
    : legislacoes.filter(l => l.categoria === categoriaAtiva);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Legislação Educacional</h1>
            <p className="text-muted-foreground">
              Principais leis, decretos e resoluções que orientam a gestão financeira e pedagógica das escolas públicas brasileiras.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            {categorias.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoriaAtiva(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  categoriaAtiva === cat
                    ? "bg-accent text-white shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid gap-4">
            {leisFiltradas.map((lei, index) => (
              <motion.div
                key={lei.numero}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <a
                  href={lei.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-5 rounded-xl border bg-card hover:border-accent/40 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <lei.icon className="w-5 h-5 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors leading-snug">
                            {lei.titulo}
                          </h3>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-sm text-muted-foreground font-mono">{lei.numero}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoriaColors[lei.categoria] || "bg-gray-100 text-gray-700"}`}>
                              {lei.categoria}
                            </span>
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors flex-shrink-0 mt-1" />
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                        {lei.descricao}
                      </p>
                      {lei.destaque && (
                        <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-accent bg-accent/5 px-2.5 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                          {lei.destaque}
                        </div>
                      )}
                    </div>
                  </div>
                </a>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 p-5 rounded-xl bg-accent/5 border border-accent/20">
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Nota:</strong> Esta seção reúne as principais legislações de referência para a gestão escolar. 
              Os links direcionam para os textos oficiais publicados no portal do Planalto ou do FNDE. 
              Para dúvidas específicas sobre a aplicação dessas normas, consulte o <a href="/chat" className="text-accent hover:underline font-medium">Caderno da Diretora</a>.
            </p>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
