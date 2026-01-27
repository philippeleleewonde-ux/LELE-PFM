import React from 'react';
import { Briefcase, Users, MessageSquare, Clock, Target, Shield } from 'lucide-react';
import { CalculatedFields, Currency, SocioeconomicImprovement } from '@/modules/module1/types';
import { formatCurrency } from '@/modules/module1/utils/formatting';
import { CFOCalculationEngine } from '@/modules/module1/lib/calculations';
import { SmartDateWidget } from '@/components/shared/SmartDateWidgets';

interface SectionCProps {
    calculated: CalculatedFields;
    selectedCurrency: Currency;
    socioeconomicData: SocioeconomicImprovement;
}

/**
 * Section C: Distribution VaR Basel II (Renommé pour correspondre à Page 9 : Répartition du Gain Potentiel)
 * Source: Reproduction exacte des éléments de la Page 9 (Data Processing... IPLE Accounts)
 * Affiche la répartition du gain potentiel total entre les domaines clés.
 */
export function SectionC_VaRBasel({ calculated, selectedCurrency, socioeconomicData }: SectionCProps) {

    const prlTotal = calculated.prl || 0;

    // Logique identique à Page9IPLEAccounts.tsx
    if (!socioeconomicData) return <div className="p-4 text-red-500">Données socio-économiques manquantes</div>;

    const v1 = socioeconomicData.keyArea1_workingConditions || 'Low';
    const v2 = socioeconomicData.keyArea2_workOrganization || 'Low';
    const v3 = socioeconomicData.keyArea3_communication || 'Low';
    const v4 = socioeconomicData.keyArea4_timeManagement || 'Low';
    const v5 = socioeconomicData.keyArea5_training || 'Low';
    const v6 = socioeconomicData.keyArea6_strategy || 'Low';

    const n1 = CFOCalculationEngine.convertSocioQualToWeight(v1);
    const n2 = CFOCalculationEngine.convertSocioQualToWeight(v2);
    const n3 = CFOCalculationEngine.convertSocioQualToWeight(v3);
    const n4 = CFOCalculationEngine.convertSocioQualToWeight(v4);
    const n5 = CFOCalculationEngine.convertSocioQualToWeight(v5);
    const n6 = CFOCalculationEngine.convertSocioQualToWeight(v6);

    const denom = (n1 + n2 + n3 + n4 + n5 + n6) || 1;

    const groups = [
        {
            id: 'group205',
            label: 'Economic benefit 1 – KEY AREA 1: The working conditions',
            icon: <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
            weight: (n1 / denom) * 100,
            color: 'blue'
        },
        {
            id: 'group206',
            label: 'Economic benefit 2 – KEY AREA 2: The organization of work',
            icon: <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
            weight: (n2 / denom) * 100,
            color: 'purple'
        },
        {
            id: 'group207',
            label: 'Economic benefit 3 – KEY AREAS 3 + 5: 3C & On the job Training',
            icon: <MessageSquare className="w-5 h-5 text-green-600 dark:text-green-400" />,
            weight: ((n3 + n5) / denom) * 100,
            color: 'green'
        },
        {
            id: 'group208',
            label: 'Economic benefit 4 – KEY AREA 4: Working Time Management',
            icon: <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />,
            weight: (n4 / denom) * 100,
            color: 'yellow'
        },
        {
            id: 'group209',
            label: 'Economic benefit 5 – KEY AREA 6: The strategic Implementation',
            icon: <Target className="w-5 h-5 text-red-600 dark:text-red-400" />,
            weight: (n6 / denom) * 100,
            color: 'red'
        },
    ].map(g => ({ ...g, economy: prlTotal * (g.weight / 100) }));

    return (
        <div className="space-y-6">
            {/* Section Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-border">
                <Shield className="w-6 h-6 text-primary" />
                <div>
                    <h3 className="text-xl font-bold text-foreground">Section C - Distribution VaR Basel II</h3>
                    <p className="text-sm text-muted-foreground">Répartition du Gain Potentiel par Domaine Clé (Données Page 9)</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                <div className="p-4 bg-muted/50 rounded-lg mb-6 text-center border border-border">
                    <h3 className="text-lg font-bold text-foreground">Répartition du Gain Potentiel par Domaine Clé</h3>
                    <p className="text-sm text-muted-foreground">
                        Basé sur les sélections de la page 6 et un PRL de <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(prlTotal, selectedCurrency)}</span>
                    </p>
                </div>

                <div className="space-y-4">
                    {groups.map((kd) => (
                        <div key={kd.id} className="border border-border rounded-lg p-4 bg-card shadow-sm hover:border-primary/50 transition-colors">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 gap-3">
                                <div className="flex items-center">
                                    <div className={`p-2 rounded-full mr-3 bg-${kd.color}-500/10`}>
                                        {kd.icon}
                                    </div>
                                    <div>
                                        <div className="font-bold text-foreground">{kd.label}</div>
                                        <div className="text-sm text-muted-foreground">Poids: {kd.weight.toFixed(2)}%</div>
                                    </div>
                                </div>
                                <div className="text-xl font-bold text-green-600 dark:text-green-400">
                                    {formatCurrency(kd.economy, selectedCurrency)}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-border">
                                <div className="text-center">
                                    <div className="text-xs text-muted-foreground">N+1 (30%)</div>
                                    <div className="font-semibold text-foreground">{formatCurrency(kd.economy * 0.30, selectedCurrency)}</div>
                                    <SmartDateWidget yearsOffset={1} showIcon={false} showLockIcon={true} allowLockToggle={true} className="text-xs mt-1" />
                                </div>
                                <div className="text-center">
                                    <div className="text-xs text-muted-foreground">N+2 (60%)</div>
                                    <div className="font-semibold text-foreground">{formatCurrency(kd.economy * 0.60, selectedCurrency)}</div>
                                    <SmartDateWidget yearsOffset={2} showIcon={false} showLockIcon={true} allowLockToggle={true} className="text-xs mt-1" />
                                </div>
                                <div className="text-center">
                                    <div className="text-xs text-muted-foreground">N+3 (100%)</div>
                                    <div className="font-semibold text-foreground">{formatCurrency(kd.economy, selectedCurrency)}</div>
                                    <SmartDateWidget yearsOffset={3} showIcon={false} showLockIcon={true} allowLockToggle={true} className="text-xs mt-1" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
