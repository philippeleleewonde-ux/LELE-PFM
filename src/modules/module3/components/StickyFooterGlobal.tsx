/**
 * ============================================
 * STICKY FOOTER - BARRE DE RÉSUMÉ ET ACTIONS
 * ============================================
 *
 * Footer sticky avec KPIs résumés et boutons d'export
 * pour la page Centre de Performance Globale
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  PiggyBank,
  Target,
  FileText,
  FileSpreadsheet,
  LayoutDashboard,
  Download,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CURRENCY_CONFIG } from '@/modules/module1/lib/currency';
import type { Currency } from '@/modules/module1/types';
import { toast } from 'sonner';

// ============================================
// TYPES
// ============================================

interface StickyFooterGlobalProps {
  totalEmployees: number;
  totalEconomies: number;
  tauxAtteinte: number;
  currency: Currency;
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function StickyFooterGlobal({
  totalEmployees,
  totalEconomies,
  tauxAtteinte,
  currency
}: StickyFooterGlobalProps) {
  const navigate = useNavigate();
  const currencyConfig = CURRENCY_CONFIG[currency];
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  // Formatage du montant
  const formatAmount = (amount: number): string => {
    if (amount >= 1000000000) {
      return `${(amount / 1000000000).toFixed(2)}B`;
    }
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(2)}M`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toLocaleString('fr-FR');
  };

  // Export PDF (placeholder)
  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      // Simuler un délai pour le chargement
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.info('Export PDF', {
        description: 'Fonctionnalité d\'export PDF bientôt disponible. Utilisez Ctrl+P pour imprimer en PDF.',
        duration: 5000
      });
    } finally {
      setExportingPdf(false);
    }
  };

  // Export Excel (placeholder)
  const handleExportExcel = async () => {
    setExportingExcel(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.info('Export Excel', {
        description: 'Fonctionnalité d\'export Excel bientôt disponible.',
        duration: 5000
      });
    } finally {
      setExportingExcel(false);
    }
  };

  return (
    <motion.footer
      role="contentinfo"
      aria-label="Résumé des performances et actions d'export"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "h-16",
        "bg-slate-900/95 backdrop-blur-md",
        "border-t border-slate-700/50",
        "shadow-lg shadow-black/20"
      )}
    >
      <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
        {/* KPIs Résumés */}
        <div className="flex items-center gap-4 md:gap-6">
          {/* Effectif */}
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-violet-400" aria-hidden="true" />
            <span className="text-sm text-slate-400 hidden sm:inline">
              <span className="font-semibold text-white">{totalEmployees}</span> salariés
            </span>
            <span className="text-sm font-semibold text-white sm:hidden">{totalEmployees}</span>
          </div>

          {/* Séparateur */}
          <div className="w-px h-6 bg-slate-700 hidden md:block" />

          {/* Économies */}
          <div className="flex items-center gap-2">
            <PiggyBank className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            <span className="text-sm text-slate-400 hidden sm:inline">
              <span className="font-semibold text-emerald-400">{formatAmount(totalEconomies)}</span> {currencyConfig.symbol}
            </span>
            <span className="text-sm font-semibold text-emerald-400 sm:hidden">
              {formatAmount(totalEconomies)} {currencyConfig.symbol}
            </span>
          </div>

          {/* Séparateur */}
          <div className="w-px h-6 bg-slate-700 hidden md:block" />

          {/* Taux d'atteinte */}
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-cyan-400" aria-hidden="true" />
            <span className="text-sm text-slate-400 hidden sm:inline">
              <span className={cn(
                "font-semibold",
                tauxAtteinte >= 80 ? "text-emerald-400" :
                tauxAtteinte >= 60 ? "text-amber-400" : "text-red-400"
              )}>
                {tauxAtteinte.toFixed(1)}%
              </span> atteinte
            </span>
            <span className={cn(
              "text-sm font-semibold sm:hidden",
              tauxAtteinte >= 80 ? "text-emerald-400" :
              tauxAtteinte >= 60 ? "text-amber-400" : "text-red-400"
            )}>
              {tauxAtteinte.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Export PDF */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPdf}
            disabled={exportingPdf}
            className={cn(
              "gap-2 border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white",
              "hidden sm:flex"
            )}
          >
            {exportingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            <span className="hidden md:inline">Export PDF</span>
          </Button>

          {/* Export Excel */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            disabled={exportingExcel}
            className={cn(
              "gap-2 border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white",
              "hidden sm:flex"
            )}
          >
            {exportingExcel ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            <span className="hidden md:inline">Export Excel</span>
          </Button>

          {/* Mobile Export Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPdf}
            className="sm:hidden gap-2 border-slate-600 text-slate-300"
          >
            <Download className="w-4 h-4" />
          </Button>

          {/* Tableau de bord */}
          <Button
            size="sm"
            onClick={() => navigate('/modules/module3/cost-savings-reporting')}
            className={cn(
              "gap-2",
              "bg-gradient-to-r from-cyan-500 to-emerald-500",
              "hover:from-cyan-600 hover:to-emerald-600",
              "text-white shadow-lg shadow-cyan-500/25"
            )}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden md:inline">Tableau de bord</span>
          </Button>
        </div>
      </div>
    </motion.footer>
  );
}
