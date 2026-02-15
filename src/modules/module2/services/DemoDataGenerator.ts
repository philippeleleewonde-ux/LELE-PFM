// ============================================================================
// MODULE 2 — DEMO DATA GENERATOR
// Generates random survey responses based on business_lines staff counts
// Uses Gaussian distribution for realistic Likert scale responses
// Supports bias parameter for multi-campaign demo with score evolution
// ============================================================================

interface BusinessLine {
  activity_name: string;
  staff_count: number;
}

interface DemoResponse {
  responses: Record<string, number | string>;
}

// Likert question codes (30 questions)
const LIKERT_CODES = [
  'T1Q1', 'T1Q2', 'T1Q3', 'T1Q4', 'T1Q5', 'T1Q6', 'T1Q7', 'T1Q8',
  'T2Q9', 'T2Q10', 'T2Q11', 'T2Q12', 'T2Q13', 'T2Q14', 'T2Q15', 'T2Q16', 'T2Q17', 'T2Q18',
  'T3Q19', 'T3Q20', 'T3Q21', 'T3Q22', 'T3Q23', 'T3Q24', 'T3Q25',
  'T4Q26', 'T4Q27', 'T4Q28', 'T4Q29', 'T4Q30',
];

const CATEGORIES = ['executive', 'supervisor', 'clerk', 'worker'] as const;
const GENDERS = ['man', 'woman'] as const;

/** Box-Muller transform: generates a random number from a Gaussian distribution */
function gaussianRandom(mean: number, stdDev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z0 * stdDev + mean;
}

/** Clamps a value to Likert scale 1–5 and rounds to integer */
function likertValue(mean = 2.5, stdDev = 1.0): number {
  const raw = gaussianRandom(mean, stdDev);
  return Math.max(1, Math.min(5, Math.round(raw)));
}

/** Pick a random element from an array */
function randomPick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export interface DemoGenerateOptions {
  /** Gaussian mean for Likert scores. Default 2.5. Lower = more satisfied (scale: 1=best, 5=worst) */
  mean?: number;
  /** Gaussian standard deviation. Default 1.0 */
  stdDev?: number;
  /** Participation rate 0-1. Default 1.0 (100% of staff_count respond) */
  participationRate?: number;
}

export class DemoDataGenerator {
  /**
   * Generates demo survey responses based on business line staff counts.
   * @param businessLines - Array of {activity_name, staff_count}
   * @param options - Optional: mean, stdDev, participationRate for score variation
   */
  static generate(businessLines: BusinessLine[], options?: DemoGenerateOptions): DemoResponse[] {
    const mean = options?.mean ?? 2.5;
    const stdDev = options?.stdDev ?? 1.0;
    const participationRate = options?.participationRate ?? 1.0;
    const responses: DemoResponse[] = [];

    for (const line of businessLines) {
      const respondents = Math.max(1, Math.round(line.staff_count * participationRate));
      for (let i = 0; i < respondents; i++) {
        const resp: Record<string, number | string> = {};

        // Demographics
        resp['D1'] = line.activity_name;
        resp['D2'] = randomPick(CATEGORIES);
        resp['D3'] = randomPick(GENDERS);

        // Likert questions with configurable distribution
        for (const code of LIKERT_CODES) {
          resp[code] = likertValue(mean, stdDev);
        }

        responses.push({ responses: resp });
      }
    }

    return responses;
  }
}
