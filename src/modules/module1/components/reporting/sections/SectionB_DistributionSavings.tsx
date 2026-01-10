import React from 'react';
import { PiggyBank, TrendingUp, AlertCircle } from 'lucide-react';
import { CalculatedFields, Currency } from '@/modules/module1/types';
import { formatCurrency } from '@/modules/module1/utils/formatting';
import { SmartDateWidget } from '@/components/shared/SmartDateWidgets';

interface SectionBProps {
  calculated: CalculatedFields;
  selectedCurrency: Currency;
}

/**
 * Section B: Distribution of Costs Savings
 * Source: Reproduction exacte des éléments de la Page 8 (Data Processing for Programming... Employee Engagement Accounts)
 * Affiche le Plan de Performance sur 3 Ans : Gains Projetés et Pertes Restantes.
 */
export function SectionB_DistributionSavings({ calculated, selectedCurrency }: SectionBProps) {

  // Calculs identiques à Page8EmployeeEngagement.tsx
  const prlTotal = calculated.prl || 0;

  // Gains projetés (Objectifs de récupération)
  const gainN1 = prlTotal * 0.30; // N+1 : 30%
  const gainN2 = prlTotal * 0.60; // N+2 : 60%
  const gainN3 = prlTotal * 1.00; // N+3 : 100%

  // Pertes restantes à récupérer
  const remainingN1 = prlTotal - gainN1;
  const remainingN2 = prlTotal - gainN2;
  const remainingN3 = prlTotal - gainN3;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-border">
        <PiggyBank className="w-6 h-6 text-primary" />
        <div>
          <h3 className="text-xl font-bold text-foreground">Section B - Distribution of Costs Savings</h3>
          <p className="text-sm text-muted-foreground">Plan de Performance sur 3 Ans (Données Page 8)</p>
        </div>
      </div>

      {/* Main Summary Card */}
      <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
        <div className="p-4 bg-muted/50 rounded-lg mb-6 text-center border border-border">
          <h3 className="text-lg font-bold text-foreground">Plan de Performance sur 3 Ans</h3>
          <p className="text-sm text-muted-foreground">
            Basé sur les Pertes Potentiellement Récupérables (PRL) de <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(prlTotal, selectedCurrency)}</span>
          </p>
        </div>

        {/* Gains Projetés */}
        <div className="mb-8">
          <h4 className="text-md font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            Gains Projetés (Objectifs de récupération)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-card rounded-lg border border-border text-center shadow-sm hover:border-green-500/50 transition-colors">
              <div className="text-sm text-muted-foreground mb-1">a- N+1 : 30%</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(gainN1, selectedCurrency)}</div>
              <SmartDateWidget yearsOffset={1} showIcon={false} showLockIcon={true} allowLockToggle={true} className="text-xs mt-2" />
            </div>
            <div className="p-4 bg-card rounded-lg border border-border text-center shadow-sm hover:border-green-500/50 transition-colors">
              <div className="text-sm text-muted-foreground mb-1">b- N+2 : 60%</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(gainN2, selectedCurrency)}</div>
              <SmartDateWidget yearsOffset={2} showIcon={false} showLockIcon={true} allowLockToggle={true} className="text-xs mt-2" />
            </div>
            <div className="p-4 bg-card rounded-lg border border-border text-center shadow-sm hover:border-green-500/50 transition-colors">
              <div className="text-sm text-muted-foreground mb-1">c- N+3 : 100%</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(gainN3, selectedCurrency)}</div>
              <SmartDateWidget yearsOffset={3} showIcon={false} showLockIcon={true} allowLockToggle={true} className="text-xs mt-2" />
            </div>
          </div>
        </div>

        {/* Pertes Restantes */}
        <div>
          <h4 className="text-md font-semibold text-foreground mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            Pertes Restantes à Récupérer (Annuellement)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-card rounded-lg border border-border text-center shadow-sm hover:border-amber-500/50 transition-colors">
              <div className="text-sm text-muted-foreground mb-1">d- Restant (N+1)</div>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{formatCurrency(remainingN1, selectedCurrency)}</div>
              <SmartDateWidget yearsOffset={1} showIcon={false} showLockIcon={true} allowLockToggle={true} className="text-xs mt-2" />
            </div>
            <div className="p-4 bg-card rounded-lg border border-border text-center shadow-sm hover:border-amber-500/50 transition-colors">
              <div className="text-sm text-muted-foreground mb-1">e- Restant (N+2)</div>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{formatCurrency(remainingN2, selectedCurrency)}</div>
              <SmartDateWidget yearsOffset={2} showIcon={false} showLockIcon={true} allowLockToggle={true} className="text-xs mt-2" />
            </div>
            <div className="p-4 bg-card rounded-lg border border-border text-center shadow-sm hover:border-amber-500/50 transition-colors">
              <div className="text-sm text-muted-foreground mb-1">f- Restant (N+3)</div>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{formatCurrency(remainingN3, selectedCurrency)}</div>
              <SmartDateWidget yearsOffset={3} showIcon={false} showLockIcon={true} allowLockToggle={true} className="text-xs mt-2" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
