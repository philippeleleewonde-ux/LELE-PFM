import React from 'react';
import { Calculator, TrendingUp, TrendingDown, Shield, Target, Activity } from 'lucide-react';
import { CalculatedFields, FormData, Currency } from '@/modules/module1/types';
import { formatCurrency } from '@/modules/module1/utils/formatting';

interface ResultCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
}

const ResultCard: React.FC<ResultCardProps> = ({ icon, label, value, description }) => (
  <div className="bg-gray-800/50 rounded-lg shadow-lg p-4 flex flex-col border border-gray-700 hover:border-green-500 transition-all duration-300">
    <div className="flex items-center mb-2">
      <div className="p-2 bg-gray-700 rounded-full mr-3">{icon}</div>
      <h3 className="text-sm font-bold text-white">{label}</h3>
    </div>
    <div className="text-3xl font-bold text-green-400 self-start mt-2 mb-2">{value}</div>
    <p className="text-xs text-gray-300 mt-auto">{description}</p>
  </div>
);

interface Page7CalculatedResultsProps {
  formData: FormData;
  calculated: CalculatedFields;
  selectedCurrency: Currency;
  onExport?: () => void;
}

export function Page7CalculatedResults({ formData, calculated, selectedCurrency, onExport }: Page7CalculatedResultsProps) {

  // Recreate the 6 key metrics from the original Page 7 (aligned with source app)
  const unexpectedLosses = calculated.ulCalcul || 0;
  const expectedLosses = calculated.totalELHistorique || 0;
  const valueAtRisk = calculated.var || 0;
  const historicRiskAppetite = calculated.historicRiskAppetite || 0;
  const potentiallyRecoverableLosses = calculated.prl ?? calculated.prlAmount ?? 0;
  const forecastExpectedLosses = calculated.forecastEL || 0;

  const results = [
    {
      id: 'ul',
      label: '1- Unexpected losses (UL)',
      value: formatCurrency(unexpectedLosses, selectedCurrency),
      description: 'Maximum unexpected loss at 99% confidence level',
      icon: <Shield className="w-6 h-6 text-yellow-400" />
    },
    {
      id: 'el',
      label: '2- Expected losses (EL)',
      value: formatCurrency(expectedLosses, selectedCurrency),
      description: 'Annual expected losses based on historical data',
      icon: <TrendingDown className="w-6 h-6 text-red-400" />
    },
    {
      id: 'var',
      label: '3- VaR (UL + EL)',
      value: formatCurrency(valueAtRisk, selectedCurrency),
      description: 'Your total maximum loss (unexpected + expected) over a given period',
      icon: <Calculator className="h-5 w-5 text-red-600" />
    },
    {
      id: 'hra',
      label: '4- Historic or current cost of the risk appetite threshold limit',
      value: formatCurrency(historicRiskAppetite, selectedCurrency),
      description: 'The amount of losses your business has tolerated so far',
      icon: <Target className="w-6 h-6 text-green-400" />
    },
    {
      id: 'prl',
      label: '5- Potentially recoverable losses (PRL)',
      value: formatCurrency(potentiallyRecoverableLosses, selectedCurrency),
      description: 'Potentially recoverable losses through mitigation',
      icon: <TrendingUp className="w-6 h-6 text-orange-400" />
    },
    {
      id: 'fel',
      label: '6- Forecast expected Losses (EL)',
      value: formatCurrency(forecastExpectedLosses, selectedCurrency),
      description: 'Projected expected losses for next period',
      icon: <Target className="h-5 w-5 text-purple-600" />
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((result) => (
          <ResultCard 
            key={result.id}
            icon={result.icon}
            label={result.label}
            value={result.value}
            description={result.description}
          />
        ))}
      </div>
    </div>
  );
}