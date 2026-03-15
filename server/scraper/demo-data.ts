/**
 * Dados financeiros fictícios para as 3 escolas demo.
 * Usados como fallback quando a API do FNDE não retorna dados
 * (escolas com INEP fictício não existem no cadastro do FNDE).
 */

import type { PddeInfo } from "./pdde";
import type { PddeSaldosResult, PddeExecFinResult } from "./sigpc";

export const DEMO_INEPS = new Set(["35000001", "31000002", "43000003"]);

interface DemoSchool {
  inep: string;
  nome: string;
  uf: string;
  municipio: string;
  co_municipio: string;
  regiao: string;
  rede: string;
  cnpj_uex: string;
  razao_social_uex: string;
  matriculas: number;
}

const SCHOOLS: Record<string, DemoSchool> = {
  "35000001": {
    inep: "35000001",
    nome: "EMEF JARDIM DAS ACÁCIAS",
    uf: "SP",
    municipio: "São Paulo",
    co_municipio: "3550308",
    regiao: "Sudeste",
    rede: "Municipal",
    cnpj_uex: "12.345.678/0001-90",
    razao_social_uex: "APM EMEF JARDIM DAS ACACIAS",
    matriculas: 504,
  },
  "31000002": {
    inep: "31000002",
    nome: "EE PROF MARIA DA CONCEIÇÃO SILVA",
    uf: "MG",
    municipio: "Belo Horizonte",
    co_municipio: "3106200",
    regiao: "Sudeste",
    rede: "Estadual",
    cnpj_uex: "23.456.789/0001-01",
    razao_social_uex: "CAIXA ESCOLAR PROF MARIA DA CONCEICAO SILVA",
    matriculas: 373,
  },
  "43000003": {
    inep: "43000003",
    nome: "EMEF ASSIS BRASIL",
    uf: "RS",
    municipio: "Porto Alegre",
    co_municipio: "4314902",
    regiao: "Sul",
    rede: "Municipal",
    cnpj_uex: "34.567.890/0001-12",
    razao_social_uex: "ASSOCIACAO DE PAIS E MESTRES EMEF ASSIS BRASIL",
    matriculas: 279,
  },
};

export function getDemoPddeInfo(inep: string, ano: number): PddeInfo | null {
  const s = SCHOOLS[inep];
  if (!s) return null;

  const valorCusteio = Math.round(s.matriculas * 22.5 * 100) / 100;
  const valorCapital = Math.round(s.matriculas * 7.5 * 100) / 100;

  return {
    ok: true,
    ano,
    co_escola: inep,
    nome_escola: s.nome,
    uf: s.uf,
    municipio: s.municipio,
    rede: s.rede,
    matriculas_total: s.matriculas,
    uex: {
      executora: s.razao_social_uex,
      cnpj: s.cnpj_uex,
      uf: s.uf,
      municipio: s.municipio,
    },
    contas: [
      {
        programa: "PDDE BÁSICO",
        banco: "Banco do Brasil",
        agencia: "1234-5",
        conta: `${12000 + parseInt(inep.slice(-4))}`,
        saldo: Math.round(valorCusteio * 0.15 * 100) / 100,
        ocorrencia: null,
      },
    ],
    situacao_uex: {
      mandato_inicio: "01/01/2024",
      mandato_fim: "31/12/2025",
      dados_cadastrais: "Regular",
      prestacao_contas: "Adimplente",
      programas_pendentes: [],
    },
    situacao_eex: {
      adesao: "Regular",
      prestacao_contas: "Adimplente",
    },
    destinacoes: [
      {
        destinacao: "PDDE BÁSICO",
        devido_custeio: valorCusteio,
        devido_capital: valorCapital,
        devido_total: valorCusteio + valorCapital,
        ajuste_custeio: 0,
        ajuste_capital: 0,
        ajuste_total: 0,
        final_devido_total: valorCusteio + valorCapital,
        pago_custeio: valorCusteio,
        pago_capital: valorCapital,
        pago_total: valorCusteio + valorCapital,
        data_ordem_pgto: `15/07/${ano}`,
      },
    ],
  };
}

export function getDemoPddeSaldos(inep: string): PddeSaldosResult | null {
  const s = SCHOOLS[inep];
  if (!s) return null;

  const base = { uf: s.uf, codigo_municipio: s.co_municipio, nome_municipio: s.municipio, co_escola: inep, no_escola: s.nome, regiao: s.regiao, localizacao: "Urbana", esfera_administrativa: s.rede, banco: "001", agencia: "1234-5", conta: `${12000 + parseInt(inep.slice(-4))}` };
  const v = s.matriculas;

  return {
    ok: true,
    saldos: [
      { ...base, an_exercicio: 2025, saldo_acumulado: Math.round(v * 22.5 * 0.12 * 100) / 100 },
      { ...base, an_exercicio: 2024, saldo_acumulado: Math.round(v * 22.5 * 0.08 * 100) / 100 },
      { ...base, an_exercicio: 2023, saldo_acumulado: Math.round(v * 20.0 * 0.06 * 100) / 100 },
    ],
    anosDisponiveis: [2025, 2024, 2023],
    fonte: "olinda-pdde-basico",
  };
}

