/**
 * ============================================
 * BATCH PROCESSOR - Traitement non-bloquant pour 10K+ employés
 * ============================================
 *
 * Utilise requestAnimationFrame et chunking pour traiter de grandes
 * quantités de données sans bloquer le thread UI.
 *
 * PRINCIPE:
 * - Découpe le travail en petits chunks (50-100 items)
 * - Yield au navigateur entre chaque chunk via requestAnimationFrame
 * - Permet à l'UI de rester fluide pendant le traitement
 * - Supporte les callbacks de progression
 */

export interface BatchProcessorOptions<T, R> {
  /** Données à traiter */
  items: T[];
  /** Fonction de traitement pour chaque item */
  processor: (item: T, index: number) => R;
  /** Taille du chunk (défaut: 50) */
  chunkSize?: number;
  /** Callback de progression (0-100) */
  onProgress?: (progress: number, processed: number, total: number) => void;
  /** Callback appelé à chaque chunk terminé */
  onChunkComplete?: (results: R[], chunkIndex: number) => void;
}

/**
 * Traite un tableau d'items par batch de manière non-bloquante
 * @returns Promise<R[]> - Résultats du traitement
 */
export async function processBatch<T, R>(
  options: BatchProcessorOptions<T, R>
): Promise<R[]> {
  const {
    items,
    processor,
    chunkSize = 50,
    onProgress,
    onChunkComplete
  } = options;

  const results: R[] = [];
  const total = items.length;

  if (total === 0) {
    onProgress?.(100, 0, 0);
    return results;
  }

  let processed = 0;

  // Découper en chunks
  const chunks: T[][] = [];
  for (let i = 0; i < total; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }

  // Traiter chaque chunk avec yield au navigateur
  for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
    const chunk = chunks[chunkIndex];

    // Yield au navigateur avant de traiter le chunk
    await yieldToMain();

    // Traiter le chunk
    const chunkResults: R[] = [];
    for (let i = 0; i < chunk.length; i++) {
      const result = processor(chunk[i], processed + i);
      chunkResults.push(result);
    }

    results.push(...chunkResults);
    processed += chunk.length;

    // Callback de progression
    const progress = Math.round((processed / total) * 100);
    onProgress?.(progress, processed, total);
    onChunkComplete?.(chunkResults, chunkIndex);
  }

  return results;
}

/**
 * Yield au thread principal pour permettre à l'UI de se mettre à jour
 * Utilise requestAnimationFrame pour un timing optimal
 */
function yieldToMain(): Promise<void> {
  return new Promise(resolve => {
    // Utiliser requestAnimationFrame pour yield au navigateur
    // Cela permet au navigateur de:
    // 1. Rendre les frames
    // 2. Gérer les événements utilisateur
    // 3. Mettre à jour les animations
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(() => {
        // Double RAF pour s'assurer que le navigateur a eu le temps de rendre
        requestAnimationFrame(() => resolve());
      });
    } else {
      // Fallback pour environnements sans RAF (SSR, tests)
      setTimeout(resolve, 0);
    }
  });
}

/**
 * Version avec scheduler.yield() pour les navigateurs modernes
 * Fallback sur requestAnimationFrame
 */
async function yieldToMainModern(): Promise<void> {
  // @ts-ignore - scheduler.yield n'est pas encore dans les types
  if (typeof scheduler !== 'undefined' && typeof scheduler.yield === 'function') {
    // @ts-ignore
    return scheduler.yield();
  }
  return yieldToMain();
}

/**
 * Traitement parallèle par batch avec limite de concurrence
 * Utile pour les opérations async (requêtes API, etc.)
 */
export async function processBatchParallel<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options: {
    concurrency?: number;
    chunkSize?: number;
    onProgress?: (progress: number, processed: number, total: number) => void;
  } = {}
): Promise<R[]> {
  const {
    concurrency = 5,
    chunkSize = 50,
    onProgress
  } = options;

  const results: R[] = new Array(items.length);
  const total = items.length;
  let processed = 0;
  let currentIndex = 0;

  // Créer les workers
  const workers = Array(Math.min(concurrency, total)).fill(null).map(async () => {
    while (currentIndex < total) {
      const index = currentIndex++;
      const item = items[index];

      try {
        results[index] = await processor(item);
      } catch (error) {
        console.error(`Error processing item at index ${index}:`, error);
        throw error;
      }

      processed++;

      // Yield périodiquement
      if (processed % chunkSize === 0) {
        await yieldToMain();
        const progress = Math.round((processed / total) * 100);
        onProgress?.(progress, processed, total);
      }
    }
  });

  await Promise.all(workers);

  onProgress?.(100, total, total);
  return results;
}

/**
 * Créer un processeur de validation d'employés optimisé pour 10K+
 */
export interface EmployeeValidationInput {
  employeeId: string;
  employeeName: string;
  businessLineId: string;
  businessLineName: string;
  indicators: Record<string, any>;
}

export interface EmployeeValidationOutput {
  employeeId: string;
  employeeName: string;
  businessLineId: string;
  businessLineName: string;
  indicators: Record<string, {
    pprPrevues: number;
    economiesRealisees: number;
    prevPrime: number;
    prevTreso: number;
    realPrime: number;
    realTreso: number;
  }>;
  totals: {
    totalPPR: number;
    totalEconomies: number;
    totalPrevPrime: number;
    totalPrevTreso: number;
    totalRealPrime: number;
    totalRealTreso: number;
    contributionPct: number;
  };
}

/**
 * Processeur optimisé pour la validation des employés
 */
export function createEmployeeValidator(
  primeRate: number = 0.10,
  tresoRate: number = 0.90,
  grandTotalEco: number = 1
) {
  return function validateEmployee(emp: EmployeeValidationInput): EmployeeValidationOutput {
    const indicators: Record<string, any> = {};
    let totalPPR = 0;
    let totalEconomies = 0;
    let totalPrevPrime = 0;
    let totalPrevTreso = 0;
    let totalRealPrime = 0;
    let totalRealTreso = 0;

    // Traiter chaque indicateur
    for (const key of ['abs', 'qd', 'oa', 'ddp', 'ekh']) {
      const ind = emp.indicators[key];
      if (ind) {
        const ppr = (ind.pprPrevues || 0) + (ind.pprPrevuesN2 || 0);
        const eco = (ind.economiesRealisees || 0) + (ind.economiesRealiseesN2 || 0);
        const indPrevPrime = ppr * primeRate;
        const indPrevTreso = ppr * tresoRate;
        const indRealPrime = eco * primeRate;
        const indRealTreso = eco * tresoRate;

        indicators[key] = {
          pprPrevues: ppr,
          economiesRealisees: eco,
          prevPrime: indPrevPrime,
          prevTreso: indPrevTreso,
          realPrime: indRealPrime,
          realTreso: indRealTreso
        };

        totalPPR += ppr;
        totalEconomies += eco;
        totalPrevPrime += indPrevPrime;
        totalPrevTreso += indPrevTreso;
        totalRealPrime += indRealPrime;
        totalRealTreso += indRealTreso;
      }
    }

    return {
      employeeId: emp.employeeId,
      employeeName: emp.employeeName,
      businessLineId: emp.businessLineId,
      businessLineName: emp.businessLineName,
      indicators,
      totals: {
        totalPPR,
        totalEconomies,
        totalPrevPrime,
        totalPrevTreso,
        totalRealPrime,
        totalRealTreso,
        contributionPct: grandTotalEco > 0 ? (totalEconomies / grandTotalEco) * 100 : 0
      }
    };
  };
}

export default {
  processBatch,
  processBatchParallel,
  createEmployeeValidator
};
