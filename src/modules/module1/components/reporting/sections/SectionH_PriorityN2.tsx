import React from 'react';
import { Target } from 'lucide-react';
import { CalculatedFields, Currency, BusinessLine } from '@/modules/module1/types';
import { formatCurrency } from '@/modules/module1/utils/formatting';
import { SmartDateWidget } from '@/components/shared/SmartDateWidgets';

interface SectionHProps {
  calculated: CalculatedFields;
  selectedCurrency: Currency;
  businessLines: BusinessLine[];
}

/**
 * Section H: Priority Actions N+2 (Summary)
 * Source: Page 15 - PRIORITY ACTIONS N+2
 * Version compacte pour le reporting global
 */
export function SectionH_PriorityN2({ calculated, selectedCurrency, businessLines }: SectionHProps) {
  const pprN2 = calculated.gainsN2 || 0;
  const totalStaff = businessLines.reduce((sum, line) => sum + (line.staffCount || 0), 0);

  const indicators = [
    { id: 'absenteeism', label: 'Absentéisme', rate: calculated.indicator_absenteeism_rate || 0 },
    { id: 'productivity', label: 'Productivité', rate: calculated.indicator_productivity_rate || 0 },
    { id: 'quality', label: 'Qualité', rate: calculated.indicator_quality_rate || 0 },
    { id: 'accidents', label: 'Accidents', rate: calculated.indicator_accidents_rate || 0 },
    { id: 'knowhow', label: 'Know-how', rate: calculated.indicator_knowhow_rate || 0 }
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 pb-2 border-b border-border">
        <Target className="w-5 h-5 text-purple-500" />
        <div>
          <h3 className="text-lg font-bold text-foreground">Section H - Priority Actions N+2</h3>
          <p className="text-xs text-muted-foreground">Distribution des objectifs d'économie pour l'année N+2</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card rounded p-3 border border-border shadow-sm">
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            PPR N+2
            <SmartDateWidget yearsOffset={2} showIcon={false} showLockIcon={true} allowLockToggle={true} className="text-xs" />
          </div>
          <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{formatCurrency(pprN2, selectedCurrency)}</div>
        </div>
        <div className="bg-card rounded p-3 border border-border shadow-sm">
          <div className="text-xs text-muted-foreground">Effectif total</div>
          <div className="text-lg font-bold text-foreground">{totalStaff}</div>
        </div>
        <div className="bg-card rounded p-3 border border-border shadow-sm">
          <div className="text-xs text-muted-foreground">Par employé</div>
          <div className="text-lg font-bold text-green-600 dark:text-green-400">
            {totalStaff > 0 ? formatCurrency(pprN2 / totalStaff, selectedCurrency) : '-'}
          </div>
        </div>
        <div className="bg-card rounded p-3 border border-border shadow-sm">
          <div className="text-xs text-muted-foreground">Indicateurs actifs</div>
          <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{indicators.filter(i => i.rate > 0).length}/5</div>
        </div>
      </div>

      <div className="bg-muted/30 rounded p-3 border border-border">
        <div className="text-xs font-semibold text-muted-foreground mb-2">Distribution par indicateur</div>
        <div className="grid grid-cols-5 gap-2">
          {indicators.map(ind => (
            <div key={ind.id} className="text-center">
              <div className="text-xs text-muted-foreground">{ind.label}</div>
              <div className="text-sm font-bold text-foreground">{ind.rate.toFixed(1)}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
