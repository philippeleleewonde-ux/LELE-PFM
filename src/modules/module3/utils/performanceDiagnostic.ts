/**
 * ============================================
 * DIAGNOSTIC DES PERFORMANCES
 * ============================================
 *
 * Utilitaire pour diagnostiquer les problèmes de calcul
 * de notes et grades des employés.
 *
 * Usage dans la console du navigateur:
 * 1. Ouvrir les DevTools (F12)
 * 2. Aller sur la page Centre de Performance
 * 3. Exécuter: window.diagPerformance('Sophie Moreau')
 *
 * @module performanceDiagnostic
 * @version 1.0.0
 */

import { calculateGlobalNote, calculateGrade } from '../types/performanceCenter';

export interface DiagnosticResult {
  employeeName: string;
  found: boolean;
  source: string;
  rawData: {
    objectif: number;
    economiesRealisees: number;
    pertesConstatees?: number;
    pprPrevues?: number;
  };
  calculations: {
    noteCalculee: number;
    gradeCalcule: string;
    noteAffichee?: number;
    gradeAffiche?: string;
    coherent: boolean;
  };
  indicateurs: Array<{
    key: string;
    objectif: number;
    economies: number;
    pertes?: number;
  }>;
  problemes: string[];
}

/**
 * Diagnostique les données de performance d'un employé.
 */
interface BulletinEntry {
  employeeName?: string;
  globalNote?: number;
  grade?: string;
  employeePerformance?: { objectif: number; economiesRealisees: number };
  indicators?: Record<string, { objectif?: number; economiesRealisees?: number }>;
}

interface CostEntryForDiag {
  employee_name?: string;
  kpi_type?: string;
  compensation_amount?: number;
}

export function diagnoseEmployeePerformance(
  employeeName: string,
  bulletinData: BulletinEntry[],
  costEntries: CostEntryForDiag[],
  pprSettings: Record<string, number> | null
): DiagnosticResult {
  const result: DiagnosticResult = {
    employeeName,
    found: false,
    source: 'none',
    rawData: {
      objectif: 0,
      economiesRealisees: 0
    },
    calculations: {
      noteCalculee: 0,
      gradeCalcule: 'E',
      coherent: true
    },
    indicateurs: [],
    problemes: []
  };

  // Chercher dans bulletinData (localStorage)
  const bulletinEntry = bulletinData?.find(
    (e: BulletinEntry) => e.employeeName?.toLowerCase().includes(employeeName.toLowerCase())
  );

  if (bulletinEntry) {
    result.found = true;
    result.source = 'hcm_bulletin_performances (localStorage)';
    result.rawData = {
      objectif: bulletinEntry.employeePerformance?.objectif || 0,
      economiesRealisees: bulletinEntry.employeePerformance?.economiesRealisees || 0
    };
    result.calculations.noteAffichee = bulletinEntry.globalNote;
    result.calculations.gradeAffiche = bulletinEntry.grade;

    // Analyser les indicateurs
    if (bulletinEntry.indicators) {
      Object.entries(bulletinEntry.indicators).forEach(([key, ind]: [string, { objectif?: number; economiesRealisees?: number }]) => {
        result.indicateurs.push({
          key,
          objectif: ind.objectif || 0,
          economies: ind.economiesRealisees || 0
        });
      });
    }
  }

  // Chercher dans costEntries (Supabase)
  const employeeCostEntries = costEntries?.filter(
    (e: CostEntryForDiag) => e.employee_name?.toLowerCase().includes(employeeName.toLowerCase())
  );

  if (employeeCostEntries && employeeCostEntries.length > 0) {
    if (!result.found) {
      result.found = true;
      result.source = 'module3_cost_entries (Supabase)';
    } else {
      result.source += ' + module3_cost_entries';
    }

    // Analyser les cost_entries
    const kpiTypes = ['ABS', 'QD', 'OA', 'DDP', 'EKH'];
    kpiTypes.forEach(kpi => {
      const kpiEntries = employeeCostEntries.filter((e: CostEntryForDiag) => e.kpi_type === kpi);
      const totalFrais = kpiEntries.reduce((sum: number, e: CostEntryForDiag) => sum + (e.compensation_amount || 0), 0);
      const pprKey = `ppr_${kpi.toLowerCase()}_weekly`;
      const objectif = pprSettings?.[pprKey] || 0;

      // Formule: économies = objectif - frais
      const economiesCalculees = objectif - totalFrais;

      const existing = result.indicateurs.find(i => i.key === kpi.toLowerCase());
      if (existing) {
        existing.pertes = totalFrais;
      } else {
        result.indicateurs.push({
          key: kpi.toLowerCase(),
          objectif,
          economies: Math.max(0, economiesCalculees), // Plafonnement actuel
          pertes: totalFrais
        });
      }
    });
  }

  // Recalculer la note avec les données trouvées
  const totalObjectif = result.indicateurs.reduce((sum, ind) => sum + ind.objectif, 0);
  const totalEconomies = result.indicateurs.reduce((sum, ind) => sum + ind.economies, 0);

  result.rawData.objectif = totalObjectif;
  result.rawData.economiesRealisees = totalEconomies;

  result.calculations.noteCalculee = calculateGlobalNote(totalEconomies, totalObjectif);
  result.calculations.gradeCalcule = calculateGrade(result.calculations.noteCalculee);

  // Vérifier la cohérence
  if (result.calculations.noteAffichee !== undefined) {
    result.calculations.coherent =
      Math.abs(result.calculations.noteCalculee - result.calculations.noteAffichee) < 0.2 &&
      result.calculations.gradeCalcule === result.calculations.gradeAffiche;
  }

  // Identifier les problèmes
  if (!result.found) {
    result.problemes.push('Employé non trouvé dans les données');
  }

  if (totalObjectif === 0) {
    result.problemes.push('⚠️ CRITIQUE: Objectif total = 0 (PPR non configurés?)');
  }

  if (totalEconomies >= totalObjectif && totalObjectif > 0) {
    result.problemes.push(`✓ Économies (${totalEconomies}) >= Objectif (${totalObjectif}) → A+ justifié`);
  }

  result.indicateurs.forEach(ind => {
    if (ind.pertes !== undefined && ind.pertes > ind.objectif) {
      result.problemes.push(
        `⚠️ ${ind.key.toUpperCase()}: Pertes (${ind.pertes}) > Objectif (${ind.objectif}) → Économies négatives plafonnées à 0`
      );
    }
  });

  if (!result.calculations.coherent) {
    result.problemes.push(
      `⚠️ INCOHÉRENCE: Note affichée (${result.calculations.noteAffichee}) ≠ Note calculée (${result.calculations.noteCalculee})`
    );
  }

  return result;
}

