import { useState, useMemo } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ArrowRight, BookOpen, GraduationCap, Utensils, Bus, 
  Coins, ChevronDown, ChevronUp, FileText, Calculator,
  CheckCircle2, AlertCircle, HelpCircle, Landmark, Users,
  Accessibility, Sparkles, BookMarked, Laptop, Palette,
  TreePine, School, BookText, MessageCircleQuestion,
  Banknote, Building2, FileCheck, Clock, Folder,
  Search, Scale, Receipt, Handshake, ShieldCheck,
  Percent, ClipboardList, PiggyBank, Gavel, CalendarDays,
  FileSignature, Package, Truck, CircleDollarSign, Hash
} from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const GLOSSARIO = [
  {
    termo: 'Adesão',
    explicacao: 'Quando a escola "se inscreve" pra receber um dinheiro. Nem toda verba cai automaticamente — pra algumas, você precisa fazer a adesão no sistema do FNDE.',
    icone: <Handshake className="w-5 h-5" />,
    letra: 'A'
  },
  {
    termo: 'APM',
    explicacao: 'Associação de Pais e Mestres. É uma das formas de UEx (Unidade Executora) que pode receber o dinheiro em nome da escola.',
    icone: <Users className="w-5 h-5" />,
    letra: 'A'
  },
  {
    termo: 'Ata',
    explicacao: 'Documento que registra o que foi decidido numa reunião. Toda vez que o Conselho se reúne pra aprovar uma compra, precisa fazer uma ata.',
    icone: <FileText className="w-5 h-5" />,
    letra: 'A'
  },
  {
    termo: 'Capital',
    explicacao: 'Dinheiro pra comprar coisas que duram: móveis, computadores, ventiladores. São bens permanentes que ficam na escola por anos.',
    icone: <Laptop className="w-5 h-5" />,
    letra: 'C'
  },
  {
    termo: 'Censo Escolar',
    explicacao: 'Pesquisa anual obrigatória que toda escola preenche. Os números do Censo definem quanto dinheiro sua escola vai receber — por isso é tão importante preencher direitinho!',
    icone: <ClipboardList className="w-5 h-5" />,
    letra: 'C'
  },
  {
    termo: 'CNPJ',
    explicacao: 'Cadastro Nacional de Pessoa Jurídica. Sua UEx (APM ou Conselho Escolar) precisa ter um CNPJ pra poder receber o dinheiro na conta bancária.',
    icone: <Hash className="w-5 h-5" />,
    letra: 'C'
  },
  {
    termo: 'Conselho Escolar',
    explicacao: 'Grupo formado por pais, professores, funcionários e alunos que decide junto com a diretora como usar o dinheiro da escola. Todas as compras precisam da aprovação deles.',
    icone: <Users className="w-5 h-5" />,
    letra: 'C'
  },
  {
    termo: 'Custeio',
    explicacao: 'Dinheiro pra gastar com coisas do dia a dia: material de limpeza, papel, caneta, pequenos reparos. São coisas que "acabam" ou "gastam".',
    icone: <Banknote className="w-5 h-5" />,
    letra: 'C'
  },
  {
    termo: 'Empenho',
    explicacao: 'Quando o governo "reserva" o dinheiro pra mandar pra escola. É como uma promessa: "esse valor vai ser liberado pra vocês".',
    icone: <PiggyBank className="w-5 h-5" />,
    letra: 'E'
  },
  {
    termo: 'FNDE',
    explicacao: 'Fundo Nacional de Desenvolvimento da Educação. É o órgão do governo federal que manda o dinheiro pra escola. Pense nele como o "banco" que libera as verbas.',
    icone: <Building2 className="w-5 h-5" />,
    letra: 'F'
  },
  {
    termo: 'IDEB',
    explicacao: 'Índice de Desenvolvimento da Educação Básica. É a "nota" da sua escola, calculada com base na aprovação dos alunos e nas provas do Saeb. Vai de 0 a 10.',
    icone: <GraduationCap className="w-5 h-5" />,
    letra: 'I'
  },
  {
    termo: 'INEP',
    explicacao: 'Instituto Nacional de Estudos e Pesquisas Educacionais. É quem faz o Censo Escolar e calcula o IDEB. Cada escola tem um código INEP de 8 números.',
    icone: <School className="w-5 h-5" />,
    letra: 'I'
  },
  {
    termo: 'Licitação',
    explicacao: 'Processo de compra que segue regras públicas pra garantir o melhor preço. Pra compras com dinheiro do PDDE, em geral basta pesquisa de preço (3 orçamentos).',
    icone: <Gavel className="w-5 h-5" />,
    letra: 'L'
  },
  {
    termo: 'Nota Fiscal',
    explicacao: 'Documento que comprova a compra. Toda compra feita com dinheiro público PRECISA de nota fiscal — sem ela, a prestação de contas não é aprovada.',
    icone: <Receipt className="w-5 h-5" />,
    letra: 'N'
  },
  {
    termo: 'PAR',
    explicacao: 'Plano de Ações Articuladas. É o plano que o município faz junto com o MEC. Algumas verbas dependem do PAR estar atualizado.',
    icone: <ClipboardList className="w-5 h-5" />,
    letra: 'P'
  },
  {
    termo: 'PDDEWeb',
    explicacao: 'Sistema online do FNDE onde você faz a prestação de contas do PDDE. É pelo site pddeinterativo.mec.gov.br.',
    icone: <Laptop className="w-5 h-5" />,
    letra: 'P'
  },
  {
    termo: 'Pesquisa de Preço',
    explicacao: 'Antes de comprar, você precisa pegar pelo menos 3 orçamentos de fornecedores diferentes. Isso prova que você escolheu o melhor preço.',
    icone: <Search className="w-5 h-5" />,
    letra: 'P'
  },
  {
    termo: 'Plano de Aplicação',
    explicacao: 'Documento onde você lista TUDO que pretende comprar com o dinheiro recebido. É como uma "lista de compras" aprovada pelo Conselho Escolar.',
    icone: <FileSignature className="w-5 h-5" />,
    letra: 'P'
  },
  {
    termo: 'Prestação de Contas',
    explicacao: 'Documentos que você manda pro governo mostrando como o dinheiro foi usado. É como um "recibo" de tudo que comprou e pagou.',
    icone: <FileCheck className="w-5 h-5" />,
    letra: 'P'
  },
  {
    termo: 'Pregão',
    explicacao: 'Tipo de licitação. Pra valores maiores, a compra precisa ser por pregão. No PDDE básico, geralmente não precisa — basta a pesquisa de preço.',
    icone: <Gavel className="w-5 h-5" />,
    letra: 'P'
  },
  {
    termo: 'Repasse',
    explicacao: 'Quando o dinheiro sai do governo e cai na conta da escola. Também chamado de "transferência" ou "liberação".',
    icone: <Coins className="w-5 h-5" />,
    letra: 'R'
  },
  {
    termo: 'Saldo',
    explicacao: 'Dinheiro que sobrou na conta e não foi usado. Atenção: saldo alto pode significar que a escola não está usando o recurso — e isso pode gerar problemas na prestação de contas.',
    icone: <CircleDollarSign className="w-5 h-5" />,
    letra: 'S'
  },
  {
    termo: 'SIGPC',
    explicacao: 'Sistema de Gestão de Prestação de Contas. É o sistema online onde você envia a prestação de contas do PDDE pro FNDE.',
    icone: <Laptop className="w-5 h-5" />,
    letra: 'S'
  },
  {
    termo: 'TCE',
    explicacao: 'Tribunal de Contas do Estado. É o órgão que fiscaliza se o dinheiro público está sendo usado direitinho. Pode auditar as contas da escola.',
    icone: <ShieldCheck className="w-5 h-5" />,
    letra: 'T'
  },
  {
    termo: 'Tombamento',
    explicacao: 'Registrar os bens comprados com dinheiro público. Todo equipamento (computador, ventilador etc.) precisa receber uma etiqueta com número de patrimônio.',
    icone: <Package className="w-5 h-5" />,
    letra: 'T'
  },
  {
    termo: 'UEx',
    explicacao: 'Unidade Executora. É a entidade que recebe e gerencia o dinheiro em nome da escola. Geralmente é a APM (Associação de Pais e Mestres) ou o Conselho Escolar.',
    icone: <Users className="w-5 h-5" />,
    letra: 'U'
  },
  {
    termo: 'Verba de Custeio e Capital',
    explicacao: 'O dinheiro do PDDE vem dividido: parte é pra custeio (material do dia a dia) e parte é pra capital (bens permanentes). Você NÃO pode misturar.',
    icone: <Scale className="w-5 h-5" />,
    letra: 'V'
  }
];

