import React from 'react';
import { DollarSign, AlertCircle, TrendingUp, CheckCircle, Users, Target, BarChart3, PieChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart as RechartsPieChart, Pie } from 'recharts';
import { CalculatedFields, BusinessLine, QualitativeAssessment, SocioeconomicImprovement, Currency } from '@/modules/module1/types';
import { CFOCalculationEngine } from '@/modules/module1/lib/calculations';
import { formatCurrency } from '@/modules/module1/utils/formatting';

interface SectionDProps {
    calculated: CalculatedFields;
    businessLines: BusinessLine[];
    qualitativeData: QualitativeAssessment;
    socioeconomicData: SocioeconomicImprovement;
    selectedCurrency: Currency;
}

/**
 * Section D: Breakdown of the programmed economic benefit
 * Source: Reproduction de la Page 10 (Economic Breakdown)
 * Affiche la ventilation du gain total par ligne d'activité et par type de risque, avec graphiques.
 */
export function SectionD_EconomicBreakdown({ calculated, businessLines, qualitativeData, socioeconomicData, selectedCurrency }: SectionDProps) {
    const varAmount = calculated.var || 0;

    const riskTypesConfig = [
        {
            id: 'operationalRiskIncidents' as keyof QualitativeAssessment,
            label: 'Operational Risk',
            shortLabel: 'Op. Risk',
            icon: <AlertCircle className="w-4 h-4" />,
            color: '#3b82f6' // blue-500
        },
        {
            id: 'creditRiskAssessment' as keyof QualitativeAssessment,
            label: 'Credit Risk',
            shortLabel: 'Credit',
            icon: <DollarSign className="w-4 h-4" />,
            color: '#8b5cf6' // purple-500
        },
        {
            id: 'marketVolatility' as keyof QualitativeAssessment,
            label: 'Market Risk',
            shortLabel: 'Market',
            icon: <TrendingUp className="w-4 h-4" />,
            color: '#f59e0b' // amber-500
        },
        {
            id: 'liquidityPosition' as keyof QualitativeAssessment,
            label: 'Transformation Risk',
            shortLabel: 'Transf.',
            icon: <CheckCircle className="w-4 h-4" />,
            color: '#10b981' // emerald-500
        },
        {
            id: 'reputationalFactors' as keyof QualitativeAssessment,
            label: 'Organizational Risk',
            shortLabel: 'Org.',
            icon: <Users className="w-4 h-4" />,
            color: '#ec4899' // pink-500
        },
        {
            id: 'strategicAlignment' as keyof QualitativeAssessment,
            label: 'Specific Health/Ins.',
            shortLabel: 'Health',
            icon: <Target className="w-4 h-4" />,
            color: '#ef4444' // red-500
        }
    ];

    // Socioeconomic weights calculation (same as Page 10)
    if (!socioeconomicData) return <div className="p-4 text-red-500">Données socio-économiques manquantes</div>;

    const s1 = CFOCalculationEngine.convertSocioQualToWeight(socioeconomicData.keyArea1_workingConditions || 'Low');
    const s2 = CFOCalculationEngine.convertSocioQualToWeight(socioeconomicData.keyArea2_workOrganization || 'Low');
    const s3 = CFOCalculationEngine.convertSocioQualToWeight(socioeconomicData.keyArea3_communication || 'Low');
    const s4 = CFOCalculationEngine.convertSocioQualToWeight(socioeconomicData.keyArea4_timeManagement || 'Low');
    const s5 = CFOCalculationEngine.convertSocioQualToWeight(socioeconomicData.keyArea5_training || 'Low');
    const s6 = CFOCalculationEngine.convertSocioQualToWeight(socioeconomicData.keyArea6_strategy || 'Low');
    const socioDenom = (s1 + s2 + s3 + s4 + s5 + s6) || 1;

    const w205 = (s1 / socioDenom) * 100;
    const w206 = (s2 / socioDenom) * 100;
    const w207 = ((s3 + s5) / socioDenom) * 100;
    const w208 = (s4 / socioDenom) * 100;
    const w209 = (s6 / socioDenom) * 100;

    const socioRiskWeights = [w205, w206, w207, w208, w207, w209];

    const riskEntries = riskTypesConfig.map((risk, idx) => ({
        ...risk,
        weight: socioRiskWeights[idx] || 0,
        amount: (varAmount * (socioRiskWeights[idx] || 0)) / 100
    }));

    const totalBudget = businessLines.reduce((sum, line) => sum + (line.budget || 0), 0);
    const lineWeights = businessLines.map(line => ({
        id: line.id,
        name: line.activityName,
        weight: totalBudget > 0 ? ((line.budget || 0) / totalBudget) * 100 : 0,
        budget: line.budget || 0
    }));

    const calculateCellValue = (lineWeight: number, riskWeight: number) => {
        return (varAmount * lineWeight / 100) * (riskWeight / 100);
    };

    // Data preparation for charts
    const chartDataByRisk = riskEntries.map(risk => ({
        name: risk.shortLabel,
        fullLabel: risk.label,
        value: risk.amount,
        color: risk.color
    })).filter(d => d.value > 0);

    const chartDataByBusinessLine = lineWeights.map(line => ({
        name: line.name.length > 15 ? line.name.substring(0, 15) + '...' : line.name,
        fullName: line.name,
        value: (varAmount * line.weight) / 100,
        color: '#0ea5e9' // sky-500
    })).filter(d => d.value > 0);

    return (
        <div className="space-y-6">
            {/* Section Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-border">
                <BarChart3 className="w-6 h-6 text-primary" />
                <div>
                    <h3 className="text-xl font-bold text-foreground">Section D - Economic Benefit Breakdown</h3>
                    <p className="text-sm text-muted-foreground">Ventilation par risques et lignes d'activité (Données Page 10)</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                <div className="p-4 bg-muted/50 rounded-lg mb-6 text-center border border-border">
                    <h3 className="text-lg font-bold text-foreground">Breakdown of the programmed economic benefit</h3>
                    <p className="text-sm text-muted-foreground">
                        Total Economic Benefit (VaR): <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(varAmount, selectedCurrency)}</span>
                    </p>
                </div>

                {/* Charts Section - CEO View */}
                {/* Charts Section - CEO View */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Risk Distribution Chart (Correct Rates from Page 10) */}
                    <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
                        <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                            <PieChart className="w-4 h-4 text-primary" />
                            Répartition par Catégorie de Risque (Taux Page 10)
                        </h4>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsPieChart>
                                    <Pie
                                        data={riskEntries}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="weight"
                                        nameKey="shortLabel"
                                        label={({ shortLabel, weight }) => `${shortLabel} ${weight.toFixed(2)}%`}
                                    >
                                        {riskEntries.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number) => `${value.toFixed(2)}%`}
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                                    />
                                    <Legend />
                                </RechartsPieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Coverage Amount by Business Line per Risk Category */}
                    <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
                        <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-primary" />
                            Couverture par Ligne d'Activité (pour chaque Risque)
                        </h4>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={riskEntries.map(risk => ({
                                        name: risk.shortLabel,
                                        ...lineWeights.reduce((acc, line) => ({
                                            ...acc,
                                            [line.name]: calculateCellValue(line.weight, risk.weight)
                                        }), {})
                                    }))}
                                    layout="vertical"
                                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                                    <XAxis type="number" hide />
                                    <YAxis type="category" dataKey="name" width={80} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                                    <Tooltip
                                        formatter={(value: number) => formatCurrency(value, selectedCurrency)}
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                                    />
                                    <Legend />
                                    {lineWeights.map((line, index) => (
                                        <Bar key={line.id} dataKey={line.name} stackId="a" fill={['#0ea5e9', '#22c55e', '#eab308', '#f97316', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'][index % 8]} />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Detailed Breakdown Table (Source View) */}
                <div className="space-y-6">
                    <h4 className="text-md font-bold text-foreground border-b border-border pb-2">Détail par Indicateur de Risque</h4>
                    {riskEntries.map((risk) => (
                        <div key={risk.id} className="bg-muted/20 rounded-lg border border-border p-4 hover:border-primary/30 transition-colors">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                    <div className={`p-2 rounded-full bg-opacity-10`} style={{ backgroundColor: `${risk.color}20`, color: risk.color }}>
                                        {risk.icon}
                                    </div>
                                    <h4 className="text-md font-bold text-foreground">{risk.label}</h4>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold text-foreground">{formatCurrency(risk.amount, selectedCurrency)}</div>
                                    <div className="text-xs text-muted-foreground">Poids: {risk.weight.toFixed(2)}%</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {lineWeights.map((line) => (
                                    <div key={`${risk.id}-${line.id}`} className="bg-card rounded-md border border-border p-3 shadow-sm">
                                        <div className="text-xs text-muted-foreground mb-1 truncate" title={line.name}>{line.name}</div>
                                        <div className="text-sm font-mono font-bold text-foreground">
                                            {formatCurrency(calculateCellValue(line.weight, risk.weight), selectedCurrency)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
