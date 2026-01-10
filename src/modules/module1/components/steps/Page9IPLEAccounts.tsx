import React from 'react';
import { TrendingUp, Briefcase, Users, MessageSquare, Clock, Award, Target } from 'lucide-react';
import { CalculatedFields, SocioeconomicImprovement, Currency } from '@/modules/module1/types';
import { CFOCalculationEngine } from '@/modules/module1/lib/calculations';
import { formatCurrency } from '@/modules/module1/utils/formatting';

interface Page9IPLEAccountsProps {
  calculated: CalculatedFields;
  socioeconomicData: SocioeconomicImprovement;
  selectedCurrency: Currency;
}

export function Page9IPLEAccounts({ calculated, socioeconomicData, selectedCurrency }: Page9IPLEAccountsProps) {
  const prlTotal = calculated.prl || 0;

  // Conformité application source (DOCUMENTATION APP SOURCE 2):
  // 5 groupes (205..209) dérivés de 6 valeurs de base (210..215)
  // 205 = 210/sum*100
  // 206 = 211/sum*100
  // 207 = (212 + 214)/sum*100  <-- combinaison des keyAreas 3 et 5
  // 208 = 213/sum*100
  // 209 = 215/sum*100

  const v1 = socioeconomicData.keyArea1_workingConditions;
  const v2 = socioeconomicData.keyArea2_workOrganization;
  const v3 = socioeconomicData.keyArea3_communication;
  const v4 = socioeconomicData.keyArea4_timeManagement;
  const v5 = socioeconomicData.keyArea5_training;
  const v6 = socioeconomicData.keyArea6_strategy;

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
      icon: <Briefcase className="w-5 h-5 text-blue-400" />,
      weight: (n1 / denom) * 100,
    },
    {
      id: 'group206',
      label: 'Economic benefit 2 – KEY AREA 2: The organization of work',
      icon: <Users className="w-5 h-5 text-purple-400" />,
      weight: (n2 / denom) * 100,
    },
    {
      id: 'group207',
      label: 'Economic benefit 3 – KEY AREAS 3 + 5: 3C & On the job Training',
      icon: <MessageSquare className="w-5 h-5 text-green-400" />,
      weight: ((n3 + n5) / denom) * 100,
    },
    {
      id: 'group208',
      label: 'Economic benefit 4 – KEY AREA 4: Working Time Management',
      icon: <Clock className="w-5 h-5 text-yellow-400" />,
      weight: (n4 / denom) * 100,
    },
    {
      id: 'group209',
      label: 'Economic benefit 5 – KEY AREA 6: The strategic Implementation',
      icon: <Target className="w-5 h-5 text-red-400" />,
      weight: (n6 / denom) * 100,
    },
  ].map(g => ({ ...g, economy: prlTotal * (g.weight / 100) }));

  return (
    <div className="space-y-6">
       <div className="p-4 bg-gray-900/70 rounded-lg mb-6 text-center border border-gray-700">
          <h3 className="text-lg font-bold text-white">Répartition du Gain Potentiel par Domaine Clé</h3>
          <p className="text-sm text-gray-400">Basé sur les sélections de la page 6 et un PRL de <span className="font-bold text-green-400">{formatCurrency(prlTotal, selectedCurrency)}</span></p>
        </div>

      <div className="bg-gray-800/50 rounded-lg shadow-lg border border-gray-700">
        <div className="p-6 space-y-4">
          {groups.map((kd) => (
            <div key={kd.id} className="border border-gray-700 rounded-lg p-4 bg-gray-900/50">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center">
                  <div className="p-2 bg-gray-700 rounded-full mr-3">{kd.icon}</div>
                  <div>
                    <div className="font-bold text-white">{kd.label}</div>
                    <div className="text-sm text-gray-400">Poids: {kd.weight.toFixed(2)}%</div>
                  </div>
                </div>
                <div className="text-xl font-bold text-green-400">
                  {formatCurrency(kd.economy, selectedCurrency)}
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-gray-600">
                <div className="text-center">
                  <div className="text-xs text-gray-400">N+1 (30%)</div>
                  <div className="font-semibold text-white">{formatCurrency(kd.economy * 0.30, selectedCurrency)}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-400">N+2 (60%)</div>
                  <div className="font-semibold text-white">{formatCurrency(kd.economy * 0.60, selectedCurrency)}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-400">N+3 (100%)</div>
                  <div className="font-semibold text-white">{formatCurrency(kd.economy, selectedCurrency)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}