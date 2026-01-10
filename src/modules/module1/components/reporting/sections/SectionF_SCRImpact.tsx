import React from 'react';
import { Shield, TrendingDown, AlertCircle } from 'lucide-react';
import { CalculatedFields, Currency } from '@/modules/module1/types';
import { formatCurrency } from '@/modules/module1/utils/formatting';

interface SectionFProps {
  calculated: CalculatedFields;
  selectedCurrency: Currency;
}

/**
 * Section F: 3-Year Budget SCR Impact (Solvency Capital Requirement)
 * Source Excel: Feuille "13-REPORTING M1-Pdf" → Références vers "9-PLANIFICATION BUDGET-3ANS"
 * Affiche l'impact de la réduction du VaR sur le capital de solvabilité requis (SCR)
 */
export function SectionF_SCRImpact({ calculated, selectedCurrency }: SectionFProps) {
  // VaR initial et projeté
  const varInitial = calculated.var || 0;

  // Réduction progressive du VaR grâce aux actions correctives
  const varN1 = varInitial * (1 - 0.30); // Réduction de 30% en N+1
  const varN2 = varInitial * (1 - 0.60); // Réduction de 60% en N+2
  const varN3 = varInitial * (1 - 1.00); // Réduction de 100% en N+3 (objectif)

  // SCR = VaR × Facteur de capitalisation (typiquement 3x pour assurances)
  const scrFactor = calculated.scr_factor || 3.0;

  const scrInitial = varInitial * scrFactor;
  const scrN1 = varN1 * scrFactor;
  const scrN2 = varN2 * scrFactor;
  const scrN3 = varN3 * scrFactor;

  // Économies de capital (libération de SCR)
  const scrSavingsN1 = scrInitial - scrN1;
  const scrSavingsN2 = scrInitial - scrN2;
  const scrSavingsN3 = scrInitial - scrN3;

  // Coût du capital (typiquement 6-8% par an)
  const capitalCostRate = calculated.capital_cost_rate || 0.07; // 7% par défaut

  // Économies financières dues à la réduction du SCR
  const financialSavingsN1 = scrSavingsN1 * capitalCostRate;
  const financialSavingsN2 = scrSavingsN2 * capitalCostRate;
  const financialSavingsN3 = scrSavingsN3 * capitalCostRate;

  const scrData = [
    {
      year: 'Initial (N)',
      scr: scrInitial,
      var: varInitial,
      savings: 0,
      financialSavings: 0,
      color: 'red'
    },
    {
      year: 'N+1',
      scr: scrN1,
      var: varN1,
      savings: scrSavingsN1,
      financialSavings: financialSavingsN1,
      color: 'yellow'
    },
    {
      year: 'N+2',
      scr: scrN2,
      var: varN2,
      savings: scrSavingsN2,
      financialSavings: financialSavingsN2,
      color: 'blue'
    },
    {
      year: 'N+3',
      scr: scrN3,
      var: varN3,
      savings: scrSavingsN3,
      financialSavings: financialSavingsN3,
      color: 'green'
    }
  ];

  const totalFinancialSavings = financialSavingsN1 + financialSavingsN2 + financialSavingsN3;

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-gray-700">
        <Shield className="w-6 h-6 text-purple-400" />
        <div>
          <h3 className="text-xl font-bold text-white">Section F - SCR Impact Analysis</h3>
          <p className="text-sm text-gray-400">Impact sur le capital de solvabilité requis (Solvency Capital Requirement)</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="text-xs font-semibold text-gray-400 mb-1">SCR INITIAL (N)</div>
          <div className="text-2xl font-bold text-red-400">{formatCurrency(scrInitial, selectedCurrency)}</div>
          <div className="text-xs text-gray-500 mt-1">Capital requis actuellement</div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="text-xs font-semibold text-gray-400 mb-1">SCR CIBLE (N+3)</div>
          <div className="text-2xl font-bold text-green-400">{formatCurrency(scrN3, selectedCurrency)}</div>
          <div className="text-xs text-gray-500 mt-1">Capital requis après actions</div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="text-xs font-semibold text-gray-400 mb-1">CAPITAL LIBÉRÉ</div>
          <div className="text-2xl font-bold text-purple-400">{formatCurrency(scrSavingsN3, selectedCurrency)}</div>
          <div className="text-xs text-gray-500 mt-1">Réduction totale du SCR</div>
        </div>
      </div>

      {/* SCR Reduction Timeline */}
      <div className="bg-gray-800/30 rounded-lg p-5 border border-gray-700">
        <h4 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">
          <TrendingDown className="w-4 h-4" />
          Évolution du SCR sur 3 ans
        </h4>

        <div className="space-y-3">
          {scrData.map((data, idx) => {
            const reductionPercentage = scrInitial > 0 ? ((scrInitial - data.scr) / scrInitial) * 100 : 0;
            return (
              <div key={data.year} className="bg-gray-900/40 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-sm font-bold text-white">{data.year}</h5>
                  {idx > 0 && (
                    <span className="text-xs bg-green-900/30 text-green-400 px-2 py-1 rounded-full">
                      -{reductionPercentage.toFixed(1)}% SCR
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <div className="text-xs text-gray-400">VaR</div>
                    <div className="text-sm font-mono text-white">{formatCurrency(data.var, selectedCurrency)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">SCR (×{scrFactor})</div>
                    <div className={`text-sm font-mono font-bold ${data.color === 'green' ? 'text-green-400' : data.color === 'blue' ? 'text-blue-400' : data.color === 'yellow' ? 'text-yellow-400' : 'text-red-400'}`}>
                      {formatCurrency(data.scr, selectedCurrency)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Capital libéré</div>
                    <div className="text-sm font-mono text-purple-400">{formatCurrency(data.savings, selectedCurrency)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Économies ({(capitalCostRate * 100).toFixed(0)}%)</div>
                    <div className="text-sm font-mono text-green-400">{formatCurrency(data.financialSavings, selectedCurrency)}</div>
                  </div>
                </div>

                {/* Visual progress bar */}
                {idx > 0 && (
                  <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden mt-2">
                    <div
                      className="bg-gradient-to-r from-green-600 to-green-400 h-full transition-all duration-500"
                      style={{ width: `${reductionPercentage}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Financial Impact Summary */}
      <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-lg p-5 border border-purple-700/50">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-purple-300 mb-2">Impact financier de la réduction du SCR</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-400 mb-1">Total capital libéré sur 3 ans</div>
                <div className="text-2xl font-bold text-purple-400">{formatCurrency(scrSavingsN3, selectedCurrency)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">Économies financières cumulées (coût du capital {(capitalCostRate * 100).toFixed(0)}%)</div>
                <div className="text-2xl font-bold text-green-400">{formatCurrency(totalFinancialSavings, selectedCurrency)}</div>
              </div>
            </div>
            <p className="text-xs text-purple-200 mt-3">
              La réduction du VaR grâce aux actions socio-économiques permet de libérer du capital actuellement
              immobilisé au titre de la solvabilité réglementaire. Ce capital peut être réinvesti dans le développement
              ou redistribué aux actionnaires.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700 overflow-x-auto">
        <h4 className="text-sm font-bold text-gray-300 mb-3">Tableau récapitulatif SCR</h4>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-2 px-2 text-gray-400 font-semibold">Période</th>
              <th className="text-right py-2 px-2 text-gray-400 font-semibold">VaR</th>
              <th className="text-right py-2 px-2 text-gray-400 font-semibold">SCR</th>
              <th className="text-right py-2 px-2 text-gray-400 font-semibold">Capital libéré</th>
              <th className="text-right py-2 px-2 text-gray-400 font-semibold">Économies annuelles</th>
            </tr>
          </thead>
          <tbody>
            {scrData.map((data) => (
              <tr key={data.year} className="border-b border-gray-700/50">
                <td className="py-2 px-2 font-semibold text-white">{data.year}</td>
                <td className="text-right py-2 px-2 font-mono text-gray-300">
                  {formatCurrency(data.var, selectedCurrency)}
                </td>
                <td className="text-right py-2 px-2 font-mono text-white">
                  {formatCurrency(data.scr, selectedCurrency)}
                </td>
                <td className="text-right py-2 px-2 font-mono text-purple-400">
                  {formatCurrency(data.savings, selectedCurrency)}
                </td>
                <td className="text-right py-2 px-2 font-mono text-green-400">
                  {formatCurrency(data.financialSavings, selectedCurrency)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-600">
              <td className="py-2 px-2 font-bold text-white" colSpan={3}>TOTAL ÉCONOMIES</td>
              <td className="text-right py-2 px-2 font-mono font-bold text-purple-400">
                {formatCurrency(scrSavingsN3, selectedCurrency)}
              </td>
              <td className="text-right py-2 px-2 font-mono font-bold text-green-400">
                {formatCurrency(totalFinancialSavings, selectedCurrency)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Note explicative */}
      <div className="bg-blue-900/20 border border-blue-700/40 rounded-lg p-3">
        <p className="text-xs text-blue-200">
          <strong>Note:</strong> Le SCR (Solvency Capital Requirement) représente le capital qu'une entreprise
          (notamment en assurance) doit immobiliser pour couvrir ses risques opérationnels. En réduisant le VaR
          par des actions socio-économiques, vous réduisez mécaniquement le SCR, libérant ainsi du capital
          qui peut générer un retour financier au taux du coût du capital (actuellement {(capitalCostRate * 100).toFixed(0)}%).
        </p>
      </div>
    </div>
  );
}