interface Programa {
  id: string;
  nome: string;
  sigla: string;
  descricao: string;
  icone: React.ReactNode;
  cor: string;
  corFundo: string;
  corBorda: string;
  destaque?: string;
  subprogramas?: Array<{
    id: string;
    nome: string;
    descricao: string;
    icone: React.ReactNode;
  }>;
}

const PROGRAMAS: Programa[] = [
  {
    id: 'pdde-basico',
    nome: 'PDDE Básico',
    sigla: 'PDDE',
    descricao: 'Dinheiro que vai direto pra conta da escola pra você usar em material, manutenção e melhorias. É o "arroz com feijão" dos recursos - toda escola pública recebe.',
    icone: <Coins className="w-6 h-6" />,
    cor: 'text-emerald-700',
    corFundo: 'bg-emerald-50',
    corBorda: 'border-emerald-200',
    destaque: 'Mais usado',
    subprogramas: undefined
  },
  {
    id: 'acoes-integradas',
    nome: 'Ações Integradas do PDDE',
    sigla: 'PDDE Qualidade',
    descricao: 'São verbas extras do PDDE pra projetos específicos. Cada ação tem regras próprias sobre o que pode comprar. A escola precisa aderir a cada uma.',
    icone: <Sparkles className="w-6 h-6" />,
    cor: 'text-violet-700',
    corFundo: 'bg-violet-50',
    corBorda: 'border-violet-200',
    subprogramas: [
      {
        id: 'educacao-integral',
        nome: 'Educação Integral',
        descricao: 'Pra escolas com jornada ampliada - comprar materiais e equipamentos pro contraturno',
        icone: <GraduationCap className="w-5 h-5" />
      },
      {
        id: 'escola-acessivel',
        nome: 'Escola Acessível',
        descricao: 'Adaptar a escola pra alunos com deficiência - rampas, banheiros, sinalização',
        icone: <Accessibility className="w-5 h-5" />
      },
      {
        id: 'mais-alfabetizacao',
        nome: 'Mais Alfabetização',
        descricao: 'Materiais e recursos pra turmas de 1º e 2º ano do fundamental',
        icone: <BookMarked className="w-5 h-5" />
      },
      {
        id: 'escola-conectada',
        nome: 'Escola Conectada',
        descricao: 'Equipamentos de informática e infraestrutura de internet',
        icone: <Laptop className="w-5 h-5" />
      },
      {
        id: 'educacao-campo',
        nome: 'Educação do Campo',
        descricao: 'Recursos específicos pra escolas rurais, quilombolas e indígenas',
        icone: <TreePine className="w-5 h-5" />
      },
      {
        id: 'novo-ensino-medio',
        nome: 'Novo Ensino Médio',
        descricao: 'Implementação dos itinerários formativos e laboratórios',
        icone: <Palette className="w-5 h-5" />
      }
    ]
  },
  {
    id: 'pnae',
    nome: 'Alimentação Escolar',
    sigla: 'PNAE',
    descricao: 'Verba pra merenda! Mas atenção: quem gerencia geralmente é a prefeitura ou estado. A escola participa do cardápio e da fiscalização.',
    icone: <Utensils className="w-6 h-6" />,
    cor: 'text-orange-700',
    corFundo: 'bg-orange-50',
    corBorda: 'border-orange-200',
    destaque: 'Gestão compartilhada'
  },
  {
    id: 'pnate',
    nome: 'Transporte Escolar',
    sigla: 'PNATE',
    descricao: 'Dinheiro pro transporte dos alunos da zona rural até a escola. Geralmente fica com o município, mas a escola pode ajudar na fiscalização.',
    icone: <Bus className="w-6 h-6" />,
    cor: 'text-sky-700',
    corFundo: 'bg-sky-50',
    corBorda: 'border-sky-200',
    destaque: 'Zona rural'
  }
];

