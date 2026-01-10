import React from 'react';
import { Coins, TrendingUp } from 'lucide-react';
import { CalculatedFields, Currency, QualitativeAssessment, SocioeconomicImprovement } from '@/modules/module1/types';
import { formatCurrency } from '@/modules/module1/utils/formatting';
import { CFOCalculationEngine } from '@/modules/module1/lib/calculations';

interface Page12IPLEPlanProps {
  calculated: CalculatedFields;
  selectedCurrency: Currency;
  socioeconomicData: SocioeconomicImprovement;
  qualitativeData: QualitativeAssessment;
}

export function Page12IPLEPlan({ calculated, selectedCurrency, socioeconomicData, qualitativeData }: Page12IPLEPlanProps) {
  const years = [
    { year: 'N+1', gain: calculated.gainsN1 || 0, cashFlow: calculated.cashFlowN1 || 0, bonuses: calculated.primesN1 || 0, percentRecovered: 30 },
    { year: 'N+2', gain: calculated.gainsN2 || 0, cashFlow: calculated.cashFlowN2 || 0, bonuses: calculated.primesN2 || 0, percentRecovered: 60 },
    { year: 'N+3', gain: calculated.gainsN3 || 0, cashFlow: calculated.cashFlowN3 || 0, bonuses: calculated.primesN3 || 0, percentRecovered: 100 }
  ];

  // Socioeconomic weights (groups 205..209) from 0..4 scale
  const s1 = CFOCalculationEngine.convertSocioQualToWeight(socioeconomicData.keyArea1_workingConditions);
  const s2 = CFOCalculationEngine.convertSocioQualToWeight(socioeconomicData.keyArea2_workOrganization);
  const s3 = CFOCalculationEngine.convertSocioQualToWeight(socioeconomicData.keyArea3_communication);
  const s4 = CFOCalculationEngine.convertSocioQualToWeight(socioeconomicData.keyArea4_timeManagement);
  const s5 = CFOCalculationEngine.convertSocioQualToWeight(socioeconomicData.keyArea5_training);
  const s6 = CFOCalculationEngine.convertSocioQualToWeight(socioeconomicData.keyArea6_strategy);
  const socioDenom = (s1 + s2 + s3 + s4 + s5 + s6) || 1;
  const w205 = (s1 / socioDenom) * 100;
  const w206 = (s2 / socioDenom) * 100;
  const w207 = ((s3 + s5) / socioDenom) * 100;
  const w208 = (s4 / socioDenom) * 100;
  const w209 = (s6 / socioDenom) * 100;
  // Mapping aligned with source screenshots:
  // ABS -> group 208, QD -> 206, OA -> 205, DDP -> 209, EKH -> 207
  const socioKeys = [
    { id: 'ABS', label: 'Absenteeism (ABS)', weight: w208 },
    { id: 'QD', label: 'Quality defects (QD)', weight: w206 },
    { id: 'OA', label: 'Occupational accidents (OA)', weight: w205 },
    { id: 'DDP', label: 'Distances from direct productivity (DDP)', weight: w209 },
    { id: 'EKH', label: 'Distances from Know-how (EKH)', weight: w207 },
  ];

  // Risk breakdown keys for IPLE (B/D/F): fixed distribution matching source
  const riskItems: { id: keyof QualitativeAssessment; label: string }[] = [
    { id: 'operationalRiskIncidents', label: 'Operational Risk (Cf. typology of Basel II)' },
    { id: 'creditRiskAssessment', label: 'Credit counterparty risk or signature risk' },
    { id: 'marketVolatility', label: 'Market risk' },
    { id: 'liquidityPosition', label: 'Transformation risk' },
    { id: 'reputationalFactors', label: 'Organizational risk' },
    { id: 'strategicAlignment', label: 'Specific Heath and Insurance Risk' },
  ];
  // Fixed ratio vector that sums to 84: [30,10,5,14,13,12]
  const riskRatio = [30, 10, 5, 14, 13, 12];
  const riskWeights = riskRatio.map(x => (x / 84) * 100);

  const totalCashFlow = (calculated.cashFlowN1 || 0) + (calculated.cashFlowN2 || 0) + (calculated.cashFlowN3 || 0);
  const totalBonuses = (calculated.primesN1 || 0) + (calculated.primesN2 || 0) + (calculated.primesN3 || 0);

  return (
    <div className="space-y-6">
      <div className="p-4 bg-gray-900/70 rounded-lg mb-6 text-center border border-gray-700">
        <h3 className="text-lg font-bold text-white">12- Breakdown of the Incentivized Pay Leverage Effect (IPLE) expected from the Financial Performance of Workstations over a 3-year plan</h3>
      </div>

      <div className="space-y-6">
        {years.map((y, idx) => {
          const socioBreakdown = socioKeys.map(k => ({ ...k, amount: (y.gain * k.weight) / 100 }));
          const riskBreakdown = riskItems.map((r, i) => ({ label: r.label, weight: riskWeights[i], amount: (y.cashFlow * riskWeights[i]) / 100 }));
          const isN1 = idx === 0;
          return (
            <div key={y.year} className="bg-gray-800/50 rounded-lg shadow-lg border border-gray-700 p-6 space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xl font-bold text-white">YEAR {y.year}</h4>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-400">{formatCurrency(y.gain, selectedCurrency)}</p>
                  <p className="text-xs text-gray-400">({y.percentRecovered}% des PRL)</p>
                </div>
              </div>

              {/* A / C / ... Socioeconomic keys breakdown of Economic Benefit (Gains) */}
              <div className="bg-gray-900/40 p-4 rounded-lg border border-gray-700">
                <h5 className="font-bold text-white mb-3">{isN1 ? 'A- ' : idx === 1 ? 'C- ' : 'E- '}Breakdown Keys for distributing the Economic Benefit expected from the mitigation of risks related to Socio-economic indicators (factors or causes of losses)</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {socioBreakdown.map(item => (
                    <div key={`${y.year}-${item.id}`} className="bg-gray-800/60 rounded-md border border-gray-700 p-3">
                      <div className="text-xs text-gray-400 mb-1">{item.label}</div>
                      <div className="text-lg font-mono text-white">{formatCurrency(item.amount, selectedCurrency)}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-right text-xs text-gray-400">Cash flows expected from the mitigation of risks related to Socio-economic indicators (67%) — <span className="font-mono text-green-400">{formatCurrency(y.cashFlow, selectedCurrency)}</span></div>
                <div className="mt-1 text-right text-xs text-gray-400">Outflows of finance (Incentivized Pay) counted in loads to generate the entrances (33%) — <span className="font-mono text-blue-400">{formatCurrency(y.bonuses, selectedCurrency)}</span></div>
                <div className="mt-1 text-right text-xs text-gray-400">Cash outflows to generate entrances - Bonuses of the staff — <span className="font-mono text-blue-400">{formatCurrency(y.bonuses, selectedCurrency)}</span></div>
              </div>

              {/* Risk breakdown of cash flow for each year (B for N+1, D for N+2, F for N+3) */}
              <div className="bg-gray-900/40 p-4 rounded-lg border border-gray-700">
                <h5 className="font-bold text-white mb-3">{idx === 0 ? 'B- ' : idx === 1 ? 'D- ' : 'F- '}Incentivized Pay Leverage Effect (IPLE) expected from the Financial Performance of Workstations in year N + {idx + 1}</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3">
                  {riskBreakdown.map((r) => (
                    <div key={`risk-${r.label}`} className="bg-gray-800/60 rounded-md border border-gray-700 p-3">
                      <div className="text-xs text-gray-400 mb-1">{r.label}</div>
                      <div className="text-lg font-mono text-white">{formatCurrency(r.amount, selectedCurrency)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cash-flow and bonuses cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-600">
                  <div className="flex items-center text-green-400 mb-2">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    <h5 className="font-bold">Cash-Flow Entreprise (67%)</h5>
                  </div>
                  <p className="text-2xl font-mono font-bold text-white">{formatCurrency(y.cashFlow, selectedCurrency)}</p>
                </div>
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-600">
                  <div className="flex items-center text-blue-400 mb-2">
                    <Coins className="w-5 h-5 mr-2" />
                    <h5 className="font-bold">Primes Employés (33%)</h5>
                  </div>
                  <p className="text-2xl font-mono font-bold text-white">{formatCurrency(y.bonuses, selectedCurrency)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 p-4 rounded-lg text-center">
              <h4 className="text-sm font-bold text-gray-300">Total Cash-Flow sur 3 ans</h4>
              <p className="text-2xl font-bold text-green-400">{formatCurrency(totalCashFlow, selectedCurrency)}</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg text-center">
              <h4 className="text-sm font-bold text-gray-300">Total Primes sur 3 ans</h4>
              <p className="text-2xl font-bold text-blue-400">{formatCurrency(totalBonuses, selectedCurrency)}</p>
          </div>
      </div>
    </div>
  );
}