import React from 'react';
import { Target, TrendingUp, Users, Calendar } from 'lucide-react';
import { CalculatedFields, Currency, BusinessLine } from '@/modules/module1/types';
import { formatCurrency } from '@/modules/module1/utils/formatting';
import { FiscalCalendarWidget } from '@/components/shared/FiscalCalendarWidget';

interface Page16PriorityActionsN3Props {
  calculated: CalculatedFields;
  selectedCurrency: Currency;
  businessLines: BusinessLine[];
}

export function Page16PriorityActionsN3({
  calculated,
  selectedCurrency,
  businessLines
}: Page16PriorityActionsN3Props) {
  // DEBUG: Log calculated values
  // Total staff et total budget
  const totalStaff = businessLines.reduce((sum, line) => sum + (line.staffCount || 0), 0);
  const totalBudget = businessLines.reduce((sum, line) => sum + (line.budget || 0), 0);

  // PPR total pour N+3 (= gainsN3 depuis feuille 9-PLANIFICATION BUDGET-3ANS, cellule C99)
  // Formule Excel: C13 = '9-PLANIFICATION BUDGET-3ANS'!C61
  const pprN3 = calculated.gainsN3 || 0;

  // Vérifier si les données upstream sont complètes
  const hasCompleteData = pprN3 > 0 && businessLines.length > 0;
  const totalIndicatorRate = (calculated.indicator_absenteeism_rate || 0) +
                             (calculated.indicator_productivity_rate || 0) +
                             (calculated.indicator_quality_rate || 0) +
                             (calculated.indicator_accidents_rate || 0) +
                             (calculated.indicator_knowhow_rate || 0);

  // Les 5 indicateurs de performance avec leurs taux
  // Formules Excel: F16, J16, N16, R16, V16 (identiques à Page 14)
  const indicators = [
    {
      id: 'absenteeism',
      label: 'Absentéisme',
      domain: 'Gestion du temps',
      rate: calculated.indicator_absenteeism_rate || 0,
      color: 'yellow'
    },
    {
      id: 'productivity',
      label: 'Ecarts de productivité directe',
      domain: 'Mise en œuvre stratégique',
      rate: calculated.indicator_productivity_rate || 0,
      color: 'blue'
    },
    {
      id: 'quality',
      label: 'Défauts de qualité',
      domain: 'L\'organisation du travail',
      rate: calculated.indicator_quality_rate || 0,
      color: 'purple'
    },
    {
      id: 'accidents',
      label: 'Accidents du travail',
      domain: 'Les conditions de travail',
      rate: calculated.indicator_accidents_rate || 0,
      color: 'red'
    },
    {
      id: 'knowhow',
      label: 'Ecarts de know-how',
      domain: 'Formation intégrée et 3C',
      rate: calculated.indicator_knowhow_rate || 0,
      color: 'green'
    }
  ];

  // Distribution par ligne d'activité
  // Formules Excel identiques à Page 14, sauf C13 = gainsN3 au lieu de gainsN1
  const distributions = businessLines.map(line => {
    // Calculer le budgetRate automatiquement si non fourni
    // Formule Excel: C19 = '2-BUDGETS ET CARTOGRAPHIE'!IV13
    const lineBudget = line.budget || 0;
    const calculatedBudgetRate = totalBudget > 0 ? (lineBudget / totalBudget) * 100 : 0;
    const lineBudgetRate = (line.budgetRate || calculatedBudgetRate) / 100; // Convertir % en décimal
    const lineStaffCount = line.staffCount || 1; // Éviter division par 0

    // Pour chaque indicateur: PPR × Taux indicateur × Taux budget ligne
    // Formule Excel: E19 = C13 * F16 * C19 (où C13 = gainsN3 pour Page 16)
    const lineDistributions = indicators.map(indicator => {
      const perLine = pprN3 * (indicator.rate / 100) * lineBudgetRate;
      const perPerson = perLine / lineStaffCount;

      return {
        indicator: indicator.id,
        perLine,
        perPerson
      };
    });

    return {
      lineName: line.activityName,
      staffCount: lineStaffCount,
      budgetRate: line.budgetRate || calculatedBudgetRate,
      distributions: lineDistributions
    };
  });

  // Calcul du total par indicateur (somme de toutes les lignes)
  // Formule Excel: Y19 = E19+I19+M19+Q19+U19
  const totalsByIndicator = indicators.map(indicator => {
    const total = distributions.reduce((sum, line) => {
      const dist = line.distributions.find(d => d.indicator === indicator.id);
      return sum + (dist?.perLine || 0);
    }, 0);
    return { indicator: indicator.id, total };
  });

  const colorMap: Record<string, string> = {
    yellow: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400',
    blue: 'bg-blue-500/20 border-blue-500/40 text-blue-400',
    purple: 'bg-purple-500/20 border-purple-500/40 text-purple-400',
    red: 'bg-red-500/20 border-red-500/40 text-red-400',
    green: 'bg-green-500/20 border-green-500/40 text-green-400'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 bg-gray-900/70 rounded-lg mb-6 text-center border border-gray-700">
        <h3 className="text-lg font-bold text-white">
          16 - PRIORITY ACTIONS - N+3 / Action plan or progress plan by key areas of socio-economic improvement
        </h3>
        <p className="text-sm text-gray-400 mt-2">
          Distribution des objectifs d'économie de coûts pour l'année N+3 par ligne d'activité et par indicateur de performance
        </p>
      </div>

      {/* Calendrier Fiscal - Contexte temporel N+3 */}
      <FiscalCalendarWidget
        selectedPeriod={{ year: new Date().getFullYear() + 3, quarter: 1 }}
        title="Calendrier N+3 - Trimestre 1"
        compact
        className="mb-6"
      />

      {/* Error message when data is incomplete */}
      {!hasCompleteData && (
        <div className="bg-red-900/30 border-2 border-red-500/60 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-1">
              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-red-300 mb-3">
                ⚠️ Données incomplètes - Impossible de calculer la distribution
              </h4>
              <div className="space-y-2 text-sm text-red-200">
                {pprN3 <= 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-red-400 font-bold">•</span>
                    <div>
                      <strong>PPR de l'année N+3 manquant ou nul (actuellement: {formatCurrency(pprN3, selectedCurrency)})</strong>
                      <p className="text-xs text-red-300 mt-1">
                        → Veuillez compléter les pages précédentes, notamment :
                        <br />• Page 5 : Évaluation qualitative des risques
                        <br />• Page 6 : Domaines clés d'amélioration socio-économique
                        <br />• Page 9 : Planification budgétaire sur 3 ans
                      </p>
                    </div>
                  </div>
                )}
                {businessLines.length === 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-red-400 font-bold">•</span>
                    <div>
                      <strong>Aucune ligne d'activité configurée</strong>
                      <p className="text-xs text-red-300 mt-1">
                        → Veuillez définir au moins une ligne d'activité dans les pages précédentes
                      </p>
                    </div>
                  </div>
                )}
                {totalIndicatorRate === 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-red-400 font-bold">•</span>
                    <div>
                      <strong>Aucun taux d'indicateur calculé</strong>
                      <p className="text-xs text-red-300 mt-1">
                        → Veuillez compléter Page 6 (Domaines clés) pour définir les pondérations des indicateurs
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-4 p-3 bg-red-950/40 rounded border border-red-700/50">
                <p className="text-xs text-red-200">
                  <strong>💡 Conseil :</strong> Cette page nécessite que toutes les pages précédentes soient complétées.
                  Retournez aux pages 5, 6 et 9 pour remplir les informations manquantes.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards: PPR + Staff */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gray-800/50 rounded-lg p-4 text-center border border-gray-700">
          <div className="text-sm font-bold text-gray-300 mb-1">PPR de l'année N+3</div>
          <div className="text-2xl font-bold text-green-400">{formatCurrency(pprN3, selectedCurrency)}</div>
          <div className="text-xs text-gray-400">Économie de coûts prévue</div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4 text-center border border-gray-700">
          <div className="text-sm font-bold text-gray-300 mb-1">Effectif total</div>
          <div className="text-2xl font-bold text-white">{totalStaff}</div>
          <div className="text-xs text-gray-400">Employés</div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4 text-center border border-gray-700">
          <div className="text-sm font-bold text-gray-300 mb-1">Lignes d'activité</div>
          <div className="text-2xl font-bold text-white">{businessLines.length}</div>
          <div className="text-xs text-gray-400">Lignes configurées</div>
        </div>
      </div>

      {/* Indicateurs de performance */}
      <div className="bg-gray-800/50 rounded-lg shadow-lg border border-gray-700 p-6">
        <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Target className="w-5 h-5" />
          Indicateurs de contrôle par domaine clé
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {indicators.map(indicator => {
            const total = totalsByIndicator.find(t => t.indicator === indicator.id)?.total || 0;
            return (
              <div
                key={indicator.id}
                className={`rounded-lg p-4 border ${colorMap[indicator.color]}`}
              >
                <div className="text-xs font-semibold mb-1 opacity-80">DOMAINE CLÉ</div>
                <div className="text-sm font-bold mb-2">{indicator.domain}</div>
                <div className="text-xs opacity-70 mb-2">Indicateur: {indicator.label}</div>
                <div className="flex items-baseline justify-between mt-2">
                  <div className="text-xs">Taux:</div>
                  <div className="text-lg font-mono font-bold">{indicator.rate.toFixed(1)}%</div>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <div className="text-xs">Total:</div>
                  <div className="text-sm font-mono">{formatCurrency(total, selectedCurrency)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Distribution par ligne d'activité */}
      <div className="bg-gray-800/50 rounded-lg shadow-lg border border-gray-700 p-6">
        <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Distribution par ligne d'activité
        </h4>

        <div className="space-y-6">
          {distributions.map((line, idx) => (
            <div key={idx} className="bg-gray-900/40 rounded-lg border border-gray-700 p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h5 className="text-lg font-bold text-white">{line.lineName}</h5>
                  <div className="text-xs text-gray-400">
                    Effectif: {line.staffCount} • Taux budget: {line.budgetRate.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Tableau des distributions */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 px-2 text-gray-400 font-semibold">Indicateur</th>
                      <th className="text-right py-2 px-2 text-gray-400 font-semibold">Par ligne</th>
                      <th className="text-right py-2 px-2 text-gray-400 font-semibold">Par personne</th>
                    </tr>
                  </thead>
                  <tbody>
                    {indicators.map((indicator, i) => {
                      const dist = line.distributions.find(d => d.indicator === indicator.id);
                      return (
                        <tr key={indicator.id} className="border-b border-gray-700/50">
                          <td className="py-2 px-2 text-gray-300">{indicator.label}</td>
                          <td className="text-right py-2 px-2 font-mono text-white">
                            {formatCurrency(dist?.perLine || 0, selectedCurrency)}
                          </td>
                          <td className="text-right py-2 px-2 font-mono text-green-400">
                            {formatCurrency(dist?.perPerson || 0, selectedCurrency)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Note explicative pour section annuelle */}
      <div className="bg-blue-900/20 border border-blue-700/40 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-200">
            <strong>Note:</strong> Les objectifs d'économie de coûts pour l'année N+3 sont distribués selon la pondération
            des domaines clés socio-économiques que vous avez définis (Page 6). Chaque ligne d'activité reçoit
            un objectif proportionnel à son poids budgétaire, puis cet objectif est réparti par employé.
          </div>
        </div>
      </div>

      {/* ========== SECTIONS TRIMESTRIELLES N+3 ========== */}
      {hasCompleteData && (
        <>
          {/* Les 4 trimestres - même design que la section annuelle */}
          {[1, 2, 3, 4].map(quarter => {
            const quarterPPR = pprN3 / 4;

            // Distribution par ligne pour ce trimestre
            const quarterDistributions = businessLines.map(line => {
              const lineBudget = line.budget || 0;
              const calculatedBudgetRate = totalBudget > 0 ? (lineBudget / totalBudget) * 100 : 0;
              const lineBudgetRate = (line.budgetRate || calculatedBudgetRate) / 100;
              const lineStaffCount = line.staffCount || 1;

              const lineDistributions = indicators.map(indicator => {
                const perLine = quarterPPR * (indicator.rate / 100) * lineBudgetRate;
                const perPerson = perLine / lineStaffCount;
                return {
                  indicator: indicator.id,
                  perLine,
                  perPerson
                };
              });

              return {
                lineName: line.activityName,
                staffCount: lineStaffCount,
                budgetRate: line.budgetRate || calculatedBudgetRate,
                distributions: lineDistributions
              };
            });

            // Totaux par indicateur pour ce trimestre
            const quarterTotalsByIndicator = indicators.map(indicator => {
              const total = quarterDistributions.reduce((sum, line) => {
                const dist = line.distributions.find(d => d.indicator === indicator.id);
                return sum + (dist?.perLine || 0);
              }, 0);
              return { indicator: indicator.id, total };
            });

            return (
              <React.Fragment key={quarter}>
                {/* Header du trimestre - même style que section annuelle */}
                <div className="p-4 bg-gray-900/70 rounded-lg mb-6 text-center border border-gray-700">
                  <h3 className="text-lg font-bold text-white">
                    TRIMESTRE {quarter} - ANNÉE N+3
                  </h3>
                  <p className="text-sm text-gray-400 mt-2">
                    Distribution des objectifs d'économie de coûts pour le trimestre {quarter}
                  </p>
                </div>

                {/* Summary Cards: PPR + Staff - même style que section annuelle */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-gray-800/50 rounded-lg p-4 text-center border border-gray-700">
                    <div className="text-sm font-bold text-gray-300 mb-1">PPR du Trimestre {quarter}</div>
                    <div className="text-2xl font-bold text-green-400">{formatCurrency(quarterPPR, selectedCurrency)}</div>
                    <div className="text-xs text-gray-400">Économie de coûts prévue</div>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-4 text-center border border-gray-700">
                    <div className="text-sm font-bold text-gray-300 mb-1">Effectif total</div>
                    <div className="text-2xl font-bold text-white">{totalStaff}</div>
                    <div className="text-xs text-gray-400">Employés</div>
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-4 text-center border border-gray-700">
                    <div className="text-sm font-bold text-gray-300 mb-1">Lignes d'activité</div>
                    <div className="text-2xl font-bold text-white">{businessLines.length}</div>
                    <div className="text-xs text-gray-400">Lignes configurées</div>
                  </div>
                </div>

                {/* Indicateurs de performance - même style que section annuelle */}
                <div className="bg-gray-800/50 rounded-lg shadow-lg border border-gray-700 p-6">
                  <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Indicateurs de contrôle par domaine clé - T{quarter}
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {indicators.map(indicator => {
                      const total = quarterTotalsByIndicator.find(t => t.indicator === indicator.id)?.total || 0;
                      return (
                        <div
                          key={indicator.id}
                          className={`rounded-lg p-4 border ${colorMap[indicator.color]}`}
                        >
                          <div className="text-xs font-semibold mb-1 opacity-80">DOMAINE CLÉ</div>
                          <div className="text-sm font-bold mb-2">{indicator.domain}</div>
                          <div className="text-xs opacity-70 mb-2">Indicateur: {indicator.label}</div>
                          <div className="flex items-baseline justify-between mt-2">
                            <div className="text-xs">Taux:</div>
                            <div className="text-lg font-mono font-bold">{indicator.rate.toFixed(1)}%</div>
                          </div>
                          <div className="flex items-baseline justify-between mt-1">
                            <div className="text-xs">Total:</div>
                            <div className="text-sm font-mono">{formatCurrency(total, selectedCurrency)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Distribution par ligne d'activité - même style que section annuelle */}
                <div className="bg-gray-800/50 rounded-lg shadow-lg border border-gray-700 p-6 mt-6">
                  <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Distribution par ligne d'activité - T{quarter}
                  </h4>

                  <div className="space-y-6">
                    {quarterDistributions.map((line, idx) => (
                      <div key={idx} className="bg-gray-900/40 rounded-lg border border-gray-700 p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h5 className="text-lg font-bold text-white">{line.lineName}</h5>
                            <div className="text-xs text-gray-400">
                              Effectif: {line.staffCount} • Taux budget: {line.budgetRate.toFixed(1)}%
                            </div>
                          </div>
                        </div>

                        {/* Tableau des distributions - même style que section annuelle */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-gray-700">
                                <th className="text-left py-2 px-2 text-gray-400 font-semibold">Indicateur</th>
                                <th className="text-right py-2 px-2 text-gray-400 font-semibold">Par ligne</th>
                                <th className="text-right py-2 px-2 text-gray-400 font-semibold">Par personne</th>
                              </tr>
                            </thead>
                            <tbody>
                              {indicators.map((indicator) => {
                                const dist = line.distributions.find(d => d.indicator === indicator.id);
                                return (
                                  <tr key={indicator.id} className="border-b border-gray-700/50">
                                    <td className="py-2 px-2 text-gray-300">{indicator.label}</td>
                                    <td className="text-right py-2 px-2 font-mono text-white">
                                      {formatCurrency(dist?.perLine || 0, selectedCurrency)}
                                    </td>
                                    <td className="text-right py-2 px-2 font-mono text-green-400">
                                      {formatCurrency(dist?.perPerson || 0, selectedCurrency)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Note explicative pour chaque trimestre */}
                <div className="bg-blue-900/20 border border-blue-700/40 rounded-lg p-4 mt-6 mb-8">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-200">
                      <strong>Trimestre {quarter}:</strong> Les objectifs trimestriels représentent 25% du PPR annuel N+3.
                      La distribution suit les mêmes pondérations par indicateur et par ligne d'activité.
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </>
      )}
    </div>
  );
}
