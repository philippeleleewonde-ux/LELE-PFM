import React from 'react';
import { Calculator } from 'lucide-react';
import { CalculatedFields, Currency } from '@/modules/module1/types';
import { formatCurrency } from '@/modules/module1/utils/formatting';

interface Page8EmployeeEngagementProps {
  calculated: CalculatedFields;
  selectedCurrency: Currency;
}

export function Page8EmployeeEngagement({ calculated, selectedCurrency }: Page8EmployeeEngagementProps) {
  // Calculate Page 8 specific values
  const prlTotal = calculated.prl || 0;
  
  // input_188: N+1 : 30%
  const gainN1 = prlTotal * 0.30;
  
  // input_189: N+2 : 60%
  const gainN2 = prlTotal * 0.60;
  
  // input_190: N+3 : 100%
  const gainN3 = prlTotal * 1.00;
  
  // input_221: Remaining loss to be recovered (N+1)
  const remainingN1 = prlTotal - gainN1;
  
  // input_222: Remaining loss to be recovered (N+2)
  const remainingN2 = prlTotal - gainN2;
  
  // input_223: Remaining loss to be recovered (N+3)
  const remainingN3 = prlTotal - gainN3;

  return (
    <div className="space-y-6">
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <div className="p-4 bg-gray-900/70 rounded-lg mb-6 text-center">
          <h3 className="text-lg font-bold text-white">Plan de Performance sur 3 Ans</h3>
          <p className="text-sm text-gray-400">Basé sur les Pertes Potentiellement Récupérables (PRL) de <span className="font-bold text-green-400">{formatCurrency(prlTotal, selectedCurrency)}</span></p>
        </div>

        {/* Gains projetés */}
        <div className="mb-8">
          <h4 className="text-md font-semibold text-white mb-4">Gains Projetés (Objectifs de récupération)</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700 text-center">
              <div className="text-sm text-gray-300 mb-1">a- N+1 : 30%</div>
              <div className="text-2xl font-bold text-green-400">{formatCurrency(gainN1, selectedCurrency)}</div>
            </div>
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700 text-center">
              <div className="text-sm text-gray-300 mb-1">b- N+2 : 60%</div>
              <div className="text-2xl font-bold text-green-400">{formatCurrency(gainN2, selectedCurrency)}</div>
            </div>
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700 text-center">
              <div className="text-sm text-gray-300 mb-1">c- N+3 : 100%</div>
              <div className="text-2xl font-bold text-green-400">{formatCurrency(gainN3, selectedCurrency)}</div>
            </div>
          </div>
        </div>

        {/* Pertes restantes à récupérer */}
        <div>
          <h4 className="text-md font-semibold text-white mb-4">Pertes Restantes à Récupérer (Annuellement)</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700 text-center">
              <div className="text-sm text-gray-300 mb-1">d- Restant (N+1)</div>
              <div className="text-2xl font-bold text-amber-400">{formatCurrency(remainingN1, selectedCurrency)}</div>
            </div>
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700 text-center">
              <div className="text-sm text-gray-300 mb-1">e- Restant (N+2)</div>
              <div className="text-2xl font-bold text-amber-400">{formatCurrency(remainingN2, selectedCurrency)}</div>
            </div>
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700 text-center">
              <div className="text-sm text-gray-300 mb-1">f- Restant (N+3)</div>
              <div className="text-2xl font-bold text-amber-400">{formatCurrency(remainingN3, selectedCurrency)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
