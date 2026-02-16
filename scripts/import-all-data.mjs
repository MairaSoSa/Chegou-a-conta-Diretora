#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

console.log("============================================");
console.log("  Importacao Completa de Dados INEP");
console.log("============================================\n");

const ANOS_CENSO = [2020, 2021, 2022, 2023, 2024];

console.log("[1/3] Inicializando banco de dados...");
try {
  execSync('npx drizzle-kit push', { cwd: ROOT, stdio: 'inherit' });
} catch {
  console.log("  Schema ja existe ou foi criado.");
}

console.log("\n[2/3] Importando Censo Escolar...");
let censoImported = 0;
for (const ano of ANOS_CENSO) {
  const searchPaths = [
    `/tmp/inep-data/censo_${ano}/microdados_ed_basica_${ano}.csv`,
    `/tmp/inep-data/censo_${ano}/microdados_ed_basica_${ano}.CSV`,
    `/tmp/inep-data/microdados_censo_escolar_${ano}/dados/microdados_ed_basica_${ano}.csv`,
    `/tmp/inep-data/microdados_censo_escolar_${ano}/dados/microdados_ed_basica_${ano}.CSV`,
    `/tmp/inep-data/microdados_ed_basica_${ano}.csv`,
    `/tmp/inep-data/microdados_ed_basica_${ano}.CSV`,
  ];

  const found = searchPaths.find(p => fs.existsSync(p));
  if (found) {
    const sizeMB = (fs.statSync(found).size / (1024 * 1024)).toFixed(0);
    console.log(`  Importando censo ${ano} (${sizeMB}MB)...`);
    try {
      execSync(`node server/import-censo-lite.mjs ${ano}`, { cwd: ROOT, stdio: 'inherit' });
      censoImported++;
    } catch (e) {
      console.log(`  AVISO: Erro ao importar censo ${ano}`);
    }
  } else {
    console.log(`  Censo ${ano}: CSV nao encontrado. Execute: bash scripts/download-inep-data.sh ${ano}`);
  }
}

if (censoImported === 0) {
  console.log("\n  ATENCAO: Nenhum censo importado!");
  console.log("  Execute primeiro: bash scripts/download-inep-data.sh");
}

console.log("\n[3/3] Importando Indicadores Educacionais...");
console.log("  Baixando indicadores diretamente do INEP...");
console.log("  Isso pode levar alguns minutos...");
try {
  execSync('npx tsx scripts/import-indicators.ts', { cwd: ROOT, stdio: 'inherit', timeout: 600000 });
} catch (e) {
  console.log("  AVISO: Alguns indicadores podem ter falhado. Isso e normal se o INEP estiver indisponivel.");
}

console.log("\n============================================");
console.log("  Importacao concluida!");
console.log(`  Censo: ${censoImported}/${ANOS_CENSO.length} anos importados`);
console.log("  Execute: npm run dev");
console.log("============================================");
