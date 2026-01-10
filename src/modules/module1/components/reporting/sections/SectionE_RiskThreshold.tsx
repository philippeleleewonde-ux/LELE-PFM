import React from 'react';
import { Shield, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { CalculatedFields, BusinessLine, Currency, QualitativeAssessment } from '@/modules/module1/types';
import { formatCurrency } from '@/modules/module1/utils/formatting';

interface SectionEProps {
    calculated: CalculatedFields;
    businessLines: BusinessLine[];
    qualitativeData: QualitativeAssessment;
    selectedCurrency: Currency;
}

/**
 * Section E: Breakdown of the amount of losses related to risk appetite threshold
 * Source: Reproduction de la Page 11 (Risk Threshold)
 */
export function SectionE_RiskThreshold({ calculated, businessLines, qualitativeData, selectedCurrency }: SectionEProps) {
    // Historic Risk Appetite (RA1) per source: field 181 = 169 + 175
    const ra = calculated.historicRiskAppetite ?? ((calculated.totalSeuilHistorique || 0) + (calculated.ulCalcul || 0));
    // New threshold (section 2) matches source screenshots: equals Forecast Expected Losses
    const newThreshold = (calculated.forecastEL ?? 0);

    const totalBudget = businessLines.reduce((sum, line) => sum + (line.budget || 0), 0) || 1;

    const chartData = businessLines.map(line => {
        const weight = (line.budget || 0) / totalBudget;
        const historicValue = ra * weight;
        const newValue = newThreshold * weight;
        const qualityMargin = newThreshold * weight; // Based on Page 11 logic

        return {
            name: line.activityName.length > 15 ? line.activityName.substring(0, 15) + '...' : line.activityName,
            fullName: line.activityName,
            historicValue,
            newValue,
            qualityMargin,
            weightPct: weight * 100
        };
    });

    return (
        <div className="space-y-6">
            {/* Section Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-border">
                <Shield className="w-6 h-6 text-primary" />
                <div>
                    <h3 className="text-xl font-bold text-foreground">Section E - Breakdown of Losses & Risk Appetite</h3>
                    <p className="text-sm text-muted-foreground">Ventilation des pertes par seuil d'appétence au risque (Données Page 11)</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-card border border-border rounded-lg p-6 shadow-sm">

                {/* Chart Section */}
                <div className="mb-8 bg-card rounded-lg border border-border p-4 shadow-sm">
                    <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-primary" />
                        Comparaison des Seuils par Ligne d'Activité
                    </h4>
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                                <Tooltip
                                    formatter={(value: number) => formatCurrency(value, selectedCurrency)}
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                                />
                                <Legend />
                                <Bar dataKey="historicValue" name="Historic Losses" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="newValue" name="New Threshold" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="qualityMargin" name="Quality Margin" fill="#4ade80" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Detailed Data Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 1- Historic RA */}
                    <div className="bg-muted/20 rounded-lg border border-border p-4">
                        <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                            <TrendingDown className="w-4 h-4 text-amber-500" />
                            1. Historic Losses (Usual Appetite)
                        </h4>
                        <div className="space-y-3">
                            {chartData.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground truncate w-2/3" title={item.fullName}>{item.name}</span>
                                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                                        {formatCurrency(item.historicValue, selectedCurrency)}
                                    </span>
                                </div>
                            ))}
                            <div className="pt-3 border-t border-border flex justify-between items-center font-bold">
                                <span>Total</span>
                                <span className="text-amber-600 dark:text-amber-400">{formatCurrency(ra, selectedCurrency)}</span>
                            </div>
                        </div>
                    </div>

                    {/* 2- New RA */}
                    <div className="bg-muted/20 rounded-lg border border-border p-4">
                        <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-blue-500" />
                            2. New Risk Appetite Threshold
                        </h4>
                        <div className="space-y-3">
                            {chartData.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground truncate w-2/3" title={item.fullName}>{item.name}</span>
                                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                                        {formatCurrency(item.newValue, selectedCurrency)}
                                    </span>
                                </div>
                            ))}
                            <div className="pt-3 border-t border-border flex justify-between items-center font-bold">
                                <span>Total</span>
                                <span className="text-blue-600 dark:text-blue-400">{formatCurrency(newThreshold, selectedCurrency)}</span>
                            </div>
                        </div>
                    </div>

                    {/* 3- Quality Margin */}
                    <div className="bg-muted/20 rounded-lg border border-border p-4">
                        <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-green-500" />
                            3. Margin of Total Quality
                        </h4>
                        <div className="space-y-3">
                            {chartData.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground truncate w-2/3" title={item.fullName}>{item.name}</span>
                                    <span className="font-mono font-bold text-green-600 dark:text-green-400">
                                        {formatCurrency(item.qualityMargin, selectedCurrency)}
                                    </span>
                                </div>
                            ))}
                            <div className="pt-3 border-t border-border flex justify-between items-center font-bold">
                                <span>Total</span>
                                <span className="text-green-600 dark:text-green-400">{formatCurrency(newThreshold, selectedCurrency)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