/**
 * Fonction globale pour diagnostic depuis la console.
 */
export function setupGlobalDiagnostic() {
  if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>).diagPerformance = (employeeName: string) => {
      // Récupérer les données depuis localStorage
      let bulletinData: BulletinEntry[] = [];
      try {
        const raw = localStorage.getItem('hcm_bulletin_performances');
        if (raw) {
          const parsed = JSON.parse(raw);
          bulletinData = parsed.data || [];
        }
      } catch (e) {
        console.error('Erreur lecture localStorage:', e);
      }

      // Afficher le diagnostic
      const result = diagnoseEmployeePerformance(employeeName, bulletinData, [], null);

      console.log('='.repeat(60));
      console.log(`DIAGNOSTIC: ${employeeName}`);
      console.log('='.repeat(60));
      console.log('Source:', result.source);
      console.log('');
      console.log('DONNÉES BRUTES:');
      console.log('  Objectif total:', result.rawData.objectif);
      console.log('  Économies totales:', result.rawData.economiesRealisees);
      console.log('');
      console.log('CALCULS:');
      console.log('  Note calculée:', result.calculations.noteCalculee);
      console.log('  Grade calculé:', result.calculations.gradeCalcule);
      console.log('  Note affichée:', result.calculations.noteAffichee);
      console.log('  Grade affiché:', result.calculations.gradeAffiche);
      console.log('  Cohérent:', result.calculations.coherent ? '✅ OUI' : '❌ NON');
      console.log('');
      console.log('INDICATEURS:');
      result.indicateurs.forEach(ind => {
        console.log(`  ${ind.key.toUpperCase()}: Obj=${ind.objectif}, Éco=${ind.economies}${ind.pertes !== undefined ? `, Pertes=${ind.pertes}` : ''}`);
      });
      console.log('');
      console.log('PROBLÈMES DÉTECTÉS:');
      result.problemes.forEach(p => console.log('  ' + p));
      console.log('='.repeat(60));

      return result;
    };

    console.log('[PerformanceDiagnostic] Diagnostic disponible. Utilisez: window.diagPerformance("Sophie Moreau")');
  }
}

// Auto-initialisation
setupGlobalDiagnostic();
