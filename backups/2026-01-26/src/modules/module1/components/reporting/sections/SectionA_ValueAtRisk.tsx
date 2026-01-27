import React from 'react';
import { Calculator, TrendingUp, TrendingDown, Shield, Target, AlertTriangle } from 'lucide-react';
import { CalculatedFields, Currency } from '@/modules/module1/types';
import { formatCurrency } from '@/modules/module1/utils/formatting';

interface SectionAProps {
  calculated: CalculatedFields;
  selectedCurrency: Currency;
}

interface ResultCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
  colorClass: string;
}

const ResultCard: React.FC<ResultCardProps> = ({ icon, label, value, description, colorClass }) => (
  <div className="bg-card rounded-lg shadow-sm p-4 flex flex-col border border-border hover:border-primary transition-all duration-300">
    <div className="flex items-center mb-2">
      <div className={`p-2 rounded-full mr-3 bg-muted ${colorClass.replace('text-', 'bg-').replace('400', '500/10').replace('600', '500/10')}`}>
        {icon}
      </div>
      <h3 className="text-sm font-bold text-foreground">{label}</h3>
    </div>
    <div className={`text-3xl font-bold self-start mt-2 mb-2 ${colorClass}`}>{value}</div>
    <p className="text-xs text-muted-foreground mt-auto">{description}</p>
  </div>
);

/**
 * Section A: Value at Risk (VaR)
 * Source: Reproduction exacte des éléments de la Page 7 (Programming data of potentially recoverable loss accounts)
 * Affiche les 6 indicateurs clés de risque et de perte.
 */
export function SectionA_ValueAtRisk({ calculated, selectedCurrency }: SectionAProps) {

  // Mapping des données identique à Page7CalculatedResults.tsx
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
      icon: <Shield className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />,
      colorClass: 'text-yellow-600 dark:text-yellow-400'
    },
    {
      id: 'el',
      label: '2- Expected losses (EL)',
      value: formatCurrency(expectedLosses, selectedCurrency),
      description: 'Annual expected losses based on historical data',
      icon: <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />,
      colorClass: 'text-red-600 dark:text-red-400'
    },
    {
      id: 'var',
      label: '3- VaR (UL + EL)',
      value: formatCurrency(valueAtRisk, selectedCurrency),
      description: 'Your total maximum loss (unexpected + expected) over a given period',
      icon: <Calculator className="h-5 w-5 text-red-600 dark:text-red-400" />,
      colorClass: 'text-red-600 dark:text-red-400'
    },
    {
      id: 'hra',
      label: '4- Historic or current cost of the risk appetite threshold limit',
      value: formatCurrency(historicRiskAppetite, selectedCurrency),
      description: 'The amount of losses your business has tolerated so far',
      icon: <Target className="w-5 h-5 text-green-600 dark:text-green-400" />,
      colorClass: 'text-green-600 dark:text-green-400'
    },
    {
      id: 'prl',
      label: '5- Potentially recoverable losses (PRL)',
      value: formatCurrency(potentiallyRecoverableLosses, selectedCurrency),
      description: 'Potentially recoverable losses through mitigation',
      icon: <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />,
      colorClass: 'text-orange-600 dark:text-orange-400'
    },
    {
      id: 'fel',
      label: '6- Forecast expected Losses (EL)',
      value: formatCurrency(forecastExpectedLosses, selectedCurrency),
      description: 'Projected expected losses for next period',
      icon: <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />,
      colorClass: 'text-purple-600 dark:text-purple-400'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-border">
        <AlertTriangle className="w-6 h-6 text-primary" />
        <div>
          <h3 className="text-xl font-bold text-foreground">Section A - Value at Risk (VaR)</h3>
          <p className="text-sm text-muted-foreground">Synthèse des risques et pertes (Données Page 7)</p>
        </div>
      </div>

      {/* Grid of 6 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((result) => (
          <ResultCard
            key={result.id}
            icon={result.icon}
            label={result.label}
            value={result.value}
            description={result.description}
            colorClass={result.colorClass}
          />
        ))}
      </div>
    </div>
  );
}
