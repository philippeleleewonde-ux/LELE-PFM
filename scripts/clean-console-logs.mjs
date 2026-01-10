/**
 * Script de nettoyage des console.log pour production
 *
 * ATTENTION: Ce script ne supprime PAS les console.error (important pour debugging)
 * Il supprime uniquement console.log, console.warn, console.debug
 *
 * Fichiers EXCLUS (critiques pour debugging):
 * - useAuth.tsx (diagnostic auth bugs)
 * - sentry.ts (error tracking)
 * - ErrorBoundary.tsx (error handling)
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.join(__dirname, '../src');

// Fichiers à NE PAS toucher (critiques pour debugging)
const EXCLUDED_FILES = [
  'useAuth.tsx',      // Auth diagnostics
  'sentry.ts',        // Error tracking
  'ErrorBoundary.tsx', // Error handling
  'authAnalytics.ts', // Auth analytics
];

// Pattern pour trouver les console.log/warn/debug (pas error!)
const CONSOLE_PATTERNS = [
  /console\.log\([^)]*\);?\n?/g,
  /console\.warn\([^)]*\);?\n?/g,
  /console\.debug\([^)]*\);?\n?/g,
  /console\.info\([^)]*\);?\n?/g,
  // Multi-line console.log
  /console\.log\([^;]*\);?\n?/gs,
  /console\.warn\([^;]*\);?\n?/gs,
  // console.group/groupEnd
  /console\.group\([^)]*\);?\n?/g,
  /console\.groupEnd\([^)]*\);?\n?/g,
];

// Pattern plus précis pour les appels multi-lignes
const MULTILINE_CONSOLE_PATTERN = /console\.(log|warn|debug|info|group|groupEnd)\([^;]*?\);?\s*\n?/gs;

async function cleanConsoleLogs() {
  console.log('🧹 Nettoyage des console.log pour production...\n');

  // Trouver tous les fichiers TS/TSX
  const files = await glob('**/*.{ts,tsx}', {
    cwd: SRC_DIR,
    ignore: ['**/*.test.tsx', '**/*.spec.ts'],
  });

  let totalCleaned = 0;
  let filesModified = 0;

  for (const file of files) {
    const fileName = path.basename(file);

    // Ignorer les fichiers exclus
    if (EXCLUDED_FILES.includes(fileName)) {
      console.log(`⏭️  Ignoré (critique): ${file}`);
      continue;
    }

    const filePath = path.join(SRC_DIR, file);
    let content = await fs.readFile(filePath, 'utf-8');
    const originalContent = content;

    // Compter les occurrences avant
    const beforeCount = (content.match(/console\.(log|warn|debug|info|group|groupEnd)\(/g) || []).length;

    if (beforeCount === 0) continue;

    // Nettoyer les console.log
    content = content.replace(MULTILINE_CONSOLE_PATTERN, '');

    // Nettoyer les lignes vides multiples
    content = content.replace(/\n{3,}/g, '\n\n');

    if (content !== originalContent) {
      await fs.writeFile(filePath, content, 'utf-8');

      const afterCount = (content.match(/console\.(log|warn|debug|info|group|groupEnd)\(/g) || []).length;
      const removed = beforeCount - afterCount;

      console.log(`✅ ${file}: ${removed} console.log supprimés`);
      totalCleaned += removed;
      filesModified++;
    }
  }

  console.log(`\n✨ Nettoyage terminé!`);
  console.log(`   📁 Fichiers modifiés: ${filesModified}`);
  console.log(`   🗑️  Console.log supprimés: ${totalCleaned}`);
  console.log(`\n⚠️  Les console.error sont conservés pour le debugging en production`);
}

cleanConsoleLogs().catch(console.error);
