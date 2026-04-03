#!/usr/bin/env node
/**
 * Valida a integridade do build
 * Previne problemas comuns que quebram quando mudanças são feitas
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const REQUIRED_FILES = [
  'dist/bootstrap.cjs',
  'dist/index.cjs',
  'dist/pdde-fields-extension.cjs',
  'dist/public/index.html',
  'dist/public/favicon.svg',
  'dist/public/favicon.png',
  '.env',
];

const FORBIDDEN_PATTERNS = [
  /dist\/public\/assets\/.*-v[0-9]\.js$/,  // versioned assets
  /dist\/public\/assets\/.*-final\.js$/,   // final versions
  /dist\/public\/assets\/.*\.bak$/,        // backups
  /dist\/.*\.bak/,                        // all backups
];

const warnings = [];
const errors = [];

// 1. Verificar arquivos obrigatórios
console.log('🔍 Validando arquivos obrigatórios...');
for (const file of REQUIRED_FILES) {
  const fullPath = path.join(ROOT, file);
  if (!fs.existsSync(fullPath)) {
    errors.push(`❌ Arquivo obrigatório faltando: ${file}`);
  } else {
    const stat = fs.statSync(fullPath);
    const sizeKB = (stat.size / 1024).toFixed(1);
    console.log(`   ✓ ${file} (${sizeKB}KB)`);
  }
}

// 2. Verificar padrões proibidos
console.log('\n📦 Verificando assets legados...');
const assetsDir = path.join(ROOT, 'dist/public/assets');
if (fs.existsSync(assetsDir)) {
  const files = fs.readdirSync(assetsDir);
  let foundLegacy = false;
  
  for (const file of files) {
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.test(file)) {
        warnings.push(`⚠️  Asset legado encontrado: ${file}`);
        foundLegacy = true;
      }
    }
  }
  
  if (!foundLegacy) {
    console.log('   ✓ Nenhum asset legado encontrado');
  }
}

// 3. Verificar .env
console.log('\n⚙️  Validando configuração...');
const envPath = path.join(ROOT, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  
  if (!envContent.includes('DATABASE_URL')) {
    errors.push('❌ Variável DATABASE_URL não configurada em .env');
  } else if (envContent.includes('file:./dev.db')) {
    warnings.push('⚠️  DATABASE_URL ainda usa SQLite local (dev.db) em vez de PostgreSQL');
  } else {
    console.log('   ✓ DATABASE_URL configurado com PostgreSQL');
  }
  
  if (envContent.includes('NODE_ENV=development')) {
    console.log('   ⚠️  NODE_ENV=development (usar production em deploy)');
  }
} else {
  errors.push('❌ Arquivo .env não encontrado');
}

// 4. Estatísticas
console.log('\n📊 Estatísticas do Build:');
const distSize = getDirSize(path.join(ROOT, 'dist'));
console.log(`   - Tamanho total dist/: ${(distSize / 1024 / 1024).toFixed(2)}MB`);

const assetCount = fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir).length : 0;
console.log(`   - Arquivos em assets/: ${assetCount}`);

// 5. Summary
console.log('\n' + '='.repeat(60));
if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ Build validado com sucesso!');
  process.exit(0);
} else {
  if (warnings.length > 0) {
    console.log('\n⚠️  AVISOS:');
    warnings.forEach(w => console.log(w));
  }
  if (errors.length > 0) {
    console.log('\n❌ ERROS:');
    errors.forEach(e => console.log(e));
    process.exit(1);
  }
}

/**
 * Calcula tamanho total de um diretório recursivamente
 */
function getDirSize(dir) {
  let size = 0;
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const path2 = path.join(dir, file);
      const stat = fs.statSync(path2);
      if (stat.isDirectory()) {
        size += getDirSize(path2);
      } else {
        size += stat.size;
      }
    }
  } catch (e) {
    // diretório não existe
  }
  return size;
}
