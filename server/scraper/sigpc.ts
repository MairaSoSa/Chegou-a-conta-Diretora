// ============================================================================
// SIGPC/FNDE - Sistema de Prestação de Contas
// ============================================================================
// API oficial bloqueada por WAF - usando mock data realista
// Endpoints reais: localizarPc, detalharOPC, ConferirDocumentos
// ============================================================================

// ============================================================================
// TIPOS (baseados na API real do SIGPC)
// ============================================================================

export interface SigpcPrestacaoListItem {
  pcId: number;
  processoNumero: string;
  programaNome: string;
  entidadeNome: string;
  cnpj: string;
  situacaoNome: string;
  faseNome: string;
  anoConcessao: number;
  convenioNumero?: string;
  valorConcessao: number;
}

export interface SigpcPrestacaoDetalhada {
  pcId: number;
  processoNumero: string;
  programaNome: string;
  programaCodigo: string;
  entidadeNome: string;
  cnpj: string;
  endereco: string;
  municipio: string;
  uf: string;
  situacaoNome: string;
  faseNome: string;
  anoConcessao: number;
  convenioNumero?: string;
  valorConcessao: number;
  valorLiberado: number;
  valorExecutado: number;
  saldoConta: number;
  dataInicio: string;
  dataFim: string;
  dataAprovacao?: string;
  concessaoId: number;
  parcelas: SigpcParcela[];
  dirigentes: SigpcDirigente[];
  documentos: SigpcDocumento[];
}

export interface SigpcParcela {
  parcelaId: number;
  numero: number;
  valor: number;
  dataLiberacao: string;
  situacao: string;
}

export interface SigpcDirigente {
  dirigenteId: number;
  nome: string;
  cpf: string;
  cargo: string;
  dataInicio: string;
  dataFim?: string;
  situacao: string;
}

export interface SigpcDocumento {
  documentoId: number;
  tipo: string;
  numero: string;
  dataEmissao: string;
  situacao: string;
  observacao?: string;
}

export interface SigpcHistoricoAnalise {
  historicoId: number;
  dataAnalise: string;
  analista: string;
  tipoAnalise: string;
  resultado: string;
  parecer: string;
  documentosAnalisados: string[];
}

// ============================================================================
// ENDPOINT 1: localizarPc (busca inicial)
// GET /sigpcadm/publico/json/util/localizarPc?cnpj=XXXX
// ============================================================================

export async function localizarPrestacoesPorCnpj(
  cnpj: string, 
  anoConcessao?: number
): Promise<SigpcPrestacaoListItem[]> {
  await new Promise(resolve => setTimeout(resolve, 300));

  const anos = anoConcessao ? [anoConcessao] : [2024, 2023, 2022];
  const prestacoes: SigpcPrestacaoListItem[] = [];

  anos.forEach((ano) => {
    const numPrestacoes = ano === 2024 ? 4 : ano === 2023 ? 3 : 2;
    
    for (let i = 0; i < numPrestacoes; i++) {
      const pcId = parseInt(`${ano}${i}${Math.floor(Math.random() * 10000)}`);
      
      const rand = Math.random();
      let situacaoNome: string, faseNome: string;
      if (rand < 0.6) {
        situacaoNome = "Aprovada";
        faseNome = "Concluída";
      } else if (rand < 0.85) {
        situacaoNome = "Aguardando Análise";
        faseNome = "Em análise documental";
      } else {
        situacaoNome = "Irregular";
        faseNome = "Aguardando regularização";
      }

      const programas = [
        { nome: "PDDE - Básico", codigo: "PDDE-B" },
        { nome: "PDDE - Qualidade", codigo: "PDDE-Q" },
        { nome: "PDDE - Água e Esgoto Sanitário", codigo: "PDDE-AE" },
        { nome: "PDDE - Estrutura", codigo: "PDDE-E" },
        { nome: "Novo Mais Educação", codigo: "NME" }
      ];
      
      const programa = programas[i % programas.length];

      prestacoes.push({
        pcId,
        processoNumero: `23034.${String(pcId).slice(0, 6)}/${ano}-11`,
        programaNome: programa.nome,
        entidadeNome: "UEx Escola Estadual Exemplo",
        cnpj: cnpj,
        situacaoNome,
        faseNome,
        anoConcessao: ano,
        convenioNumero: `${ano}${String(pcId).slice(-6)}`,
        valorConcessao: Math.floor(Math.random() * 50000) + 10000
      });
    }
  });

  return prestacoes;
}

