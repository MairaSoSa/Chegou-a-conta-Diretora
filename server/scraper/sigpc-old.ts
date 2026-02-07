/**
 * SIGPC / FNDE - Consulta de Prestação de Contas
 * API para buscar informações sobre prestação de contas por CNPJ
 */

const BASE_URL = 'https://www.fnde.gov.br/sigpcadm';

export interface SigpcPrograma {
  id: number;
  nome: string;
  sigla?: string;
}

export interface SigpcPrestacaoContas {
  concessaoId: number;
  cnpj: string;
  entidadeNome: string;
  programaNome: string;
  programaId: number;
  anoConcessao: number;
  situacao: string;
  situacaoId: number;
  numeroConvenio?: string;
  numeroTermoCompromisso?: string;
  valorConcessao?: number;
  valorPrestado?: number;
  dataLimite?: string;
  fase?: string;
  faseId?: number;
  municipio?: string;
  uf?: string;
}

export interface SigpcConsultaResult {
  ok: boolean;
  prestacoes?: SigpcPrestacaoContas[];
  error?: string;
  totalRegistros?: number;
}

export interface SigpcProgramasResult {
  ok: boolean;
  programas?: SigpcPrograma[];
  error?: string;
}

/**
 * Consulta prestações de contas por CNPJ
 */
export async function consultarPrestacoesCnpj(
  cnpj: string,
  options?: {
    programaId?: number;
    anoConcessao?: number;
    municipioId?: number;
  }
): Promise<SigpcConsultaResult> {
  try {
    // Remove caracteres não numéricos do CNPJ
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    
    if (cnpjLimpo.length !== 14) {
      return {
        ok: false,
        error: 'CNPJ inválido. Deve conter 14 dígitos.'
      };
    }

    // TEMPORÁRIO: Retorna dados de exemplo
    // A API do FNDE está bloqueando requisições diretas (WAF)
    // Em produção, isso deveria ser feito via CORS do lado do cliente
    console.log(`[SIGPC] Gerando dados de exemplo para CNPJ: ${cnpj}`);
    
    const anoAtual = new Date().getFullYear();
    const anoFiltro = options?.anoConcessao || anoAtual - 1;
    
    // Gera dados de exemplo baseados no CNPJ e ano
    const prestacoes: SigpcPrestacaoContas[] = [];
    
    // Adiciona algumas prestações de exemplo
    for (let i = 0; i < 8; i++) {
      const ano = anoFiltro - i;
      const statusRandom = Math.random();
      let situacao = '';
      let situacaoId = 0;
      
      if (statusRandom < 0.6) {
        situacao = 'Aprovada';
        situacaoId = 1;
      } else if (statusRandom < 0.85) {
        situacao = 'Aguardando Análise';
        situacaoId = 2;
      } else {
        situacao = 'Pendente de Envio';
        situacaoId = 3;
      }
      
      prestacoes.push({
        concessaoId: 1000000 + i,
        cnpj: cnpj,
        entidadeNome: 'Unidade Executora - UEx',
        programaNome: i % 2 === 0 ? 'PDDE Básico' : 'PDDE Educação Conectada',
        programaId: i % 2 === 0 ? 1 : 5,
        anoConcessao: ano,
        situacao,
        situacaoId,
        numeroConvenio: `${ano}${String(i).padStart(6, '0')}`,
        valorConcessao: 8000 + (i * 1500),
        valorPrestado: situacaoId === 1 ? 8000 + (i * 1500) : 0,
        dataLimite: `31/03/${ano + 1}`,
        fase: situacaoId === 1 ? 'Concluída' : 'Em andamento',
        faseId: situacaoId === 1 ? 5 : 2,
        uf: 'SP',
        municipio: 'São Paulo',
      });
    }

    // Filtra por ano se especificado
    const prestacoesFiltered = options?.anoConcessao
      ? prestacoes.filter(p => p.anoConcessao === options.anoConcessao)
      : prestacoes;

    return {
      ok: true,
      prestacoes: prestacoesFiltered,
      totalRegistros: prestacoesFiltered.length,
    };

    /* CÓDIGO ORIGINAL - Comentado pois API está bloqueando
    // Monta a URL com parâmetros
    const params = new URLSearchParams({
      tipoConsulta: '2', // Consulta por CNPJ
      entidadeCnpj: cnpjLimpo,
    });

    if (options?.programaId) {
      params.append('programaId', options.programaId.toString());
    }

    if (options?.anoConcessao) {
      params.append('anoConcessao', options.anoConcessao.toString());
    }

    if (options?.municipioId) {
      params.append('municipioId', options.municipioId.toString());
    }

    const url = `${BASE_URL}/publico/json/util/localizarPc?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Dashboard Escolar/1.0)',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return {
        ok: false,
        error: `Erro HTTP: ${response.status} ${response.statusText}`
      };
    }

    const data = await response.json();

    // A API pode retornar diferentes estruturas
    // Ajustar conforme a resposta real da API
    if (Array.isArray(data)) {
      return {
        ok: true,
        prestacoes: data as SigpcPrestacaoContas[],
        totalRegistros: data.length,
      };
    } else if (data.registros && Array.isArray(data.registros)) {
      return {
        ok: true,
        prestacoes: data.registros as SigpcPrestacaoContas[],
        totalRegistros: data.totalRegistros || data.registros.length,
      };
    } else if (data.error || data.mensagem) {
      return {
        ok: false,
        error: data.error || data.mensagem || 'Erro desconhecido na API'
      };
    }

    return {
      ok: true,
      prestacoes: [],
      totalRegistros: 0,
    };
    */

  } catch (error: any) {
    return {
      ok: false,
      error: error.message || 'Erro ao consultar API do FNDE'
    };
  }
}

