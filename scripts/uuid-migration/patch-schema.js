#!/usr/bin/env node
/**
 * Patch prisma/schema.prisma to:
 * - Convert PKs with @db.VarChar(50) to UUID with default gen_random_uuid()
 * - Convert FK fields referencing those models to @db.Uuid
 * - Drop `admin_companies` model block entirely
 *
 * Safe to re-run. Logs what it changes.
 */
const fs = require('fs');
const path = require('path');

const schemaPath = path.resolve(process.cwd(), 'prisma', 'schema.prisma');
let src = fs.readFileSync(schemaPath, 'utf8');

const convertModels = new Set([
  'applications','candidates','companies','employers','job_industries',
  'job_orders','occupations','prefectures','programs','vacancies','webinars'
]);

// Drop admin_companies model (whole block)
const dropped = /\bmodel\s+admin_companies\s+\{[\s\S]*?\}\s*/g;
if (dropped.test(src)) {
  src = src.replace(dropped, '');
  console.log('[patch] Dropped model: admin_companies');
}


function guessTargetFromField(fname) {
  // Support "id_company" and "company_id"
  let base = null;
  if (fname.startsWith('id_')) base = fname.slice(3);        // id_company → company
  else if (fname.endsWith('_id')) base = fname.slice(0, -3); // vacancy_id → vacancy
  if (!base) return null;
  const variants = [base, `${base}s`, base.replace(/y$/, 'ies')];
  for (const v of variants) {
    if (convertModels.has(v)) return v;
    const singular = v.replace(/s$/, '');
    if (convertModels.has(singular)) return singular;
  }
  return null;
}

function upgradeFkFieldLine(line) {
  // Flip VarChar(50) → Uuid & strip weird defaults
  if (/@db\.VarChar\(50\)/.test(line)) {
    line = line.replace(/@db\.VarChar\(50\)/g, '@db.Uuid');
  }
  line = line.replace(/@default\(\s*"not null"\s*\)\s*/g, '')
             .replace(/@default\(\s*'not null'\s*\)\s*/g, '')
             .replace(/@default\(\s*""\s*\)\s*/g, '')
             .replace(/@default\(\s*''\s*\)\s*/g, '');
  return line;
}

function transformModel(name, block) {
  let out = block;

  if (convertModels.has(name)) {
    out = patchIdLine(out, name);
  }

  const relFkFields = collectRelationFkFields(out);

  out = out.replace(/^\s*(\w+)\s+([^\n]*?)$/mg, (line, fname, rest) => {
    const relHit = relFkFields.has(fname);
    const guess = guessTargetFromField(fname);
    const shouldFlip = (relHit || !!guess) && /@db\.VarChar\(50\)/.test(line);
    if (shouldFlip) {
      const prev = line;
      line = upgradeFkFieldLine(line);
      if (line !== prev) console.log(`[patch] FK field ${name}.${fname}: VarChar(50) -> Uuid`);
    }
    return line;
  });

  return out;
}

// --- utilities
function patchIdLine(block, modelName) {
  // Replace any "id ..." line with UUID form
  const next = block.replace(/^\s*id\s+.*@id.*$/m, (line) => {
    const indent = (line.match(/^(\s*)/) || ['',''])[1];
    return `${indent}id String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid`;
  });
  if (next !== block) console.log(`[patch] Model ${modelName}: id -> UUID`);
  return next;
}

// Capture relation-declared FK field names that point to convert models
function collectRelationFkFields(block) {
  const fkFields = new Set();
  // fieldName  typeName[?]  @relation(...)
  const relRe = /^\s*(\w+)\s+(\w+\??)\s+@relation\(([^)]*)\)/mg;
  let m;
  while ((m = relRe.exec(block))) {
    const type = m[2].replace(/\?$/, '');
    if (!convertModels.has(type)) continue;
    const args = m[3];
    const mf = /fields:\s*\[([^\]]+)\]/.exec(args);
    if (mf) mf[1].split(',').map(s=>s.trim()).forEach(f => fkFields.add(f));
  }
  return fkFields;
}

// Heuristic FKs (e.g., id_company → companies)
function isHeuristicFk(fieldName) {
  if (!fieldName.startsWith('id_')) return false;
  const tail = fieldName.slice(3);           // company
  const variants = new Set([tail, `${tail}s`, tail.replace(/y$/, 'ies')]);
  for (const v of variants) {
    if (convertModels.has(v) || convertModels.has(v.replace(/s$/, ''))) return true;
  }
  return false;
}

function upgradeFkFieldLine(fname, line) {
  // Flip @db.VarChar(50) → @db.Uuid
  if (/@db\.VarChar\(50\)/.test(line)) {
    line = line.replace(/@db\.VarChar\(50\)/g, '@db.Uuid');
  }
  // Remove oddball defaults like @default("not null") or @default("")
  line = line.replace(/@default\(\s*"not null"\s*\)\s*/g, '');
  line = line.replace(/@default\(\s*'not null'\s*\)\s*/g, '');
  line = line.replace(/@default\(\s*""\s*\)\s*/g, '');  // <-- fixed regex
  line = line.replace(/@default\(\s*''\s*\)\s*/g, '');
  return line;
}

function transformModel(name, block) {
  let out = block;

  if (convertModels.has(name)) {
    out = patchIdLine(out, name);
  }

  const fkFields = collectRelationFkFields(out);

  // Upgrade FK-typed columns by relation or heuristic
  out = out.replace(/^\s*(\w+)\s+([^\n]*?)$/mg, (line, fname, rest) => {
    if ((fkFields.has(fname) || isHeuristicFk(fname)) && /@db\.VarChar\(50\)/.test(line)) {
      const prev = line;
      line = upgradeFkFieldLine(fname, line);
      if (line !== prev) console.log(`[patch] FK field ${name}.${fname}: VarChar(50) -> Uuid`);
    }
    return line;
  });

  return out;
}

// --- main model loop
const modelRe = /\bmodel\s+(\w+)\s+\{([\s\S]*?)\}/g;
let result = '';
let lastIndex = 0;
let match;
while ((match = modelRe.exec(src))) {
  result += src.slice(lastIndex, match.index);
  const name = match[1];
  const block = match[2];
  const tblock = transformModel(name, block);
  result += `model ${name} {${tblock}}\n`;
  lastIndex = modelRe.lastIndex;
}
result += src.slice(lastIndex);

fs.writeFileSync(schemaPath, result, 'utf8');
console.log('[ok] Patched prisma/schema.prisma (UUID IDs, FK flips, admin_companies dropped).');
