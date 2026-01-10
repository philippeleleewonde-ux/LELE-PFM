/**
 * Script d'optimisation des images pour HCM Portal
 * Convertit les PNG lourds en WebP compressés
 */

import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ASSETS_DIR = path.join(__dirname, '../src/assets');

const IMAGES_TO_OPTIMIZE = [
  {
    input: 'lele-hcm-logo-dark.png',
    outputWebp: 'lele-hcm-logo-dark.webp',
    outputPng: 'lele-hcm-logo-dark-optimized.png',
    quality: 80,
  },
  {
    input: 'lele-hcm-logo-light.png',
    outputWebp: 'lele-hcm-logo-light.webp',
    outputPng: 'lele-hcm-logo-light-optimized.png',
    quality: 80,
  },
];

async function optimizeImages() {
  console.log('🖼️  Optimisation des images HCM Portal...\n');

  for (const img of IMAGES_TO_OPTIMIZE) {
    const inputPath = path.join(ASSETS_DIR, img.input);
    const webpPath = path.join(ASSETS_DIR, img.outputWebp);
    const pngPath = path.join(ASSETS_DIR, img.outputPng);

    try {
      // Vérifier que le fichier existe
      const stats = await fs.stat(inputPath);
      const originalSize = (stats.size / 1024).toFixed(0);

      console.log(`📄 ${img.input} (${originalSize} KB)`);

      // Convertir en WebP (meilleure compression)
      await sharp(inputPath)
        .webp({ quality: img.quality })
        .toFile(webpPath);

      const webpStats = await fs.stat(webpPath);
      const webpSize = (webpStats.size / 1024).toFixed(0);
      const webpReduction = ((1 - webpStats.size / stats.size) * 100).toFixed(0);

      console.log(`   ✅ WebP: ${webpSize} KB (-${webpReduction}%)`);

      // Créer aussi une version PNG optimisée (fallback)
      await sharp(inputPath)
        .png({ quality: img.quality, compressionLevel: 9 })
        .toFile(pngPath);

      const pngStats = await fs.stat(pngPath);
      const pngSize = (pngStats.size / 1024).toFixed(0);
      const pngReduction = ((1 - pngStats.size / stats.size) * 100).toFixed(0);

      console.log(`   ✅ PNG optimisé: ${pngSize} KB (-${pngReduction}%)\n`);

    } catch (error) {
      console.error(`   ❌ Erreur: ${error.message}\n`);
    }
  }

  console.log('✨ Optimisation terminée!');
  console.log('\n📌 Prochaine étape: Mettre à jour les imports dans ThemeLogo.tsx');
}

optimizeImages().catch(console.error);
