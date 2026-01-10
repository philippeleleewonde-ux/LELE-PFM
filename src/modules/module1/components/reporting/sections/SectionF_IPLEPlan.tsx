import React from 'react';
import { TrendingUp, Coins, Activity, AlertTriangle, UserX, Clock, BookOpen, Target } from 'lucide-react';
import { CalculatedFields, Currency, QualitativeAssessment, SocioeconomicImprovement } from '@/modules/module1/types';
import { formatCurrency } from '@/modules/module1/utils/formatting';
import { CFOCalculationEngine } from '@/modules/module1/lib/calculations';
import { SmartDateWidget } from '@/components/shared/SmartDateWidgets';

interface SectionFProps {
    calculated: CalculatedFields;
    selectedCurrency: Currency;
    socioeconomicData: SocioeconomicImprovement;
    qualitativeData: QualitativeAssessment;
}

/**
 * Section F: Breakdown of the Incentivized Pay Leverage Effect (IPLE)
 * Source: Reproduction de la Page 12 (IPLE Plan)
 * Focus: Mise en avant "éclatante" des 5 indicateurs de performance (ABS, QD, OA, DDP, EKH)
 */
export function SectionF_IPLEPlan({ calculated, selectedCurrency, socioeconomicData, qualitativeData }: SectionFProps) {
    const years = [
        { year: 'N+1', gain: calculated.gainsN1 || 0, cashFlow: calculated.cashFlowN1 || 0, bonuses: calculated.primesN1 || 0, percentRecovered: 30 },
        { year: 'N+2', gain: calculated.gainsN2 || 0, cashFlow: calculated.cashFlowN2 || 0, bonuses: calculated.primesN2 || 0, percentRecovered: 60 },
        { year: 'N+3', gain: calculated.gainsN3 || 0, cashFlow: calculated.cashFlowN3 || 0, bonuses: calculated.primesN3 || 0, percentRecovered: 100 }
    ];

    // Socioeconomic weights calculation (same as Page 12)
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

    // Indicators Configuration for "Big Cards"
    const indicators = [
        {
            id: 'ABS',
            label: 'Absenteeism',
            fullLabel: 'Absenteeism (ABS)',
            weight: w208,
            icon: <UserX className="w-8 h-8 text-white" />,
            color: 'from-orange-500 to-red-500',
            description: 'Time Management & Regulation'
        },
        {
            id: 'QD',
            label: 'Quality Defects',
            fullLabel: 'Quality defects (QD)',
            weight: w206,
            icon: <AlertTriangle className="w-8 h-8 text-white" />,
            color: 'from-yellow-500 to-orange-500',
            description: 'Work Organization'
        },
        {
            id: 'OA',
            label: 'Occupational Accidents',
            fullLabel: 'Occupational accidents (OA)',
            weight: w205,
            icon: <Activity className="w-8 h-8 text-white" />,
            color: 'from-red-500 to-pink-600',
            description: 'Working Conditions'
        },
        {
            id: 'DDP',
            label: 'Direct Productivity Gap',
            fullLabel: 'Distances from direct productivity (DDP)',
            weight: w209,
            icon: <Target className="w-8 h-8 text-white" />,
            color: 'from-blue-500 to-indigo-600',
            description: 'Strategic Implementation'
        },
        {
            id: 'EKH',
            label: 'Know-How Gap',
            fullLabel: 'Distances from Know-how (EKH)',
            weight: w207,
            icon: <BookOpen className="w-8 h-8 text-white" />,
            color: 'from-purple-500 to-violet-600',
            description: 'Communication & Training'
        },
    ];

    // Risk breakdown keys (Fixed distribution matching source)
    const riskItems = [
        { id: 'operationalRiskIncidents', label: 'Operational Risk' },
        { id: 'creditRiskAssessment', label: 'Credit Risk' },
        { id: 'marketVolatility', label: 'Market Risk' },
        { id: 'liquidityPosition', label: 'Transformation Risk' },
        { id: 'reputationalFactors', label: 'Organizational Risk' },
        { id: 'strategicAlignment', label: 'Specific Health Risk' },
    ];
    const riskRatio = [30, 10, 5, 14, 13, 12];
    const riskWeights = riskRatio.map(x => (x / 84) * 100);

    const totalCashFlow = (calculated.cashFlowN1 || 0) + (calculated.cashFlowN2 || 0) + (calculated.cashFlowN3 || 0);
    const totalBonuses = (calculated.primesN1 || 0) + (calculated.primesN2 || 0) + (calculated.primesN3 || 0);

    return (
        <div className="space-y-8">
            {/* Section Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-border">
                <TrendingUp className="w-6 h-6 text-primary" />
                <div>
                    <h3 className="text-xl font-bold text-foreground">Section F - IPLE Plan & Performance Indicators</h3>
                    <p className="text-sm text-muted-foreground">Pilotage des indicateurs de performance et plan IPLE sur 3 ans</p>
                </div>
            </div>

            {/* 1. PERFORMANCE INDICATORS - "ECLATANT" DISPLAY */}
            <div className="space-y-4">
                <h4 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Key Performance Indicators (Drivers of Economic Benefit)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {indicators.map((indicator) => (
                        <div key={indicator.id} className={`relative overflow-hidden rounded-xl shadow-lg bg-gradient-to-br ${indicator.color} p-1 transition-transform hover:scale-105 duration-300`}>
                            <div className="absolute top-0 right-0 p-4 opacity-20 transform translate-x-2 -translate-y-2">
                                {indicator.icon}
                            </div>
                            <div className="bg-card/10 backdrop-blur-sm h-full rounded-lg p-4 flex flex-col justify-between text-white">
                                <div>
                                    <div className="bg-white/20 w-fit p-2 rounded-lg mb-3">
                                        {indicator.icon}
                                    </div>
                                    <h5 className="font-bold text-lg leading-tight mb-1 !text-black">{indicator.fullLabel}</h5>
                                    <p className="text-xs text-white/80 mb-4">{indicator.description}</p>
                                </div>
                                <div>
                                    <div className="text-xs uppercase tracking-wider opacity-80 mb-1">Impact Weight</div>
                                    <div className="text-2xl font-mono font-bold">{indicator.weight.toFixed(1)}%</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 2. 3-YEAR PLAN BREAKDOWN */}
            <div className="space-y-8">
                {years.map((y, idx) => {
                    const socioBreakdown = indicators.map(k => ({ ...k, amount: (y.gain * k.weight) / 100 }));
                    const riskBreakdown = riskItems.map((r, i) => ({ label: r.label, weight: riskWeights[i], amount: (y.cashFlow * riskWeights[i]) / 100 }));

                    return (
                        <div key={y.year} className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                            {/* Year Header */}
                            <div className="bg-muted/50 p-4 border-b border-border flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary/10 text-primary font-bold px-3 py-1 rounded text-sm">YEAR {y.year}</div>
                                    <span className="text-sm text-muted-foreground">Recovery Plan: {y.percentRecovered}%</span>
                                    <SmartDateWidget yearsOffset={idx + 1} showIcon={false} showLockIcon={true} allowLockToggle={true} className="text-xs" />
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-muted-foreground">Total Economic Benefit</div>
                                    <div className="text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(y.gain, selectedCurrency)}</div>
                                </div>
                            </div>

                            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Left: Socio-Economic Breakdown (Source of Funds) */}
                                <div className="space-y-4">
                                    <h5 className="text-sm font-bold text-foreground border-b border-border pb-2">
                                        Sources: Economic Benefit by Indicator
                                    </h5>
                                    <div className="space-y-3">
                                        {socioBreakdown.map(item => (
                                            <div key={item.id} className="flex items-center justify-between bg-muted/20 p-2 rounded hover:bg-muted/40 transition-colors">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${item.color}`}></div>
                                                    <span className="text-sm text-foreground">{item.fullLabel}</span>
                                                </div>
                                                <span className="font-mono font-bold text-sm text-foreground">{formatCurrency(item.amount, selectedCurrency)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="pt-2 flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Total Sources</span>
                                        <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(y.gain, selectedCurrency)}</span>
                                    </div>
                                </div>

                                {/* Right: Distribution (Uses of Funds) */}
                                <div className="space-y-4">
                                    <h5 className="text-sm font-bold text-foreground border-b border-border pb-2">
                                        Distribution: IPLE & Bonuses
                                    </h5>

                                    {/* Main Split Cards */}
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                                            <div className="text-xs text-green-600 dark:text-green-400 font-bold mb-1">Company Cash Flow (67%)</div>
                                            <div className="text-lg font-mono font-bold text-green-700 dark:text-green-300">{formatCurrency(y.cashFlow, selectedCurrency)}</div>
                                        </div>
                                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                                            <div className="text-xs text-blue-600 dark:text-blue-400 font-bold mb-1">Staff Bonuses (33%)</div>
                                            <div className="text-lg font-mono font-bold text-blue-700 dark:text-blue-300">{formatCurrency(y.bonuses, selectedCurrency)}</div>
                                        </div>
                                    </div>

                                    {/* Risk Breakdown of Cash Flow */}
                                    <div className="space-y-2">
                                        <div className="text-xs text-muted-foreground mb-1">Cash Flow Allocation by Risk Type:</div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {riskBreakdown.map((r, i) => (
                                                <div key={i} className="flex justify-between items-center text-xs bg-muted/20 p-1.5 rounded">
                                                    <span className="text-muted-foreground truncate pr-2">{r.label}</span>
                                                    <span className="font-mono text-foreground">{formatCurrency(r.amount, selectedCurrency)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 3. TOTAL SUMMARY */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-6 text-white shadow-xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                    <div>
                        <div className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Total 3-Year Gain</div>
                        <div className="text-3xl font-bold text-white">{formatCurrency(totalCashFlow + totalBonuses, selectedCurrency)}</div>
                    </div>
                    <div>
                        <div className="text-green-400 text-sm font-bold uppercase tracking-wider mb-2">Total Net Cash Flow</div>
                        <div className="text-3xl font-bold text-green-400">{formatCurrency(totalCashFlow, selectedCurrency)}</div>
                    </div>
                    <div>
                        <div className="text-blue-400 text-sm font-bold uppercase tracking-wider mb-2">Total Staff Incentives</div>
                        <div className="text-3xl font-bold text-blue-400">{formatCurrency(totalBonuses, selectedCurrency)}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
