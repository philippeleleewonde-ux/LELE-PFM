#!/usr/bin/env node
/**
 * Script de backup manuel de la base de données Supabase
 * Date: 2025-11-15
 * Avant d'exécuter les migrations critiques
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration depuis .env
const SUPABASE_URL = 'https://yhidlozgpvzsroetjxqb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloaWRsb3pncHZ6c3JvZXRqeHFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MDQzMzEsImV4cCI6MjA3NzQ4MDMzMX0.wwPm1EXQeHTwFIN7BeglwD2-QvTBSpwckazUvLEA4fg';

// Tables critiques à sauvegarder
const TABLES = [
  'profiles',
  'companies',
  'user_roles',
  'banker_access_grants'
];

const backupDir = path.join(__dirname, '..', 'backups');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

// Créer le dossier de backup
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

console.log('🔄 Backup de la base de données Supabase...');
console.log(`📁 Dossier: ${backupDir}`);
console.log(`⏰ Timestamp: ${timestamp}\n`);

/**
 * Fait une requête GET à Supabase REST API
 */
function fetchTable(tableName) {
  return new Promise((resolve, reject) => {
    const url = `${SUPABASE_URL}/rest/v1/${tableName}?select=*`;

    const options = {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    https.get(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } catch (e) {
            reject(new Error(`Erreur parsing JSON pour ${tableName}: ${e.message}`));
          }
        } else {
          reject(new Error(`Erreur HTTP ${res.statusCode} pour ${tableName}: ${data}`));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Sauvegarde une table en JSON
 */
async function backupTable(tableName) {
  try {
    console.log(`📊 Backup de la table: ${tableName}...`);
    const data = await fetchTable(tableName);

    const filename = `${timestamp}_${tableName}.json`;
    const filepath = path.join(backupDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    console.log(`   ✅ ${data.length} lignes sauvegardées → ${filename}`);

    return { tableName, count: data.length, filepath };
  } catch (error) {
    console.error(`   ❌ Erreur: ${error.message}`);
    return { tableName, error: error.message };
  }
}

/**
 * Backup principal
 */
async function main() {
  const results = [];

  for (const table of TABLES) {
    const result = await backupTable(table);
    results.push(result);
  }

  // Créer un fichier de résumé
  const summary = {
    timestamp,
    date: new Date().toISOString(),
    tables: results,
    totalRecords: results.reduce((sum, r) => sum + (r.count || 0), 0),
    backupDir
  };

  const summaryPath = path.join(backupDir, `${timestamp}_SUMMARY.json`);
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

  console.log('\n📝 Résumé du backup:');
  console.log(`   Total tables: ${TABLES.length}`);
  console.log(`   Total lignes: ${summary.totalRecords}`);
  console.log(`   Résumé: ${summaryPath}`);

  // Créer un fichier README
  const readmePath = path.join(backupDir, `${timestamp}_README.md`);
  const readmeContent = `# Backup Base de Données Supabase

**Date**: ${new Date().toISOString()}
**Timestamp**: ${timestamp}

## Tables sauvegardées

${results.map(r => `- **${r.tableName}**: ${r.count || 'ERROR'} lignes ${r.error ? `(${r.error})` : ''}`).join('\n')}

## Total
- **Tables**: ${TABLES.length}
- **Lignes**: ${summary.totalRecords}

## Restauration

Pour restaurer depuis ce backup:

\`\`\`bash
# Depuis Supabase SQL Editor
# Supprimer les données existantes (DANGER!)
DELETE FROM profiles;
DELETE FROM user_roles;
DELETE FROM companies;
DELETE FROM banker_access_grants;

# Puis réinsérer depuis les fichiers JSON via API ou scripts
\`\`\`

## Notes

⚠️ **IMPORTANT**: Ce backup est partiel (via REST API).
Pour un backup complet (schema + data), utiliser:

\`\`\`bash
# Via Supabase Dashboard
Settings → Database → Backups → Create backup

# Ou via CLI (si installé)
supabase db dump --project-ref yhidlozgpvzsroetjxqb > backup.sql
\`\`\`

## Fichiers

${results.map(r => `- \`${timestamp}_${r.tableName}.json\``).join('\n')}
- \`${timestamp}_SUMMARY.json\`
- \`${timestamp}_README.md\`
`;

  fs.writeFileSync(readmePath, readmeContent);

  console.log(`   README: ${readmePath}`);
  console.log('\n✅ Backup terminé!');
  console.log('\n⚠️  NOTE: Ce backup est partiel (données uniquement, pas le schema).');
  console.log('   Pour un backup complet, utilisez Supabase Dashboard → Settings → Database → Backups\n');
}

main().catch(err => {
  console.error('❌ Erreur fatale:', err);
  process.exit(1);
});
