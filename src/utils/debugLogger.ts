/**
 * Debug Logger Service
 * Écrit les données de calcul dans un fichier JSON accessible par Claude
 *
 * Usage:
 * 1. Import: import { debugLogger } from '@/utils/debugLogger';
 * 2. Log: debugLogger.log('section', 'key', data);
 * 3. Export: debugLogger.exportToConsole(); // Affiche tout en JSON
 */

interface DebugEntry {
  timestamp: string;
  section: string;
  key: string;
  data: unknown;
}

class DebugLogger {
  private entries: DebugEntry[] = [];
  // SÉCURITÉ: Désactivé automatiquement en production
  private isEnabled: boolean = import.meta.env.DEV || import.meta.env.MODE === 'development';

  /**
   * Active ou désactive le logger
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  /**
   * Efface toutes les entrées
   */
  clear() {
    this.entries = [];
  }

  /**
   * Ajoute une entrée de log
   */
  log(section: string, key: string, data: unknown) {
    if (!this.isEnabled) return;

    this.entries.push({
      timestamp: new Date().toISOString(),
      section,
      key,
      data
    });
  }

  /**
   * Log un tableau de valeurs avec calcul du total
   */
  logArray(section: string, key: string, values: { label: string; value: number }[]) {
    if (!this.isEnabled) return;

    const total = values.reduce((sum, v) => sum + v.value, 0);

    this.entries.push({
      timestamp: new Date().toISOString(),
      section,
      key,
      data: {
        values,
        count: values.length,
        total,
        totalFormatted: total.toLocaleString('fr-FR', { minimumFractionDigits: 3 })
      }
    });
  }

  /**
   * Récupère toutes les entrées
   */
  getEntries(): DebugEntry[] {
    return this.entries;
  }

  /**
   * Récupère les entrées par section
   */
  getBySection(section: string): DebugEntry[] {
    return this.entries.filter(e => e.section === section);
  }

  /**
   * Exporte tout en JSON dans la console
   */
  exportToConsole() {
    console.log('=== DEBUG LOGGER EXPORT ===');
    console.log(JSON.stringify(this.entries, null, 2));
  }

  /**
   * Exporte un résumé formaté dans la console
   */
  exportSummary() {
    console.log('=== DEBUG LOGGER SUMMARY ===');

    const sections = [...new Set(this.entries.map(e => e.section))];

    sections.forEach(section => {
      console.log(`\n📁 ${section}`);
      const sectionEntries = this.getBySection(section);
      sectionEntries.forEach(entry => {
        if (typeof entry.data === 'object' && entry.data !== null && 'total' in entry.data) {
          const d = entry.data as { count: number; total: number; totalFormatted: string };
          console.log(`  └─ ${entry.key}: ${d.count} items, Total = ${d.totalFormatted}`);
        } else {
          console.log(`  └─ ${entry.key}:`, entry.data);
        }
      });
    });
  }

  /**
   * Génère un rapport complet pour Claude
   */
  generateReport(): string {
    const report: Record<string, unknown> = {
      generatedAt: new Date().toISOString(),
      totalEntries: this.entries.length,
      sections: {}
    };

    const sections = [...new Set(this.entries.map(e => e.section))];

    sections.forEach(section => {
      const sectionEntries = this.getBySection(section);
      (report.sections as Record<string, unknown>)[section] = sectionEntries.map(e => ({
        key: e.key,
        data: e.data
      }));
    });

    return JSON.stringify(report, null, 2);
  }

  /**
   * Sauvegarde le rapport dans localStorage pour persistance
   */
  saveToLocalStorage() {
    try {
      localStorage.setItem('debug_logger_report', this.generateReport());
      console.log('✅ Debug report saved to localStorage (key: debug_logger_report)');
    } catch (error) {
      console.error('❌ Failed to save debug report:', error);
    }
  }

  /**
   * Charge le rapport depuis localStorage
   */
  loadFromLocalStorage(): string | null {
    try {
      return localStorage.getItem('debug_logger_report');
    } catch {
      return null;
    }
  }
}

// Instance singleton
export const debugLogger = new DebugLogger();

// SÉCURITÉ: Expose globalement UNIQUEMENT en développement
if (typeof window !== 'undefined' && (import.meta.env.DEV || import.meta.env.MODE === 'development')) {
  (window as unknown as Record<string, unknown>).debugLogger = debugLogger;
}
