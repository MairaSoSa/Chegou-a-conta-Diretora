'use strict';
/* SISAGUA ETL — currently a STUB.
 *
 * Status: NÃO IMPLEMENTADO (bloqueado).
 * Razão: o portal opendatasus.saude.gov.br virou SPA Next.js em 2025 e
 * removeu a API CKAN pública. dados.gov.br/api exige Bearer token.
 * As URLs S3 dos CSVs SISAGUA mudam a cada release e só são visíveis após
 * autenticação ou interação JS no portal.
 *
 * Caminho recomendado: download manual do CSV mais recente em
 *   https://dados.gov.br/dados/conjuntos-dados/sisagua-controle-mensal
 * + execução offline de um script de agregação por município.
 */
async function run(pool, batchUpsert, opts) {
  const msg = 'SISAGUA não implementado nesta sessão (portal SPA + auth bloqueia automação).';
  console.warn('[sisagua] ' + msg);
  return { received: 0, inserted: 0, skipped: true, reason: msg };
}

module.exports = { run };
