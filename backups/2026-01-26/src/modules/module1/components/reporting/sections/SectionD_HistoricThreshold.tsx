import React from 'react';
import { TrendingUp, Activity } from 'lucide-react';
import { CalculatedFields, Currency } from '@/modules/module1/types';
import { formatCurrency } from '@/modules/module1/utils/formatting';

interface SectionDProps {
  calculated: CalculatedFields;
  selectedCurrency: Currency;
}

/**
 * Section D: Historic Threshold Tolerance & Overcosts
 * Source Excel: Feuille "13-REPORTING M1-Pdf" → Références vers "8-SEUIL HISTORIQUE-SURCOUTS"
 * Affiche l'analyse des seuils historiques et des surcoûts par rapport aux années précédentes
 */
export function SectionD_HistoricThreshold({ calculated, selectedCurrency }: SectionDProps) {
  // Données historiques sur 3 ans (N-2, N-1, N)
  const historicData = [
    {
      year: 'N-2',
      label: 'Année N-2',
      prl: calculated.prl_n_minus_2 || 0,
      ul: calculated.ul_n_minus_2 || 0,
      color: 'gray'
    },
    {
      year: 'N-1',
      label: 'Année N-1',
      prl: calculated.prl_n_minus_1 || 0,
      ul: calculated.ul_n_minus_1 || 0,
      color: 'blue'
    },
    {
      year: 'N',
      label: 'Année N (actuelle)',
      prl: calculated.prl || 0,
      ul: calculated.totalUL || 0,
      color: 'green'
    }
  ];

  // Calcul des variations
  const prlVariationN1 = calculated.prl_n_minus_1 > 0
    ? ((calculated.prl - calculated.prl_n_minus_1) / calculated.prl_n_minus_1) * 100
    : 0;

  const prlVariationN2 = calculated.prl_n_minus_2 > 0
    ? ((calculated.prl - calculated.prl_n_minus_2) / calculated.prl_n_minus_2) * 100
    : 0;

  // Seuil de tolérance (threshold) - peut être configuré
  const toleranceThreshold = calculated.tolerance_threshold || 0;
  const isAboveThreshold = calculated.prl > toleranceThreshold;

  // Surcoûts identifiés
  const overcosts = calculated.total_overcosts || 0;

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-border">
        <Activity className="w-6 h-6 text-orange-500" />
        <div>
          <h3 className="text-xl font-bold text-foreground">Section D - Historic Threshold Tolerance</h3>
          <p className="text-sm text-muted-foreground">Analyse des seuils historiques et surcoûts identifiés</p>
        </div>
      </div>

      {/* Historic PRL Evolution */}
      <div className="bg-card rounded-lg p-5 border border-border shadow-sm">
        <h4 className="text-sm font-bold text-foreground mb-4">Évolution historique des PRL</h4>

        <div className="grid grid-cols-3 gap-4 mb-4">
          {historicData.map((data, idx) => (
            <div key={data.year} className="text-center">
              <div className="text-xs font-semibold text-muted-foreground mb-1">{data.label}</div>
              <div className={`text-2xl font-bold ${data.color === 'green' ? 'text-green-600 dark:text-green-400' : data.color === 'blue' ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`}>
                {formatCurrency(data.prl, selectedCurrency)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">PRL</div>
            </div>
          ))}
        </div>

        {/* Visual Timeline */}
        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
          <div className="absolute inset-0 flex">
            {historicData.map((data, idx) => {
              const maxPrl = Math.max(...historicData.map(d => d.prl));
              const width = maxPrl > 0 ? (data.prl / maxPrl) * 33.33 : 0;
              return (
                <div
                  key={data.year}
                  className={`h-full ${data.color === 'green' ? 'bg-green-500' : data.color === 'blue' ? 'bg-blue-500' : 'bg-gray-400'}`}
                  style={{ width: `${width}%` }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Variations Year-over-Year */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg p-4 border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className={`w-5 h-5 ${prlVariationN1 >= 0 ? 'text-destructive' : 'text-green-500'}`} />
            <h4 className="text-sm font-bold text-foreground">Variation N vs N-1</h4>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-muted-foreground">Changement:</span>
            <span className={`text-2xl font-mono font-bold ${prlVariationN1 >= 0 ? 'text-destructive' : 'text-green-600 dark:text-green-400'}`}>
              {prlVariationN1 >= 0 ? '+' : ''}{prlVariationN1.toFixed(1)}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {prlVariationN1 >= 0
              ? '⚠️ Augmentation des pertes par rapport à N-1'
              : '✅ Réduction des pertes par rapport à N-1'}
          </p>
        </div>

        <div className="bg-card rounded-lg p-4 border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className={`w-5 h-5 ${prlVariationN2 >= 0 ? 'text-destructive' : 'text-green-500'}`} />
            <h4 className="text-sm font-bold text-foreground">Variation N vs N-2</h4>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-muted-foreground">Changement:</span>
            <span className={`text-2xl font-mono font-bold ${prlVariationN2 >= 0 ? 'text-destructive' : 'text-green-600 dark:text-green-400'}`}>
              {prlVariationN2 >= 0 ? '+' : ''}{prlVariationN2.toFixed(1)}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {prlVariationN2 >= 0
              ? '⚠️ Augmentation des pertes par rapport à N-2'
              : '✅ Réduction des pertes par rapport à N-2'}
          </p>
        </div>
      </div>

      {/* Tolerance Threshold Alert */}
      <div className={`rounded-lg p-4 border-2 ${isAboveThreshold ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isAboveThreshold ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
            {isAboveThreshold ? (
              <span className="text-2xl">⚠️</span>
            ) : (
              <span className="text-2xl">✅</span>
            )}
          </div>
          <div className="flex-1">
            <h4 className={`text-sm font-bold mb-1 ${isAboveThreshold ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
              Seuil de tolérance: {formatCurrency(toleranceThreshold, selectedCurrency)}
            </h4>
            <p className={`text-xs ${isAboveThreshold ? 'text-red-600/80 dark:text-red-300' : 'text-green-600/80 dark:text-green-300'}`}>
              {isAboveThreshold
                ? `❌ Les PRL actuels (${formatCurrency(calculated.prl, selectedCurrency)}) DÉPASSENT le seuil de tolérance. Action corrective requise.`
                : `✅ Les PRL actuels (${formatCurrency(calculated.prl, selectedCurrency)}) sont en dessous du seuil de tolérance.`}
            </p>
          </div>
        </div>
      </div>

      {/* Total Overcosts Identified */}
      <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-lg p-5 border border-orange-500/20">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-foreground mb-1">Surcoûts totaux identifiés</h4>
            <p className="text-xs text-muted-foreground">Écarts de coûts par rapport aux références historiques</p>
          </div>
          <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
            {formatCurrency(overcosts, selectedCurrency)}
          </div>
        </div>
      </div>

      {/* Note explicative */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
        <p className="text-xs text-muted-foreground">
          <strong className="text-primary">Note:</strong> L'analyse des seuils historiques permet d'identifier les dérives de coûts cachés
          par rapport aux années précédentes. Le seuil de tolérance représente la limite acceptable de PRL
          définie en fonction de votre secteur d'activité et de vos objectifs stratégiques.
        </p>
      </div>
    </div>
  );
}
