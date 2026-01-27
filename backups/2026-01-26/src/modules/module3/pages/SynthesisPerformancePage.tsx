/**
 * ============================================
 * HCM COST SAVINGS - SYNTHÈSE PERFORMANCE PAGE
 * ============================================
 * Page dédiée à la Synthèse Performance Ligne d'Activité
 * Extraite de PerformanceRecapPage pour scalabilité 10K+ salariés
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BarChart3,
  Building2,
  Home,
  RefreshCw,
  TrendingUp,
  Layers,
} from 'lucide-react';
import { HCMLoader } from '@/components/ui/HCMLoader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CURRENCY_CONFIG } from '@/modules/module1/lib/currency';

import { usePerformanceData } from '../contexts/PerformanceDataContext';
import type { KPIType } from '../types/performance';

const KPI_LABELS: Record<KPIType, string> = {
  abs: 'Absentéisme',
  qd: 'Défauts Qualité',
  oa: 'Accidents Travail',
  ddp: 'Écarts Productivité',
  ekh: 'Écarts Know-How',
};

export default function SynthesisPerformancePage() {
  const navigate = useNavigate();
  const {
    loading,
    employeePerformances,
    businessLines,
    selectedCurrency,
    getTotals,
    refreshData,
  } = usePerformanceData();

  const currencyConfig = CURRENCY_CONFIG[selectedCurrency] || CURRENCY_CONFIG.EUR;

  // Calculer les données de synthèse par ligne d'activité
  const synthesisData = useMemo(() => {
    const kpis: KPIType[] = ['abs', 'qd', 'oa', 'ddp', 'ekh'];

    // Par ligne d'activité
    const byBusinessLine = businessLines.map(bl => {
      const blEmployees = employeePerformances.filter(p => p.businessLineId === bl.id);

      const kpiData = kpis.map(kpi => {
        const totals = blEmployees.reduce((acc, emp) => {
          const data = emp[kpi];
          return {
            tempsN1: acc.tempsN1 + data.tempsCalcul,
            fraisN1: acc.fraisN1 + data.fraisCollectes,
            scoreFinancierN1: acc.scoreFinancierN1 + data.scoreFinancier,
            pertesN1: acc.pertesN1 + data.pertesConstatees,
            pprN1: acc.pprN1 + data.pprPrevues,
            economiesN1: acc.economiesN1 + data.economiesRealisees,
            tempsN2: acc.tempsN2 + data.tempsPrisEnCompte,
            fraisN2: acc.fraisN2 + data.fraisPrisEnCompte,
            scoreFinancierN2: acc.scoreFinancierN2 + data.scoreFinancierN2,
            pertesN2: acc.pertesN2 + data.pertesConstateesN2,
            economiesN2: acc.economiesN2 + data.economiesRealisees2N2,
          };
        }, {
          tempsN1: 0, fraisN1: 0, scoreFinancierN1: 0, pertesN1: 0, pprN1: 0, economiesN1: 0,
          tempsN2: 0, fraisN2: 0, scoreFinancierN2: 0, pertesN2: 0, economiesN2: 0,
        });

        return {
          kpi,
          label: KPI_LABELS[kpi],
          ...totals,
          tempsTotal: totals.tempsN1 + totals.tempsN2,
          fraisTotal: totals.fraisN1 + totals.fraisN2,
          scoreFinancierTotal: totals.scoreFinancierN1 + totals.scoreFinancierN2,
          pertesTotal: totals.pertesN1 + totals.pertesN2,
          economiesTotal: totals.economiesN1 + totals.economiesN2,
        };
      });

      const totalEconomies = kpiData.reduce((sum, k) => sum + k.economiesTotal, 0);
      const totalPertes = kpiData.reduce((sum, k) => sum + k.pertesTotal, 0);

      return {
        businessLine: bl,
        employeeCount: blEmployees.length,
        kpiData,
        totalEconomies,
        totalPertes,
      };
    });

    // Totaux globaux
    const globalTotals = kpis.map(kpi => {
      const totals = getTotals(kpi);
      return {
        kpi,
        label: KPI_LABELS[kpi],
        economiesN1: totals.economiesRealiseesTotal,
        economiesN2: totals.economiesRealiseesTotalN2,
        economiesTotal: totals.economiesRealiseesTotalCombine,
        pertesN1: totals.pertesConstateesTotal,
        pertesN2: totals.pertesConstateesTotalN2,
        pertesTotal: totals.pertesConstateesTotalCombine,
      };
    });

    const grandTotalEconomies = globalTotals.reduce((sum, k) => sum + k.economiesTotal, 0);
    const grandTotalPertes = globalTotals.reduce((sum, k) => sum + k.pertesTotal, 0);

    return {
      byBusinessLine,
      globalTotals,
      grandTotalEconomies,
      grandTotalPertes,
    };
  }, [employeePerformances, businessLines, getTotals]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <HCMLoader text="Chargement de la synthèse..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/modules/module3/performance-recap')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-purple-500" />
                Synthèse Performance Ligne d'Activité
              </h1>
              <p className="text-muted-foreground">
                Vue consolidée par équipe et indicateur
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/modules/module3')}>
              <Home className="w-4 h-4 mr-2" />
              Menu principal
            </Button>
            <Button variant="outline" size="icon" onClick={() => refreshData()}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* KPIs Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="text-sm text-muted-foreground">Total Économies</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {synthesisData.grandTotalEconomies.toLocaleString('fr-FR', {minimumFractionDigits: 2})} {currencyConfig.symbol}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Layers className="w-5 h-5 text-orange-600" />
                <span className="text-sm text-muted-foreground">Total Pertes</span>
              </div>
              <p className="text-2xl font-bold text-orange-600">
                {synthesisData.grandTotalPertes.toLocaleString('fr-FR', {minimumFractionDigits: 2})} {currencyConfig.symbol}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-muted-foreground">Lignes d'Activité</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {businessLines.length}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-muted-foreground">Total Salariés</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                {employeePerformances.length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tableau par Ligne d'Activité */}
        {synthesisData.byBusinessLine.map(({ businessLine, employeeCount, kpiData, totalEconomies, totalPertes }) => (
          <Card key={businessLine.id} className="border-2 border-purple-500/20">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-white" />
                  <CardTitle className="text-white">{businessLine.activity_name}</CardTitle>
                  <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                    {employeeCount} salarié(s)
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-white text-sm">
                  <span>Économies: <strong>{totalEconomies.toLocaleString('fr-FR')} {currencyConfig.symbol}</strong></span>
                  <span>Pertes: <strong>{totalPertes.toLocaleString('fr-FR')} {currencyConfig.symbol}</strong></span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left py-3 px-4 font-semibold">Indicateur</th>
                      <th className="text-right py-3 px-4 font-semibold">Temps (h)</th>
                      <th className="text-right py-3 px-4 font-semibold">Frais</th>
                      <th className="text-right py-3 px-4 font-semibold">Score Financier</th>
                      <th className="text-right py-3 px-4 font-semibold">Pertes</th>
                      <th className="text-right py-3 px-4 font-semibold">Économies</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kpiData.map((kpi, idx) => (
                      <tr
                        key={kpi.kpi}
                        className={cn(
                          "border-b border-border/50",
                          idx % 2 === 0 ? "bg-transparent" : "bg-muted/10"
                        )}
                      >
                        <td className="py-3 px-4 font-medium">{kpi.label}</td>
                        <td className="py-3 px-4 text-right">{kpi.tempsTotal.toFixed(2)}h</td>
                        <td className="py-3 px-4 text-right">{kpi.fraisTotal.toLocaleString('fr-FR')} {currencyConfig.symbol}</td>
                        <td className="py-3 px-4 text-right text-blue-600">{kpi.scoreFinancierTotal.toLocaleString('fr-FR', {minimumFractionDigits: 2})} {currencyConfig.symbol}</td>
                        <td className="py-3 px-4 text-right text-orange-600">{kpi.pertesTotal.toLocaleString('fr-FR', {minimumFractionDigits: 2})} {currencyConfig.symbol}</td>
                        <td className="py-3 px-4 text-right font-bold text-green-600">{kpi.economiesTotal.toLocaleString('fr-FR', {minimumFractionDigits: 2})} {currencyConfig.symbol}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-purple-500/10 font-bold">
                      <td className="py-3 px-4">TOTAL {businessLine.activity_name}</td>
                      <td className="py-3 px-4 text-right">{kpiData.reduce((s, k) => s + k.tempsTotal, 0).toFixed(2)}h</td>
                      <td className="py-3 px-4 text-right">{kpiData.reduce((s, k) => s + k.fraisTotal, 0).toLocaleString('fr-FR')} {currencyConfig.symbol}</td>
                      <td className="py-3 px-4 text-right text-blue-600">{kpiData.reduce((s, k) => s + k.scoreFinancierTotal, 0).toLocaleString('fr-FR')} {currencyConfig.symbol}</td>
                      <td className="py-3 px-4 text-right text-orange-600">{totalPertes.toLocaleString('fr-FR')} {currencyConfig.symbol}</td>
                      <td className="py-3 px-4 text-right text-green-600">{totalEconomies.toLocaleString('fr-FR')} {currencyConfig.symbol}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Tableau Récapitulatif Global */}
        <Card className="border-2 border-green-500/30">
          <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600">
            <CardTitle className="text-white">Récapitulatif Global - Toutes Lignes d'Activité</CardTitle>
            <CardDescription className="text-white/70">
              Synthèse des performances par indicateur
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-green-500/10">
                    <th className="text-left py-3 px-4 font-semibold">Indicateur</th>
                    <th className="text-right py-3 px-4 font-semibold">Économies N1</th>
                    <th className="text-right py-3 px-4 font-semibold">Économies N2</th>
                    <th className="text-right py-3 px-4 font-semibold">Économies TOTAL</th>
                    <th className="text-right py-3 px-4 font-semibold">Pertes TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {synthesisData.globalTotals.map((kpi, idx) => (
                    <tr
                      key={kpi.kpi}
                      className={cn(
                        "border-b border-border/50",
                        idx % 2 === 0 ? "bg-transparent" : "bg-muted/10"
                      )}
                    >
                      <td className="py-3 px-4 font-medium">{kpi.label}</td>
                      <td className="py-3 px-4 text-right">{kpi.economiesN1.toLocaleString('fr-FR', {minimumFractionDigits: 2})} {currencyConfig.symbol}</td>
                      <td className="py-3 px-4 text-right">{kpi.economiesN2.toLocaleString('fr-FR', {minimumFractionDigits: 2})} {currencyConfig.symbol}</td>
                      <td className="py-3 px-4 text-right font-bold text-green-600">{kpi.economiesTotal.toLocaleString('fr-FR', {minimumFractionDigits: 2})} {currencyConfig.symbol}</td>
                      <td className="py-3 px-4 text-right text-orange-600">{kpi.pertesTotal.toLocaleString('fr-FR', {minimumFractionDigits: 2})} {currencyConfig.symbol}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-green-500/20 font-bold text-lg">
                    <td className="py-4 px-4">GRAND TOTAL</td>
                    <td className="py-4 px-4 text-right">{synthesisData.globalTotals.reduce((s, k) => s + k.economiesN1, 0).toLocaleString('fr-FR')} {currencyConfig.symbol}</td>
                    <td className="py-4 px-4 text-right">{synthesisData.globalTotals.reduce((s, k) => s + k.economiesN2, 0).toLocaleString('fr-FR')} {currencyConfig.symbol}</td>
                    <td className="py-4 px-4 text-right text-green-600">{synthesisData.grandTotalEconomies.toLocaleString('fr-FR')} {currencyConfig.symbol}</td>
                    <td className="py-4 px-4 text-right text-orange-600">{synthesisData.grandTotalPertes.toLocaleString('fr-FR')} {currencyConfig.symbol}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
