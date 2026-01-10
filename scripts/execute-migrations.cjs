#!/usr/bin/env node
/**
 * Script d'exécution automatique des migrations Supabase
 * Corrige toutes les erreurs détectées par elite-backend-architect
 *
 * Date: 2025-11-15
 * Author: elite-saas-developer
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration Supabase
const SUPABASE_PROJECT_ID = 'yhidlozgpvzsroetjxqb';
const SUPABASE_URL = 'https://yhidlozgpvzsroetjxqb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloaWRsb3pncHZ6c3JvZXRqeHFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MDQzMzEsImV4cCI6MjA3NzQ4MDMzMX0.wwPm1EXQeHTwFIN7BeglwD2-QvTBSpwckazUvLEA4fg';

// Migrations à exécuter dans l'ordre
const MIGRATIONS = [
  {
    name: 'Migration 1: Fix app_role enum',
    file: '20251115000001_fix_app_role_enum.sql',
    verification: `SELECT unnest(enum_range(NULL::app_role))::text`,
    expectedCount: 6
  },
  {
    name: 'Migration 2: Secure multi-tenant',
    file: '20251115000002_secure_multi_tenant.sql',
    verification: `SELECT COUNT(*) as orphaned FROM profiles WHERE company_id IS NULL`,
    expectedCount: 0
  },
  {
    name: 'Migration 3: Enable RLS',
    file: '20251115000003_enable_rls_policies.sql',
    verification: `SELECT COUNT(*) as policies FROM pg_policies WHERE schemaname = 'public'`,
    expectedMinimum: 15
  }
];

/**
 * Exécute une requête SQL via l'API REST Supabase
 */
function executeSql(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });

    const options = {
      hostname: `${SUPABASE_PROJECT_ID}.supabase.co`,
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const result = JSON.parse(body);
            resolve(result);
          } catch (e) {
            resolve({ success: true, raw: body });
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

/**
 * Lit un fichier SQL
 */
function readMigrationFile(filename) {
  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  const filepath = path.join(migrationsDir, filename);

  if (!fs.existsSync(filepath)) {
    throw new Error(`Migration file not found: ${filepath}`);
  }

  return fs.readFileSync(filepath, 'utf8');
}

/**
 * Exécute une migration et vérifie le résultat
 */
async function executeMigration(migration) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🚀 ${migration.name}`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    // Lire le fichier SQL
    console.log(`📖 Lecture du fichier: ${migration.file}`);
    const sql = readMigrationFile(migration.file);
    console.log(`   ✅ ${sql.split('\n').length} lignes SQL chargées\n`);

    // Exécuter la migration
    console.log(`⚙️  Exécution de la migration...`);

    // IMPORTANT: L'API REST Supabase ne permet pas d'exécuter du DDL directement
    // On doit passer par psql ou le Dashboard SQL Editor
    console.log(`\n⚠️  ATTENTION: Cette migration doit être exécutée manuellement via:`);
    console.log(`   1. Supabase Dashboard → SQL Editor`);
    console.log(`   2. Copier-coller le contenu de: supabase/migrations/${migration.file}`);
    console.log(`   3. Cliquer sur "Run"\n`);

    // Pour l'instant, on simule et demande confirmation manuelle
    console.log(`📋 Contenu de la migration à exécuter:`);
    console.log(`${'─'.repeat(80)}`);
    console.log(sql.substring(0, 500) + '...\n');

    return {
      success: false,
      message: 'Migration non exécutée - requiert exécution manuelle via Dashboard',
      migration: migration.name
    };

  } catch (error) {
    console.error(`❌ Erreur lors de l'exécution:`, error.message);
    return {
      success: false,
      error: error.message,
      migration: migration.name
    };
  }
}

/**
 * Point d'entrée principal
 */
async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                                                                            ║
║     🔧 EXÉCUTION AUTOMATIQUE DES MIGRATIONS SUPABASE 🔧                    ║
║                                                                            ║
║     Correction de toutes les erreurs elite-backend-architect              ║
║     Projet: yhidlozgpvzsroetjxqb                                          ║
║     Date: ${new Date().toISOString()}                             ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝
`);

  console.log(`\n⚠️  LIMITATION TECHNIQUE DÉTECTÉE\n`);
  console.log(`L'API REST Supabase ne permet pas d'exécuter du DDL (CREATE, ALTER, etc.)`);
  console.log(`Les migrations doivent être exécutées via le SQL Editor du Dashboard.\n`);

  console.log(`📖 INSTRUCTIONS D'EXÉCUTION MANUELLE:\n`);
  console.log(`1. Ouvrir: https://supabase.com/dashboard/project/yhidlozgpvzsroetjxqb`);
  console.log(`2. Naviguer vers: SQL Editor → New Query`);
  console.log(`3. Exécuter les 3 migrations dans l'ORDRE suivant:\n`);

  const results = [];

  for (const migration of MIGRATIONS) {
    const result = await executeMigration(migration);
    results.push(result);
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log(`📊 RÉSUMÉ DE L'EXÉCUTION`);
  console.log(`${'='.repeat(80)}\n`);

  console.log(`Total migrations à exécuter: ${MIGRATIONS.length}`);
  console.log(`\n❌ IMPORTANT: Les migrations doivent être exécutées manuellement\n`);
  console.log(`📖 Consultez: EXECUTION-MIGRATIONS-GUIDE.md pour les étapes détaillées\n`);

  console.log(`\n✅ PROCHAINES ÉTAPES:\n`);
  console.log(`1. Ouvrir Supabase Dashboard SQL Editor`);
  console.log(`2. Exécuter Migration 1 (fix app_role enum)`);
  console.log(`3. Exécuter Migration 2 (secure multi-tenant)`);
  console.log(`4. Exécuter Migration 3 (enable RLS)`);
  console.log(`5. Régénérer les types TypeScript`);
  console.log(`6. Tester avec le défi elite-backend-architect\n`);
}

main().catch(err => {
  console.error('\n❌ Erreur fatale:', err);
  process.exit(1);
});
