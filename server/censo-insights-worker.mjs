/**
 * Worker thread para calcular insights do censo sem bloquear o event loop.
 * Recebe via workerData: { dbPath, campos, scope }
 * Envia via parentPort: { ok, payload? , error? }
 */
import { workerData, parentPort } from 'worker_threads';
import Database from 'better-sqlite3';

const { dbPath, campos, scope } = workerData;

try {
  const db = new Database(dbPath, { readonly: true });
  db.pragma('journal_mode = WAL');
  db.pragma('cache_size = -32000');

  const isBR = scope === 'BR';
  const result = {};

  for (const ano of [2024, 2025]) {
    const whereClause = isBR
      ? `ano=? AND situacao='Em Atividade'`
      : `ano=? AND upper(uf)=? AND situacao='Em Atividade'`;
    const params = isBR ? [ano] : [ano, scope];
    const selectParts = [
      `COUNT(*) as total`,
      ...campos.map(c => `SUM(CAST(COALESCE(json_extract(dados,'$.${c.key}'),0) as INTEGER)) as ${c.key}`)
    ].join(', ');
    result[ano] = db.prepare(
      `SELECT ${selectParts} FROM censo_escolar WHERE ${whereClause}`
    ).get(...params);
  }

  db.close();

  const campos_resultado = campos.map(c => {
    const v24 = result[2024];
    const v25 = result[2025];
    if (!v24?.total || !v25?.total) return null;
    const pct24 = v24[c.key] / v24.total;
    const pct25 = v25[c.key] / v25.total;
    return {
      key: c.key,
      label: c.label,
      pct_2024: Math.round(pct24 * 1000) / 10,
      pct_2025: Math.round(pct25 * 1000) / 10,
      diff_pp: Math.round((pct25 - pct24) * 1000) / 10,
      total_2024: v24[c.key],
      total_2025: v25[c.key],
      escolas_2024: v24.total,
      escolas_2025: v25.total,
    };
  }).filter(Boolean);

  parentPort.postMessage({ ok: true, payload: { scope, campos: campos_resultado } });
} catch (err) {
  parentPort.postMessage({ ok: false, error: err.message });
}
