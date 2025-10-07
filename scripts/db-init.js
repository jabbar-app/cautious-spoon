// scripts/db-init.js
/* Cross-platform DB init runner for Prisma + RBAC seed
 * Usage:
 *   npm run db:init:fresh   # first-time baseline in an environment
 *   npm run db:init         # thereafter: deploy > generate > seed
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const ROOT = process.cwd();
const prismaDir = path.join(ROOT, 'prisma');
const migrationsDir = path.join(prismaDir, 'migrations');
const initDir = path.join(migrationsDir, '000_init');
const initSql = path.join(initDir, 'migration.sql');

const isFresh = process.argv.includes('--fresh');
const dbUrl = process.env.DATABASE_URL;

function banner(msg) {
  console.log(`\n════════════════════════════════════════════════════\n▶ ${msg}\n════════════════════════════════════════════════════`);
}

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { stdio: 'inherit', shell: true, ...opts });
  if (res.status !== 0) {
    throw new Error(`Command failed: ${cmd} ${args.join(' ')}`);
  }
}

function runAllow(cmd, args, patterns = []) {
  const res = spawnSync(cmd, args, { shell: true, encoding: 'utf8' });
  process.stdout.write(res.stdout || '');
  process.stderr.write(res.stderr || '');
  if (res.status !== 0) {
    const out = (res.stdout || '') + (res.stderr || '');
    const ok = patterns.some((p) => out.includes(p));
    if (!ok) throw new Error(`Command failed: ${cmd} ${args.join(' ')}`);
  }
}

(async () => {
  try {
    if (!dbUrl) {
      console.error('ERROR: DATABASE_URL is not set. Put it in .env or export it before running.');
      process.exit(1);
    }

    if (isFresh) {
      // 1) Write/overwrite baseline 000_init from the live DB
      banner('Generating baseline migration 000_init from current database');
      if (!fs.existsSync(initDir)) fs.mkdirSync(initDir, { recursive: true });
      run('npx', [
        'prisma',
        'migrate',
        'diff',
        '--from-empty',
        '--to-url',
        dbUrl,
        '--script',
        '--output',
        initSql,
      ]);

      // 2) Mark the baseline as applied (tolerate "already recorded")
      banner('Marking 000_init as applied');
      runAllow('npx', ['prisma', 'migrate', 'resolve', '--applied', '000_init'], [
        'is already recorded as applied',
      ]);
    } else {
      banner('Skipping baseline generation (use --fresh once per environment to create it)');
    }

    // 3) Show status
    banner('Prisma migrate status');
    run('npx', ['prisma', 'migrate', 'status']);

    // 4) Deploy migrations
    banner('Deploying migrations');
    run('npx', ['prisma', 'migrate', 'deploy']);

    // 5) Generate Prisma Client
    banner('Generating Prisma Client');
    run('npx', ['prisma', 'generate']);

    // 6) Seed RBAC (optional but recommended)
    banner('Seeding RBAC (permissions, roles, attach)');
    // If you want to ignore seed failures (e.g., duplicates), use runAllow instead.
    runAllow('npm', ['run', 'seed:rbac'], ['ERR', 'Error', 'not found']);

    banner('All done ✓');
  } catch (err) {
    console.error('\n✖ Failed:', err.message);
    process.exit(1);
  }
})();