// ============================================================================
// ENDPOINT 2: detalharOPC (detalhes completos)
// GET /sigpcadm/publico/json/util/detalharOPC?pcId=12345
// ============================================================================

export async function detalharPrestacao(pcId: number): Promise<SigpcPrestacaoDetalhada | null> {
  await new Promise(resolve => setTimeout(resolve, 400));

  const ano = parseInt(String(pcId).slice(0, 4));
  const programaIdx = parseInt(String(pcId).charAt(4)) || 0;
  
  const programas = [
    { nome: "PDDE - Básico", codigo: "PDDE-B" },
    { nome: "PDDE - Qualidade", codigo: "PDDE-Q" },
    { nome: "PDDE - Água e Esgoto Sanitário", codigo: "PDDE-AE" },
    { nome: "PDDE - Estrutura", codigo: "PDDE-E" },
    { nome: "Novo Mais Educação", codigo: "NME" }
  ];
  
  const programa = programas[programaIdx % programas.length];
  
  const rand = Math.random();
  let situacaoNome: string, faseNome: string, dataAprovacao: string | undefined;
  if (rand < 0.6) {
    situacaoNome = "Aprovada";
    faseNome = "Concluída";
    dataAprovacao = `${ano}-11-20`;
  } else if (rand < 0.85) {
    situacaoNome = "Aguardando Análise";
    faseNome = "Em análise documental";
  } else {
    situacaoNome = "Irregular";
    faseNome = "Aguardando regularização";
  }

  const valorConcessao = Math.floor(Math.random() * 50000) + 10000;
  const valorLiberado = situacaoNome === "Aprovada" ? valorConcessao : Math.floor(valorConcessao * 0.5);
  const valorExecutado = Math.floor(valorLiberado * 0.85);
  const saldoConta = valorLiberado - valorExecutado;

  return {
    pcId,
    processoNumero: `23034.${String(pcId).slice(0, 6)}/${ano}-11`,
    programaNome: programa.nome,
    programaCodigo: programa.codigo,
    entidadeNome: "UEx Escola Estadual Exemplo",
    cnpj: "49.263.742/0001-07",
    endereco: "Rua Exemplo, 123 - Centro",
    municipio: "Cidade Exemplo",
    uf: "SP",
    situacaoNome,
    faseNome,
    anoConcessao: ano,
    convenioNumero: `${ano}${String(pcId).slice(-6)}`,
    valorConcessao,
    valorLiberado,
    valorExecutado,
    saldoConta,
    dataInicio: `${ano}-01-15`,
    dataFim: `${ano}-12-31`,
    dataAprovacao,
    concessaoId: pcId * 10,
    parcelas: gerarParcelas(valorConcessao, situacaoNome, ano),
    dirigentes: gerarDirigentes(),
    documentos: gerarDocumentos(situacaoNome, ano)
  };
}

// ============================================================================
// ENDPOINT 3: ConferirDocumentos (histórico de análise)
// GET /sigpcadm/publico/json/conferirdocumentos/ConferirDocumentos
//     ?concessaoId=123&comando=recuperarHistoricoAnalise
// ============================================================================

