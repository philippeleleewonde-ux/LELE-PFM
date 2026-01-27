import React from 'react';
import { DollarSign, Briefcase, AlertCircle, TrendingUp, CheckCircle, Users, Target } from 'lucide-react';
import { CalculatedFields, BusinessLine, QualitativeAssessment, SocioeconomicImprovement, Currency } from '@/modules/module1/types';
import { CFOCalculationEngine } from '@/modules/module1/lib/calculations';
import { formatCurrency } from '@/modules/module1/utils/formatting';

interface Page10EconomicBreakdownProps {
  calculated: CalculatedFields;
  businessLines: BusinessLine[];
  qualitativeData: QualitativeAssessment;
  socioeconomicData: SocioeconomicImprovement;
  selectedCurrency: Currency;
}

export function Page10EconomicBreakdown({ calculated, businessLines, qualitativeData, socioeconomicData, selectedCurrency }: Page10EconomicBreakdownProps) {
  const varAmount = calculated.var || 0;

  const riskTypesConfig = [
    {
      id: 'operationalRiskIncidents' as keyof QualitativeAssessment,
      label: '1- Operational Risk',
      icon: <AlertCircle className="w-4 h-4" />
    },
    {
      id: 'creditRiskAssessment' as keyof QualitativeAssessment,
      label: '2- Credit counterparty risk',
      icon: <DollarSign className="w-4 h-4" />
    },
    {
      id: 'marketVolatility' as keyof QualitativeAssessment,
      label: '3- Market risk',
      icon: <TrendingUp className="w-4 h-4" />
    },
    {
      id: 'liquidityPosition' as keyof QualitativeAssessment,
      label: '4- Transformation risk',
      icon: <CheckCircle className="w-4 h-4" />
    },
    {
      id: 'reputationalFactors' as keyof QualitativeAssessment,
      label: '5- Organizational risk',
      icon: <Users className="w-4 h-4" />
    },
    {
      id: 'strategicAlignment' as keyof QualitativeAssessment,
      label: '6- Specific Health and Insurance Risk',
      icon: <Target className="w-4 h-4" />
    }
  ];

  // Socioeconomic weights (Page 9 groups 205..209)
  const s1 = CFOCalculationEngine.convertSocioQualToWeight(socioeconomicData.keyArea1_workingConditions);
  const s2 = CFOCalculationEngine.convertSocioQualToWeight(socioeconomicData.keyArea2_workOrganization);
  const s3 = CFOCalculationEngine.convertSocioQualToWeight(socioeconomicData.keyArea3_communication);
  const s4 = CFOCalculationEngine.convertSocioQualToWeight(socioeconomicData.keyArea4_timeManagement);
  const s5 = CFOCalculationEngine.convertSocioQualToWeight(socioeconomicData.keyArea5_training);
  const s6 = CFOCalculationEngine.convertSocioQualToWeight(socioeconomicData.keyArea6_strategy);
  const socioDenom = (s1 + s2 + s3 + s4 + s5 + s6) || 1;
  const w205 = (s1 / socioDenom) * 100;             // Economic benefit 1
  const w206 = (s2 / socioDenom) * 100;             // Economic benefit 2
  const w207 = ((s3 + s5) / socioDenom) * 100;      // Economic benefit 3 (3C + Training)
  const w208 = (s4 / socioDenom) * 100;             // Economic benefit 4
  const w209 = (s6 / socioDenom) * 100;             // Economic benefit 5

  // Map 6 risk indicators to the 5 socio groups (source-driven mapping)
  // 1- Operational Risk -> 205
  // 2- Credit counterparty risk -> 206
  // 3- Market risk -> 207
  // 4- Transformation risk -> 208
  // 5- Organizational risk -> 207 (shares the 3C/Training driver)
  // 6- Specific Health and Insurance Risk -> 209
  const socioRiskWeights = [w205, w206, w207, w208, w207, w209];

  const riskEntries = riskTypesConfig.map((risk, idx) => ({
    ...risk,
    weight: socioRiskWeights[idx] || 0,
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

  return (
    <div className="space-y-6">
      <div className="p-4 bg-gray-900/70 rounded-lg mb-6 text-center border border-gray-700">
        <h3 className="text-lg font-bold text-white">10- Breakdown of the programmed economic benefit to loss events and risks induced as consequences</h3>
        <p className="text-sm text-gray-400">Some are common to all business sectors. Others are specific</p>
      </div>
      
      {/* Breakdown by indicator with per-business-line values (source-compatible view) */}
      <div className="space-y-8">
        {riskEntries.map((risk, idx) => (
          <div key={risk.id} className="bg-gray-900/40 rounded-lg border border-gray-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                {risk.icon}
                <h4 className="text-md font-bold text-white">{risk.label}</h4>
              </div>
              <div className="text-sm text-gray-400">Rate: {risk.weight.toFixed(2)}%</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {lineWeights.map((line) => (
                <div key={`${risk.id}-${line.id}`} className="bg-gray-800/60 rounded-md border border-gray-700 p-3">
                  <div className="text-xs text-gray-400 mb-1">{line.name}</div>
                  <div className="text-lg font-mono text-white">
                    {formatCurrency(calculateCellValue(line.weight, risk.weight), selectedCurrency)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}