import React from 'react';
import { Calendar, TrendingUp, Coins, Clock, BarChart3 } from 'lucide-react';
import { CalculatedFields, Currency } from '@/modules/module1/types';
import { formatCurrency } from '@/modules/module1/utils/formatting';
import { SmartWeekLabel } from '@/components/shared/SmartDateWidgets';

interface SectionGProps {
    calculated: CalculatedFields;
    selectedCurrency: Currency;
}

/**
 * Section G: Dashboard of the real-time driving plan
 * Source: Reproduction de la Page 13 (Dashboard)
 * Affiche le pilotage temps réel des primes (Bonus) : Annuel -> Trimestriel -> Mensuel -> Hebdomadaire
 */
export function SectionG_RealTimeDashboard({ calculated, selectedCurrency }: SectionGProps) {
    const dashboardData = [
        {
            year: 'N+1',
            totalBonus: calculated.primesN1 || 0,
            quarterlyBonus: calculated.quarterlyBonusN1 || 0,
            monthlyBonus: calculated.monthlyBonusN1 || 0,
            weeklyBonus: calculated.weeklyBonusN1 || 0,
            color: 'blue'
        },
        {
            year: 'N+2',
            totalBonus: calculated.primesN2 || 0,
            quarterlyBonus: calculated.quarterlyBonusN2 || 0,
            monthlyBonus: calculated.monthlyBonusN2 || 0,
            weeklyBonus: calculated.weeklyBonusN2 || 0,
            color: 'purple'
        },
        {
            year: 'N+3',
            totalBonus: calculated.primesN3 || 0,
            quarterlyBonus: calculated.quarterlyBonusN3 || 0,
            monthlyBonus: calculated.monthlyBonusN3 || 0,
            weeklyBonus: calculated.weeklyBonusN3 || 0,
            color: 'green'
        }
    ];

    const quarterOrdinal = (q: number) => (q === 1 ? '1st' : q === 2 ? '2nd' : q === 3 ? '3rd' : '4th');
    const monthOrdinal = (m: number) => (m === 1 ? '1st' : m === 2 ? '2nd' : '3rd');

    return (
        <div className="space-y-8">
            {/* Section Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-border">
                <Calendar className="w-6 h-6 text-primary" />
                <div>
                    <h3 className="text-xl font-bold text-foreground">Section G - Real-Time Driving Plan Dashboard</h3>
                    <p className="text-sm text-muted-foreground">Pilotage temps réel de la performance financière interne (Primes / Variable)</p>
                </div>
            </div>

            {/* 1. Summary Cards (Annual Overview) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {dashboardData.map((yearData) => (
                    <div key={yearData.year} className={`bg-card rounded-xl p-6 border border-border shadow-sm hover:border-${yearData.color}-500/50 transition-all duration-300 group`}>
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-lg bg-${yearData.color}-500/10 text-${yearData.color}-500 group-hover:bg-${yearData.color}-500 group-hover:text-white transition-colors`}>
                                <Coins className="w-6 h-6" />
                            </div>
                            <div className={`text-sm font-bold px-3 py-1 rounded-full bg-${yearData.color}-500/10 text-${yearData.color}-600 dark:text-${yearData.color}-400`}>
                                Year {yearData.year}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Total Annual Bonuses</div>
                            <div className="text-3xl font-bold text-foreground">{formatCurrency(yearData.totalBonus, selectedCurrency)}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 2. Detailed Breakdown (Tabs-like view) */}
            <div className="space-y-8">
                {dashboardData.map((yearData) => (
                    <div key={yearData.year} className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                        <div className="bg-muted/50 p-4 border-b border-border flex items-center gap-3">
                            <BarChart3 className={`w-5 h-5 text-${yearData.color}-500`} />
                            <h4 className="font-bold text-foreground">Breakdown for Year {yearData.year}</h4>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                {/* Quarterly */}
                                <div className="bg-muted/20 p-5 rounded-xl border border-border">
                                    <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                                        <Calendar className="w-4 h-4" />
                                        <span className="text-sm font-semibold">Quarterly Average</span>
                                    </div>
                                    <p className="text-2xl font-mono font-bold text-foreground">{formatCurrency(yearData.quarterlyBonus, selectedCurrency)}</p>
                                </div>
                                {/* Monthly */}
                                <div className="bg-muted/20 p-5 rounded-xl border border-border">
                                    <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                                        <Calendar className="w-4 h-4" />
                                        <span className="text-sm font-semibold">Monthly Average</span>
                                    </div>
                                    <p className="text-2xl font-mono font-bold text-foreground">{formatCurrency(yearData.monthlyBonus, selectedCurrency)}</p>
                                </div>
                                {/* Weekly */}
                                <div className="bg-muted/20 p-5 rounded-xl border border-border">
                                    <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-sm font-semibold">Weekly Average</span>
                                    </div>
                                    <p className="text-2xl font-mono font-bold text-foreground">{formatCurrency(yearData.weeklyBonus, selectedCurrency)}</p>
                                </div>
                            </div>

                            {/* Visual Schedule (Sample Quarter) */}
                            <div className="space-y-4">
                                <h5 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Sample Quarter Schedule</h5>
                                <div className="bg-muted/10 rounded-lg border border-border p-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className={`w-3 h-3 rounded-full bg-${yearData.color}-500`}></div>
                                        <span className="font-bold text-foreground">Quarter 1</span>
                                        <span className="text-muted-foreground text-sm">- Cash Outflows Schedule</span>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                        {[0, 1, 2].map((monthOffset) => {
                                            const yearOffset = yearData.year === 'N+1' ? 1 : yearData.year === 'N+2' ? 2 : 3;
                                            const monthIndex = monthOffset; // 0=Janvier, 1=Février, 2=Mars pour Q1
                                            return (
                                                <div key={`m-${monthOffset}`} className="bg-card rounded-lg border border-border p-3 shadow-sm">
                                                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-border">
                                                        <span className="text-sm font-semibold text-foreground">Month {monthOffset + 1}</span>
                                                        <span className={`text-xs font-mono font-bold text-${yearData.color}-600 dark:text-${yearData.color}-400`}>
                                                            {formatCurrency(yearData.monthlyBonus, selectedCurrency)}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {[0, 1, 2, 3].map((weekIndex) => (
                                                            <div key={`w-${weekIndex}`} className="flex justify-between items-center text-xs">
                                                                <SmartWeekLabel
                                                                    yearsOffset={yearOffset}
                                                                    monthIndex={monthIndex}
                                                                    weekIndex={weekIndex}
                                                                />
                                                                <span className="font-mono text-foreground">{formatCurrency(yearData.weeklyBonus, selectedCurrency)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