export async function recuperarHistoricoAnalise(concessaoId: number): Promise<SigpcHistoricoAnalise[]> {
  await new Promise(resolve => setTimeout(resolve, 300));

  const pcId = Math.floor(concessaoId / 10);
  const ano = parseInt(String(pcId).slice(0, 4));

  const historico: SigpcHistoricoAnalise[] = [
    {
      historicoId: 1,
      dataAnalise: `${ano}-02-10`,
      analista: "Maria Silva Santos",
      tipoAnalise: "Análise Documental Inicial",
      resultado: "Aprovado",
      parecer: "Documentação completa e adequada. Todos os documentos obrigatórios foram apresentados.",
      documentosAnalisados: ["Plano de aplicação", "Estatuto da UEx", "Ata de eleição"]
    },
    {
      historicoId: 2,
      dataAnalise: `${ano}-06-15`,
      analista: "João Pedro Oliveira",
      tipoAnalise: "Análise de Prestação de Contas",
      resultado: "Aprovado com ressalvas",
      parecer: "Prestação de contas aprovada. Recomenda-se maior detalhamento nas notas fiscais.",
      documentosAnalisados: ["Extrato bancário", "Notas fiscais", "Termo de doação"]
    },
    {
      historicoId: 3,
      dataAnalise: `${ano}-11-20`,
      analista: "Ana Paula Costa",
      tipoAnalise: "Análise Final",
      resultado: "Aprovado",
      parecer: "Prestação de contas final aprovada. Recursos aplicados corretamente conforme plano aprovado.",
      documentosAnalisados: ["Relatório final", "Demonstrativo financeiro", "Fotos de comprovação"]
    }
  ];

  return historico;
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

function gerarParcelas(valorTotal: number, situacao: string, ano: number): SigpcParcela[] {
  const numParcelas = Math.floor(Math.random() * 2) + 2; // 2-3 parcelas
  const valorParcela = valorTotal / numParcelas;
  
  return Array.from({ length: numParcelas }, (_, i) => ({
    parcelaId: i + 1,
    numero: i + 1,
    valor: Math.round(valorParcela * 100) / 100,
    dataLiberacao: `${ano}-${String((i * 4) + 2).padStart(2, '0')}-15`,
    situacao: situacao === "Aprovada" ? "Liberada" : i === 0 ? "Liberada" : "Pendente"
  }));
}

function gerarDirigentes(): SigpcDirigente[] {
  return [
    {
      dirigenteId: 1,
      nome: "Maria José da Silva",
      cpf: "123.456.789-00",
      cargo: "Presidente da UEx",
      dataInicio: "2023-01-15",
      situacao: "Ativo"
    },
    {
      dirigenteId: 2,
      nome: "João Carlos Santos",
      cpf: "987.654.321-00",
      cargo: "Tesoureiro",
      dataInicio: "2023-01-15",
      situacao: "Ativo"
    },
    {
      dirigenteId: 3,
      nome: "Ana Paula Oliveira",
      cpf: "456.789.123-00",
      cargo: "Secretário",
      dataInicio: "2023-01-15",
      situacao: "Ativo"
    }
  ];
}

function gerarDocumentos(situacao: string, ano: number): SigpcDocumento[] {
  const docs: SigpcDocumento[] = [
    {
      documentoId: 1,
      tipo: "Plano de Aplicação",
      numero: `PA-${ano}-001`,
      dataEmissao: `${ano}-01-20`,
      situacao: "Aprovado"
    },
    {
      documentoId: 2,
      tipo: "Prestação de Contas",
      numero: `PC-${ano}-001`,
      dataEmissao: `${ano}-06-30`,
      situacao: situacao === "Aprovada" ? "Aprovado" : "Em análise"
    },
    {
      documentoId: 3,
      tipo: "Extrato Bancário",
      numero: `EB-${ano}-001`,
      dataEmissao: `${ano}-12-15`,
      situacao: situacao === "Aprovada" ? "Conferido" : "Pendente",
      observacao: "Extrato do período completo de execução"
    }
  ];

  if (situacao === "Aprovada") {
    docs.push({
      documentoId: 4,
      tipo: "Parecer Final",
      numero: `PF-${ano}-001`,
      dataEmissao: `${ano}-11-20`,
      situacao: "Emitido",
      observacao: "Prestação de contas aprovada sem ressalvas"
    });
  }

  return docs;
}
