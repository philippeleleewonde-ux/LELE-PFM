import React from 'react';
import { Target, Users, AlertTriangle, TrendingUp, Calendar } from 'lucide-react';
import { CalculatedFields, Currency, BusinessLine } from '@/modules/module1/types';
import { formatCurrency } from '@/modules/module1/utils/formatting';
import { SmartDateWidget, SmartQuarterDateWidget } from '@/components/shared/SmartDateWidgets';

interface SectionJProps {
    calculated: CalculatedFields;
    selectedCurrency: Currency;
    businessLines: BusinessLine[];
}

/**
 * Section J: Priority Actions N+3
 * Source: Reproduction de la Page 16 (Priority Actions N+3)
 * Affiche le plan d'action prioritaire pour l'année N+3 : Indicateurs & Distribution par ligne
 */
export function SectionJ_PriorityActionsN3({ calculated, selectedCurrency, businessLines }: SectionJProps) {
    // Total staff et total budget
    const totalStaff = businessLines.reduce((sum, line) => sum + (line.staffCount || 0), 0);
    const totalBudget = businessLines.reduce((sum, line) => sum + (line.budget || 0), 0);

    // PPR total pour N+3 (= gainsN3 depuis feuille 9-PLANIFICATION BUDGET-3ANS)
    const pprN3 = calculated.gainsN3 || 0;

    // Vérifier si les données upstream sont complètes
    const hasCompleteData = pprN3 > 0 && businessLines.length > 0;

    // Les 5 indicateurs de performance avec leurs taux
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
            domain: "L'organisation du travail",
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
    const distributions = businessLines.map(line => {
        // Calculer le budgetRate automatiquement si non fourni
        const lineBudget = line.budget || 0;
        const calculatedBudgetRate = totalBudget > 0 ? (lineBudget / totalBudget) * 100 : 0;
        const lineBudgetRate = (line.budgetRate || calculatedBudgetRate) / 100; // Convertir % en décimal
        const lineStaffCount = line.staffCount || 1; // Éviter division par 0

        // Pour chaque indicateur: PPR × Taux indicateur × Taux budget ligne
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
    const totalsByIndicator = indicators.map(indicator => {
        const total = distributions.reduce((sum, line) => {
            const dist = line.distributions.find(d => d.indicator === indicator.id);
            return sum + (dist?.perLine || 0);
        }, 0);
        return { indicator: indicator.id, total };
    });

    const colorMap: Record<string, string> = {
        yellow: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400',
        blue: 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400',
        purple: 'bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400',
        red: 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400',
        green: 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400'
    };

    return (
        <div className="space-y-8">
            {/* Section Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-border">
                <Target className="w-6 h-6 text-primary" />
                <div>
                    <h3 className="text-xl font-bold text-foreground">Section J - Priority Actions N+3</h3>
                    <p className="text-sm text-muted-foreground">Plan d'action prioritaire par domaines clés d'amélioration socio-économique (Année N+3)</p>
                </div>
            </div>

            {/* Error message when data is incomplete */}
            {!hasCompleteData && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-bold text-destructive mb-1">Données incomplètes</h4>
                        <p className="text-sm text-destructive/80">
                            Impossible de calculer la distribution. Veuillez vérifier que le PPR N+3 est calculé (Page 9) et que les lignes d'activité sont configurées.
                        </p>
                    </div>
                </div>
            )}

            {/* 1. Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
                    <div className="text-sm font-bold text-muted-foreground mb-1 flex items-center gap-2">
                        PPR Year N+3
                        <SmartDateWidget yearsOffset={3} showIcon={false} showLockIcon={true} allowLockToggle={true} className="text-xs" />
                    </div>
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">{formatCurrency(pprN3, selectedCurrency)}</div>
                    <div className="text-xs text-muted-foreground mt-1">Targeted Cost Savings</div>
                </div>
                <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
                    <div className="text-sm font-bold text-muted-foreground mb-1">Total Staff</div>
                    <div className="text-3xl font-bold text-foreground">{totalStaff}</div>
                    <div className="text-xs text-muted-foreground mt-1">Employees Impacted</div>
                </div>
                <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
                    <div className="text-sm font-bold text-muted-foreground mb-1">Business Lines</div>
                    <div className="text-3xl font-bold text-foreground">{businessLines.length}</div>
                    <div className="text-xs text-muted-foreground mt-1">Active Units</div>
                </div>
            </div>

            {/* 2. Indicators Breakdown */}
            <div className="space-y-4">
                <h4 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Key Area Indicators & Targets
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {indicators.map(indicator => {
                        const total = totalsByIndicator.find(t => t.indicator === indicator.id)?.total || 0;
                        return (
                            <div key={indicator.id} className={`rounded-xl p-4 border ${colorMap[indicator.color]}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="text-xs font-bold uppercase tracking-wider opacity-70">KEY AREA</div>
                                    <div className="text-lg font-bold">{indicator.rate.toFixed(1)}%</div>
                                </div>
                                <div className="font-bold text-sm mb-1">{indicator.domain}</div>
                                <div className="text-xs opacity-80 mb-3">{indicator.label}</div>
                                <div className="pt-3 border-t border-current/10 flex justify-between items-center">
                                    <span className="text-xs font-semibold">Target Amount</span>
                                    <span className="font-mono font-bold">{formatCurrency(total, selectedCurrency)}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 3. Detailed Distribution Table */}
            <div className="space-y-4">
                <h4 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Distribution by Business Line
                </h4>
                <div className="space-y-6">
                    {distributions.map((line, idx) => (
                        <div key={idx} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                            <div className="bg-muted/50 p-4 border-b border-border flex justify-between items-center">
                                <div>
                                    <h5 className="font-bold text-foreground text-lg">{line.lineName}</h5>
                                    <div className="text-xs text-muted-foreground flex gap-3 mt-1">
                                        <span>Staff: <strong>{line.staffCount}</strong></span>
                                        <span>•</span>
                                        <span>Budget Weight: <strong>{line.budgetRate.toFixed(1)}%</strong></span>
                                    </div>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-muted/20 border-b border-border">
                                            <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Indicator</th>
                                            <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Target per Line</th>
                                            <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Target per Person</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {indicators.map((indicator) => {
                                            const dist = line.distributions.find(d => d.indicator === indicator.id);
                                            return (
                                                <tr key={indicator.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                                                    <td className="py-3 px-4 font-medium text-foreground">{indicator.label}</td>
                                                    <td className="text-right py-3 px-4 font-mono text-foreground">
                                                        {formatCurrency(dist?.perLine || 0, selectedCurrency)}
                                                    </td>
                                                    <td className="text-right py-3 px-4 font-mono text-green-600 dark:text-green-400 font-bold">
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

            {/* ========== SECTIONS TRIMESTRIELLES N+3 ========== */}
            {hasCompleteData && (
                <>
                    {[1, 2, 3, 4].map(quarter => {
                        const quarterPPR = pprN3 / 4;

                        // Distribution trimestrielle par ligne d'activité
                        const quarterDistributions = businessLines.map(line => {
                            const lineBudget = line.budget || 0;
                            const calculatedBudgetRate = totalBudget > 0 ? (lineBudget / totalBudget) * 100 : 0;
                            const lineBudgetRate = (line.budgetRate || calculatedBudgetRate) / 100;
                            const lineStaffCount = line.staffCount || 1;

                            const lineDistributions = indicators.map(indicator => {
                                const perLine = quarterPPR * (indicator.rate / 100) * lineBudgetRate;
                                const perPerson = perLine / lineStaffCount;
                                return { indicator: indicator.id, perLine, perPerson };
                            });

                            return {
                                lineName: line.activityName,
                                staffCount: lineStaffCount,
                                budgetRate: line.budgetRate || calculatedBudgetRate,
                                distributions: lineDistributions
                            };
                        });

                        // Total trimestriel par indicateur
                        const quarterTotalsByIndicator = indicators.map(indicator => {
                            const total = quarterDistributions.reduce((sum, line) => {
                                const dist = line.distributions.find(d => d.indicator === indicator.id);
                                return sum + (dist?.perLine || 0);
                            }, 0);
                            return { indicator: indicator.id, total };
                        });

                        return (
                            <React.Fragment key={quarter}>
                                {/* Quarterly Header */}
                                <div className="flex items-center gap-3 pb-3 border-b border-border mt-10">
                                    <Calendar className="w-6 h-6 text-orange-500" />
                                    <div>
                                        <h3 className="text-xl font-bold text-foreground">Trimestre T{quarter} - N+3</h3>
                                        <p className="text-sm text-muted-foreground">Distribution trimestrielle des objectifs (PPR annuel / 4)</p>
                                    </div>
                                </div>

                                {/* Quarterly Summary Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
                                        <div className="text-sm font-bold text-muted-foreground mb-1 flex items-center gap-2">
                                            PPR T{quarter} N+3
                                            <SmartQuarterDateWidget yearsOffset={3} quarter={quarter as 1 | 2 | 3 | 4} showLockIcon={true} allowLockToggle={true} className="text-xs" />
                                        </div>
                                        <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{formatCurrency(quarterPPR, selectedCurrency)}</div>
                                        <div className="text-xs text-muted-foreground mt-1">Quarterly Target (1/4)</div>
                                    </div>
                                    <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
                                        <div className="text-sm font-bold text-muted-foreground mb-1">Total Staff</div>
                                        <div className="text-3xl font-bold text-foreground">{totalStaff}</div>
                                        <div className="text-xs text-muted-foreground mt-1">Employees Impacted</div>
                                    </div>
                                    <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
                                        <div className="text-sm font-bold text-muted-foreground mb-1">Business Lines</div>
                                        <div className="text-3xl font-bold text-foreground">{businessLines.length}</div>
                                        <div className="text-xs text-muted-foreground mt-1">Active Units</div>
                                    </div>
                                </div>

                                {/* Quarterly Indicators */}
                                <div className="space-y-4">
                                    <h4 className="text-lg font-bold text-foreground flex items-center gap-2">
                                        <Target className="w-5 h-5 text-orange-500" />
                                        Key Area Indicators T{quarter}
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {indicators.map(indicator => {
                                            const total = quarterTotalsByIndicator.find(t => t.indicator === indicator.id)?.total || 0;
                                            return (
                                                <div key={indicator.id} className={`rounded-xl p-4 border ${colorMap[indicator.color]}`}>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="text-xs font-bold uppercase tracking-wider opacity-70">KEY AREA</div>
                                                        <div className="text-lg font-bold">{indicator.rate.toFixed(1)}%</div>
                                                    </div>
                                                    <div className="font-bold text-sm mb-1">{indicator.domain}</div>
                                                    <div className="text-xs opacity-80 mb-3">{indicator.label}</div>
                                                    <div className="pt-3 border-t border-current/10 flex justify-between items-center">
                                                        <span className="text-xs font-semibold">T{quarter} Target</span>
                                                        <span className="font-mono font-bold">{formatCurrency(total, selectedCurrency)}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Quarterly Distribution by Line */}
                                <div className="space-y-4">
                                    <h4 className="text-lg font-bold text-foreground flex items-center gap-2">
                                        <Users className="w-5 h-5 text-orange-500" />
                                        Distribution T{quarter} by Business Line
                                    </h4>
                                    <div className="space-y-6">
                                        {quarterDistributions.map((line, idx) => (
                                            <div key={idx} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                                                <div className="bg-orange-500/10 p-4 border-b border-border flex justify-between items-center">
                                                    <div>
                                                        <h5 className="font-bold text-foreground text-lg">{line.lineName}</h5>
                                                        <div className="text-xs text-muted-foreground flex gap-3 mt-1">
                                                            <span>Staff: <strong>{line.staffCount}</strong></span>
                                                            <span>•</span>
                                                            <span>Budget Weight: <strong>{line.budgetRate.toFixed(1)}%</strong></span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm">
                                                        <thead>
                                                            <tr className="bg-muted/20 border-b border-border">
                                                                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Indicator</th>
                                                                <th className="text-right py-3 px-4 font-semibold text-muted-foreground">T{quarter} per Line</th>
                                                                <th className="text-right py-3 px-4 font-semibold text-muted-foreground">T{quarter} per Person</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {indicators.map((indicator) => {
                                                                const dist = line.distributions.find(d => d.indicator === indicator.id);
                                                                return (
                                                                    <tr key={indicator.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                                                                        <td className="py-3 px-4 font-medium text-foreground">{indicator.label}</td>
                                                                        <td className="text-right py-3 px-4 font-mono text-foreground">
                                                                            {formatCurrency(dist?.perLine || 0, selectedCurrency)}
                                                                        </td>
                                                                        <td className="text-right py-3 px-4 font-mono text-orange-600 dark:text-orange-400 font-bold">
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
                            </React.Fragment>
                        );
                    })}
                </>
            )}
        </div>
    );
}
