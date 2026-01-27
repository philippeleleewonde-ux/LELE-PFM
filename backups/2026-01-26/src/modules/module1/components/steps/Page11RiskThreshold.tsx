import React from 'react';
import { Shield, TrendingUp, TrendingDown } from 'lucide-react';
import { CalculatedFields, BusinessLine, Currency, QualitativeAssessment } from '@/modules/module1/types';
import { formatCurrency } from '@/modules/module1/utils/formatting';

interface Page11RiskThresholdProps {
  calculated: CalculatedFields;
  businessLines: BusinessLine[];
  qualitativeData: QualitativeAssessment;
  selectedCurrency: Currency;
}

export function Page11RiskThreshold({ calculated, businessLines, qualitativeData, selectedCurrency }: Page11RiskThresholdProps) {
  // Historic Risk Appetite (RA1) per source: field 181 = 169 + 175
  const ra = calculated.historicRiskAppetite ?? ((calculated.totalSeuilHistorique || 0) + (calculated.ulCalcul || 0));
  // New threshold (section 2) matches source screenshots: equals Forecast Expected Losses
  const newThreshold = (calculated.forecastEL ?? 0);

  const totalBudget = businessLines.reduce((sum, line) => sum + (line.budget || 0), 0) || 1;
  const lines = businessLines.map(line => {
    const weight = (line.budget || 0) / totalBudget; // 0..1
    const historicValue = ra * weight;
    const newValue = newThreshold * weight;
    // Source screenshots show section 3 equal to section 2 values
    const qualityMargin = newThreshold * weight;
    return {
      id: line.id,
      name: line.activityName,
      weightPct: weight * 100,
      historicValue,
      newValue,
      qualityMargin,
    };
  });

  return (
    <div className="space-y-6">
      <div className="p-4 bg-gray-900/70 rounded-lg mb-6 text-center border border-gray-700">
        <h3 className="text-lg font-bold text-white">11- BREACKDOWN OF THE AMOUNT OF LOSSES RELATED TO RISK APPETITE THRESHOLD</h3>
        <p className="text-sm text-gray-400">Ventilation des montants des pertes par ligne d'activité</p>
      </div>

      {/* 1- Historic RA by line (usual risk appetite) */}
      <div className="bg-gray-800/50 rounded-lg shadow-lg border border-gray-700 p-4">
        <h4 className="text-md font-bold text-white mb-3">1- Breakdown of the amount of historical losses linked to the usual risk appetite threshold by line of activity according to their budget</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {lines.map((l) => (
            <div key={`historic-${l.id}`} className="bg-gray-900/40 rounded-md border border-gray-700 p-3">
              <div className="text-xs text-gray-400 mb-1">{l.name}</div>
              <div className="text-lg font-mono text-amber-400">{formatCurrency(l.historicValue, selectedCurrency)}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-right text-xs text-gray-400">Total: <span className="font-mono text-amber-400">{formatCurrency(ra, selectedCurrency)}</span></div>
      </div>

      {/* 2- New RA by line */}
      <div className="bg-gray-800/50 rounded-lg shadow-lg border border-gray-700 p-4">
        <h4 className="text-md font-bold text-white mb-3">2- Breakdown of the amount of losses linked to the new risk appetite threshold by line of activity according to their budget</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {lines.map((l) => (
            <div key={`new-${l.id}`} className="bg-gray-900/40 rounded-md border border-gray-700 p-3">
              <div className="text-xs text-gray-400 mb-1">{l.name}</div>
              <div className="text-lg font-mono text-blue-400">{formatCurrency(l.newValue, selectedCurrency)}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-right text-xs text-gray-400">Total: <span className="font-mono text-blue-400">{formatCurrency(newThreshold, selectedCurrency)}</span></div>
      </div>

      {/* 3- Margin of Total Quality (Zero defect = Economy of the insurance) */}
      <div className="bg-gray-800/50 rounded-lg shadow-lg border border-gray-700 p-4">
        <h4 className="text-md font-bold text-white mb-3">3- The Margin of Total Quality (Zero defect = Economy of the insurance)</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {lines.map((l) => (
            <div key={`margin-${l.id}`} className="bg-gray-900/40 rounded-md border border-gray-700 p-3">
              <div className="text-xs text-gray-400 mb-1">{l.name}</div>
              <div className="text-lg font-mono text-green-400">{formatCurrency(l.qualityMargin, selectedCurrency)}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-right text-xs text-gray-400">Total: <span className="font-mono text-green-400">{formatCurrency(newThreshold, selectedCurrency)}</span></div>
      </div>
    </div>
  );
}