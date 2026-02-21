/**
 * Hook to trigger engine calculation from wizard form data.
 * Maps wizard data → engine input → runs PersonalFinanceEngine → stores output.
 */
import { useState, useCallback } from 'react';
import { PersonalFinanceEngine } from '@/domain/engine/personal-finance-engine';
import { useEngineStore, IncomeTarget } from '@/stores/engine-store';
import { mapWizardToEngineInput } from '@/services/wizard-to-engine.mapper';
import { WizardFormData } from '@/stores/wizard-store';
import { EngineOutput } from '@/types/engine';

interface UseEngineCalculationReturn {
  isCalculating: boolean;
  error: string | null;
  result: EngineOutput | null;
  calculate: (formData: WizardFormData) => Promise<EngineOutput | null>;
}

export function useEngineCalculation(): UseEngineCalculationReturn {
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EngineOutput | null>(null);
  const { isCalculating, setCalculating, setEngineOutput, setIncomeTargets } = useEngineStore();

  const calculate = useCallback(async (formData: WizardFormData): Promise<EngineOutput | null> => {
    setError(null);
    setCalculating(true);

    try {
      const engineInput = mapWizardToEngineInput(formData);
      const engine = new PersonalFinanceEngine(engineInput);
      const output = await engine.execute();

      setEngineOutput(output);
      setResult(output);

      // Persist income targets from wizard formData
      if (formData.incomes) {
        const targets: Record<string, IncomeTarget> = {};
        for (const [source, entry] of Object.entries(formData.incomes)) {
          if (entry && entry.amount > 0) {
            const monthlyAmount = entry.frequency === 'annual'
              ? Math.round(entry.amount / 12)
              : entry.amount;
            targets[source] = { monthlyAmount };
          }
        }
        if (Object.keys(targets).length > 0) {
          setIncomeTargets(targets);
        }
      }

      return output;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur de calcul inconnue';
      setError(message);
      setCalculating(false);
      return null;
    }
  }, [setCalculating, setEngineOutput, setIncomeTargets]);

  return { isCalculating, error, result, calculate };
}
