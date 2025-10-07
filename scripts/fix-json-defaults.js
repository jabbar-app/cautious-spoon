#!/usr/bin/env node
/**
 * Normalize Prisma JSON defaults that were split across lines, e.g.:
 *   Json? @default("{}
 *   ")
 * → Json? @default("{}")
 * Also handles "[]" and stray empty-string defaults split across lines.
 */
const fs = require('fs');
const path = require('path');
const schemaPath = path.resolve(process.cwd(), 'prisma', 'schema.prisma');
let src = fs.readFileSync(schemaPath, 'utf8');
const orig = src;

// collapse @default("{}") split across lines/spaces
src = src.replace(/@default\(\s*"\s*\{\s*\}\s*"\s*\)/g, '@default("{}")');
// collapse @default("[]") split across lines/spaces (if any)
src = src.replace(/@default\(\s*"\s*\[\s*\]\s*"\s*\)/g, '@default("[]")');
// collapse split empty-string defaults @default("")
src = src.replace(/@default\(\s*"\s*"\s*\)/g, '@default("")');

if (src !== orig) {
  fs.writeFileSync(schemaPath, src, 'utf8');
  console.log('[ok] Normalized multiline JSON/empty-string defaults in prisma/schema.prisma');
} else {
  console.log('[skip] No multiline JSON defaults found to normalize.');
}