function GlossarioSection() {
  const [expanded, setExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeLetra, setActiveLetra] = useState<string | null>(null);

  const letrasDisponiveis = useMemo(() => {
    const letraSet = new Set(GLOSSARIO.map(g => g.letra));
    const letras = Array.from(letraSet);
    return letras.sort();
  }, []);

  const termosFiltrados = useMemo(() => {
    let filtered = GLOSSARIO;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(g =>
        g.termo.toLowerCase().includes(term) ||
        g.explicacao.toLowerCase().includes(term)
      );
    }
    if (activeLetra) {
      filtered = filtered.filter(g => g.letra === activeLetra);
    }
    return filtered;
  }, [searchTerm, activeLetra]);

  const termosAgrupados = useMemo(() => {
    const grupos: Record<string, typeof GLOSSARIO> = {};
    termosFiltrados.forEach(g => {
      if (!grupos[g.letra]) grupos[g.letra] = [];
      grupos[g.letra].push(g);
    });
    return grupos;
  }, [termosFiltrados]);

  const isFiltering = searchTerm.trim() !== '' || activeLetra !== null;
  const termosVisiveis = isFiltering ? termosFiltrados : (expanded ? GLOSSARIO : GLOSSARIO.slice(0, 6));

  return (
    <div className="bg-gradient-to-br from-emerald-50/80 to-green-50/50 rounded-2xl border border-emerald-200/50 overflow-hidden">
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <BookText className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="font-bold text-xl text-emerald-900">Glossário: Palavras que você vai encontrar</h2>
            <p className="text-sm text-emerald-700">
              {GLOSSARIO.length} termos explicados em linguagem simples
            </p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
          <Input
            placeholder="Buscar termo... (ex: prestação de contas)"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (e.target.value.trim()) setActiveLetra(null);
            }}
            className="pl-10 bg-white border-emerald-200 focus:border-emerald-400 rounded-xl"
            data-testid="input-glossario-search"
          />
        </div>

        <div className="flex flex-wrap gap-1 mt-3">
          {letrasDisponiveis.map(letra => (
            <button
              key={letra}
              onClick={() => {
                setActiveLetra(activeLetra === letra ? null : letra);
                setSearchTerm('');
              }}
              className={cn(
                "w-8 h-8 rounded-lg text-sm font-bold transition-all flex items-center justify-center",
                activeLetra === letra
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
              )}
              data-testid={`btn-letra-${letra}`}
            >
              {letra}
            </button>
          ))}
          {(activeLetra || searchTerm) && (
            <button
              onClick={() => { setActiveLetra(null); setSearchTerm(''); }}
              className="h-8 px-3 rounded-lg text-xs font-medium bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-all flex items-center gap-1"
              data-testid="btn-limpar-filtro"
            >
              Limpar filtro
            </button>
          )}
        </div>
      </div>

      <div className="px-6 pb-2">
        {isFiltering && termosFiltrados.length === 0 && (
          <div className="text-center py-8 text-emerald-600">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="font-medium">Nenhum termo encontrado</p>
            <p className="text-sm text-emerald-500">Tente buscar por outra palavra</p>
          </div>
        )}

        {isFiltering ? (
          Object.entries(termosAgrupados).sort(([a], [b]) => a.localeCompare(b)).map(([letra, termos]) => (
            <div key={letra} className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-sm">
                  {letra}
                </span>
                <div className="flex-1 h-px bg-emerald-200" />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {termos.map((item) => (
                  <div
                    key={item.termo}
                    className="bg-white/80 rounded-xl p-4 border border-emerald-100 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0 text-emerald-600">
                        {item.icone}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-emerald-900 mb-1">{item.termo}</h4>
                        <p className="text-sm text-emerald-700/80 leading-relaxed">{item.explicacao}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {termosVisiveis.map((item, idx) => (
              <motion.div
                key={item.termo}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="bg-white/80 rounded-xl p-4 border border-emerald-100 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0 text-emerald-600">
                    {item.icone}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-emerald-900 mb-1">{item.termo}</h4>
                    <p className="text-sm text-emerald-700/80 leading-relaxed">{item.explicacao}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {!isFiltering && (
        <div className="p-4 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100/50 w-full"
            data-testid="toggle-glossario"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-2" />
                Mostrar menos
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                Ver todos os {GLOSSARIO.length} termos
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

function ComoFuncionaSection() {
  const etapas = [
    {
      numero: 1,
      titulo: 'O dinheiro chega',
      descricao: 'O FNDE libera a verba e ela cai direto na conta da UEx (geralmente APM ou Conselho Escolar).',
      icone: <Banknote className="w-5 h-5" />,
      cor: 'bg-emerald-100 text-emerald-700'
    },
    {
      numero: 2,
      titulo: 'O Conselho decide',
      descricao: 'Vocês se reúnem pra decidir o que comprar. Tudo precisa estar no plano de aplicação.',
      icone: <Users className="w-5 h-5" />,
      cor: 'bg-sky-100 text-sky-700'
    },
    {
      numero: 3,
      titulo: 'Você compra',
      descricao: 'Faz a pesquisa de preços, escolhe o fornecedor e realiza a compra seguindo as regras.',
      icone: <FileText className="w-5 h-5" />,
      cor: 'bg-violet-100 text-violet-700'
    },
    {
      numero: 4,
      titulo: 'Guarda os documentos',
      descricao: 'Nota fiscal, comprovante de pagamento, ata - tudo organizado por programa e ano.',
      icone: <Folder className="w-5 h-5" />,
      cor: 'bg-orange-100 text-orange-700'
    },
    {
      numero: 5,
      titulo: 'Presta contas',
      descricao: 'No prazo, você envia os documentos pro FNDE mostrando como usou cada centavo.',
      icone: <FileCheck className="w-5 h-5" />,
      cor: 'bg-rose-100 text-rose-700'
    }
  ];

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl border border-slate-200/50 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center">
          <MessageCircleQuestion className="w-5 h-5 text-slate-600" />
        </div>
        <div>
          <h2 className="font-bold text-xl text-slate-800">Como funciona na prática?</h2>
          <p className="text-sm text-slate-600">O caminho do dinheiro em 5 passos simples</p>
        </div>
      </div>
      
      <div className="relative">
        <div className="absolute left-[22px] top-8 bottom-8 w-0.5 bg-slate-200 hidden sm:block" />
        
        <div className="space-y-4">
          {etapas.map((etapa, idx) => (
            <motion.div
              key={etapa.numero}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex items-start gap-4"
            >
              <div className={cn(
                "w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 relative z-10",
                etapa.cor
              )}>
                {etapa.icone}
              </div>
              <div className="flex-1 bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-slate-400">Passo {etapa.numero}</span>
                </div>
                <h4 className="font-semibold text-slate-800 mb-1">{etapa.titulo}</h4>
                <p className="text-sm text-slate-600">{etapa.descricao}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProgramaCard({ programa }: { programa: Programa }) {
  const [expanded, setExpanded] = useState(false);
  const hasSubprogramas = programa.subprogramas && programa.subprogramas.length > 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      <Card className={cn(
        "overflow-hidden transition-all duration-300 border-2",
        programa.corBorda,
        "hover:shadow-lg"
      )}>
        <div className={cn("absolute top-0 left-0 right-0 h-1.5", programa.corFundo.replace('50', '400'))} />
        
        <CardContent className="p-0">
          <div className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0",
                programa.corFundo,
                programa.cor
              )}>
                {programa.icone}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Badge variant="outline" className={cn("font-mono text-xs", programa.corBorda, programa.cor)}>
                    {programa.sigla}
                  </Badge>
                  {programa.destaque && (
                    <Badge className={cn("text-xs", programa.corFundo, programa.cor, "border-0")}>
                      {programa.destaque}
                    </Badge>
                  )}
                </div>
                <h3 className="font-bold text-xl text-foreground">{programa.nome}</h3>
              </div>
            </div>
            
            <p className="text-muted-foreground leading-relaxed mb-4">
              {programa.descricao}
            </p>
            
            <div className="flex items-center gap-3 flex-wrap">
              <Link href={`/programas/${programa.id}`}>
                <Button 
                  variant="outline" 
                  size="sm"
                  className={cn("group", programa.corBorda)}
                  data-testid={`ver-regras-${programa.id}`}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Ver Regras
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              
              {hasSubprogramas && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpanded(!expanded)}
                  className={programa.cor}
                  data-testid={`expandir-${programa.id}`}
                >
                  {expanded ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-2" />
                      Fechar ações
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-2" />
                      Ver {programa.subprogramas?.length} ações
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
          
          <AnimatePresence>
            {expanded && hasSubprogramas && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className={cn("border-t p-4", programa.corBorda, programa.corFundo)}>
                  <div className="grid gap-3">
                    {programa.subprogramas?.map((sub) => (
                      <Link key={sub.id} href={`/programas/${programa.id}/${sub.id}`}>
                        <div 
                          className="bg-white/80 rounded-lg p-4 flex items-start gap-3 hover:bg-white hover:shadow-sm transition-all cursor-pointer group"
                          data-testid={`subprograma-${sub.id}`}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                            programa.corFundo,
                            programa.cor
                          )}>
                            {sub.icone}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {sub.nome}
                            </h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {sub.descricao}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function DicasRapidasSection() {
  const dicas = [
    {
      icone: <CheckCircle2 className="w-5 h-5" />,
      titulo: 'Sempre em grupo',
      descricao: 'Nunca decida sozinha. O Conselho Escolar precisa aprovar todas as compras.',
      cor: 'bg-emerald-50 border-emerald-200 text-emerald-900'
    },
    {
      icone: <AlertCircle className="w-5 h-5" />,
      titulo: 'Nada de dinheiro vivo',
      descricao: 'Todo pagamento deve sair da conta do programa direto pro fornecedor.',
      cor: 'bg-red-50 border-red-200 text-red-900'
    },
    {
      icone: <Clock className="w-5 h-5" />,
      titulo: 'De olho no prazo',
      descricao: 'A prestação de contas tem data certa. Anote no calendário!',
      cor: 'bg-amber-50 border-amber-200 text-amber-900'
    },
    {
      icone: <Calculator className="w-5 h-5" />,
      titulo: 'Pesquise preços',
      descricao: 'Pelo menos 3 orçamentos antes de comprar qualquer coisa.',
      cor: 'bg-sky-50 border-sky-200 text-sky-900'
    }
  ];

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {dicas.map((dica, idx) => (
        <motion.div
          key={dica.titulo}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className={cn("rounded-xl p-5 border", dica.cor)}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5 opacity-80">
              {dica.icone}
            </div>
            <div>
              <h4 className="font-semibold mb-1">{dica.titulo}</h4>
              <p className="text-sm opacity-80">{dica.descricao}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default function Programas() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-background to-background flex flex-col font-sans">
      <Navigation />
      
      <main className="flex-1">
        <div className="bg-gradient-to-br from-emerald-100/30 via-green-50/20 to-transparent py-12 border-b">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Landmark className="w-6 h-6 text-primary" />
                </div>
                <Badge variant="outline" className="border-primary/30 text-primary">
                  Verbas Federais
                </Badge>
              </div>
              
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground">
                Programas e Políticas
              </h1>
              
              <p className="text-lg text-muted-foreground leading-relaxed">
                Entenda de onde vem o dinheiro da escola, como usar cada verba, 
                e o que fazer pra prestar contas direitinho. Tudo explicado em linguagem simples!
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-10">
          <GlossarioSection />
        </div>

        <div className="container mx-auto px-4 pb-10">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <HelpCircle className="w-6 h-6 text-primary" />
            Dicas de Ouro
          </h2>
          <DicasRapidasSection />
        </div>

        <div className="container mx-auto px-4 pb-10">
          <ComoFuncionaSection />
        </div>

        <div className="container mx-auto px-4 pb-16">
          <div className="flex items-center gap-3 mb-8">
            <School className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Verbas que a Escola Gerencia</h2>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-6 mb-12">
            {PROGRAMAS.slice(0, 2).map((programa) => (
              <ProgramaCard key={programa.id} programa={programa} />
            ))}
          </div>

          <div className="flex items-center gap-3 mb-8">
            <Users className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Verbas Compartilhadas</h2>
            <Badge variant="outline" className="text-muted-foreground">
              Geridas pela Secretaria
            </Badge>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-6 mb-12">
            {PROGRAMAS.slice(2).map((programa) => (
              <ProgramaCard key={programa.id} programa={programa} />
            ))}
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-green-50/50 rounded-2xl p-8 border border-emerald-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-xl text-emerald-900 mb-2">Por onde começar?</h3>
                <p className="text-emerald-700 mb-4">
                  O PDDE Básico é o programa mais importante pra diretora. É ele que você vai usar no dia a dia 
                  pra comprar material de consumo, fazer pequenos reparos e manter a escola funcionando. 
                  Comece por ele e depois explore os outros!
                </p>
                <Link href="/programas/pdde-basico">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" data-testid="comecar-pdde">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Conhecer o PDDE Básico
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