/**
 * Busca programas disponíveis por ano
 */
export async function consultarProgramasPorAno(ano: number): Promise<SigpcProgramasResult> {
  try {
    const url = `${BASE_URL}/publico/json/util/programaAno?anoExercicio=${ano}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Dashboard Escolar/1.0)',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return {
        ok: false,
        error: `Erro HTTP: ${response.status} ${response.statusText}`
      };
    }

    const data = await response.json();

    if (Array.isArray(data)) {
      return {
        ok: true,
        programas: data as SigpcPrograma[],
      };
    }

    return {
      ok: false,
      error: 'Formato de resposta inesperado'
    };

  } catch (error: any) {
    return {
      ok: false,
      error: error.message || 'Erro ao consultar programas'
    };
  }
}

/**
 * Busca anos disponíveis
 */
export async function consultarAnosDisponiveis(): Promise<{ ok: boolean; anos?: number[]; error?: string }> {
  try {
    const url = `${BASE_URL}/publico/json/util/anoExercicio`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Dashboard Escolar/1.0)',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return {
        ok: false,
        error: `Erro HTTP: ${response.status}`
      };
    }

    const data = await response.json();

    if (Array.isArray(data)) {
      return {
        ok: true,
        anos: data.map(item => typeof item === 'number' ? item : item.ano || item.anoExercicio).filter(Boolean),
      };
    }

    return {
      ok: false,
      error: 'Formato inesperado'
    };

  } catch (error: any) {
    return {
      ok: false,
      error: error.message || 'Erro ao consultar anos'
    };
  }
}

/**
 * Busca situações de prestação de contas
 */
export async function consultarSituacoesPc(): Promise<{ ok: boolean; situacoes?: any[]; error?: string }> {
  try {
    const url = `${BASE_URL}/publico/json/util/situacaoPc`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Dashboard Escolar/1.0)',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return {
        ok: false,
        error: `Erro HTTP: ${response.status}`
      };
    }

    const data = await response.json();
    return {
      ok: true,
      situacoes: Array.isArray(data) ? data : []
    };

  } catch (error: any) {
    return {
      ok: false,
      error: error.message
    };
  }
}

/**
 * Exporta detalhes da prestação de contas
 */
export async function exportarDetalheOpc(concessaoId: number): Promise<{ ok: boolean; url?: string; error?: string }> {
  try {
    const url = `${BASE_URL}/exportarLocalizar.pu?operation=exportarDetalheOPC&concessaoId=${concessaoId}`;
    
    return {
      ok: true,
      url: url
    };

  } catch (error: any) {
    return {
      ok: false,
      error: error.message
    };
  }
}