export function getDemoPddeExecFin(inep: string): PddeExecFinResult | null {
  const s = SCHOOLS[inep];
  if (!s) return null;

  const base = {
    sg_uf: s.uf,
    no_municipio: s.municipio,
    co_municipio_ibge: s.co_municipio,
    co_escola: inep,
    no_escola: s.nome,
    qt_alunos: s.matriculas,
    no_esfera_adm: s.rede,
    no_regiao: s.regiao,
    localizacao: "Urbana",
    cnpj_uex: s.cnpj_uex,
    no_uex: s.razao_social_uex,
    no_cargo: "Presidente",
    dt_ini_vinculacao: "01/01/2024",
    ds_programa_fnde: "PDDE BÁSICO",
  };

  const anos = [2024, 2023, 2022];
  const repasses = anos.flatMap((ano) => {
    const fator = { 2024: 1.0, 2023: 0.94, 2022: 0.90 }[ano] ?? 1.0;
    const c = Math.round(s.matriculas * 22.5 * fator * 100) / 100;
    const k = Math.round(s.matriculas * 7.5 * fator * 100) / 100;
    return [
      { ...base, an_exercicio: ano, sg_destinacao: "Custeio", vl_pago_custeio: c, vl_pago_capital: 0, vl_pago_total: c },
      { ...base, an_exercicio: ano, sg_destinacao: "Capital", vl_pago_custeio: 0, vl_pago_capital: k, vl_pago_total: k },
    ];
  });

  return {
    ok: true,
    repasses,
    anosDisponiveis: anos,
    fonte: "olinda-pdde-exec-fin",
  };
}

export function getDemoCadastral(inep: string, ano: string) {
  const s = SCHOOLS[inep];
  if (!s) return null;
  return {
    ok: true,
    total_registros: 1,
    pagina_atual: 1,
    itens: [{
      ano,
      regiao: s.regiao,
      uf: s.uf,
      municipio: s.municipio,
      cnpj_eex: null,
      codigo_escola: inep,
      escola: s.nome,
      localizacao: "Urbana",
      cnpj_uex: s.cnpj_uex,
      razao_social: s.razao_social_uex,
      ddd: s.uf === "SP" ? "11" : s.uf === "MG" ? "31" : "51",
      telefone: null,
      rede_atendimento: s.rede,
      mandato_dirigente: "Regular",
      data_fim_mandato: "31/12/2025",
      data_atualizacao: "01/03/2025",
      hora_atualizacao: "08:00",
    }],
  };
}

export function getDemoPrestacaoConta(inep: string, ano: string) {
  const s = SCHOOLS[inep];
  if (!s) return null;
  const valorCusteio = Math.round(s.matriculas * 22.5 * 100) / 100;
  const valorCapital = Math.round(s.matriculas * 7.5 * 100) / 100;
  return {
    ok: true,
    disponivel: true,
    total_registros: 1,
    pagina_atual: 1,
    itens: [{
      ano,
      programa: "PDDE BÁSICO",
      regiao: s.regiao,
      uf: s.uf,
      municipio: s.municipio,
      razao_social_eex: null,
      cnpj_eex: null,
      situacao_pc_eex: "Adimplente",
      suspensao_eex: "Não",
      escola: s.nome,
      codigo_escola: inep,
      cnpj_uex: s.cnpj_uex,
      situacao_pc_uex: "Adimplente",
      suspensao_uex: "Não",
      valor_previsto: `R$ ${(valorCusteio + valorCapital).toFixed(2).replace(".", ",")}`,
    }],
  };
}

export function getDemoAtendimento(inep: string, ano: string) {
  const s = SCHOOLS[inep];
  if (!s) return null;
  const c = Math.round(s.matriculas * 22.5 * 100) / 100;
  const k = Math.round(s.matriculas * 7.5 * 100) / 100;
  return {
    ok: true,
    disponivel: true,
    total_registros: 1,
    pagina_atual: 1,
    itens: [{
      ano,
      regiao: s.regiao,
      uf: s.uf,
      municipio: s.municipio,
      codigo_municipio_ibge: s.co_municipio,
      cnpj_eex: null,
      escola: s.nome,
      codigo_escola: inep,
      rede_atendimento: s.rede,
      qtd_alunos: String(s.matriculas),
      cnpj_uex: s.cnpj_uex,
      razao_social_uex: s.razao_social_uex,
      programa: "PDDE BÁSICO",
      destinacao: "Custeio e Capital",
      valor_custeio: c,
      valor_capital: k,
      valor_total: c + k,
      data_ordem_pgto: `15/07/${ano}`,
    }],
  };
}
