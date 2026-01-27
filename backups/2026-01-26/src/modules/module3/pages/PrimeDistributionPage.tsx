/**
 * ============================================
 * HCM COST SAVINGS - RÉPARTITION DES PRIMES PAGE
 * ============================================
 * Page dédiée à la Répartition des Primes par Salarié
 * Extraite de PerformanceRecapPage pour scalabilité 10K+ salariés
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Coins,
  Building2,
  Home,
  RefreshCw,
  Search,
  Award,
  PiggyBank,
} from 'lucide-react';
import { HCMLoader } from '@/components/ui/HCMLoader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { CURRENCY_CONFIG } from '@/modules/module1/lib/currency';

import { usePerformanceData } from '../contexts/PerformanceDataContext';
import type { EmployeePerformance, KPIType } from '../types/performance';

export default function PrimeDistributionPage() {
  const navigate = useNavigate();
  const {
    loading,
    employeePerformances,
    businessLines,
    selectedCurrency,
    getGlobalStats,
    refreshData,
  } = usePerformanceData();

  const [searchTerm, setSearchTerm] = useState('');
  const currencyConfig = CURRENCY_CONFIG[selectedCurrency] || CURRENCY_CONFIG.EUR;
  const globalStats = getGlobalStats();

  // Filtrer les performances
  const filteredPerformances = useMemo(() => {
    return employeePerformances.filter(perf => {
      return searchTerm === '' ||
        perf.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        perf.professionalCategory.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [employeePerformances, searchTerm]);

  // Grouper par équipe
  const performancesByTeam = useMemo(() => {
    const grouped = new Map<string, EmployeePerformance[]>();
    businessLines.forEach(bl => grouped.set(bl.id, []));
    filteredPerformances.forEach(perf => {
      const team = grouped.get(perf.businessLineId);
      if (team) team.push(perf);
    });
    return grouped;
  }, [filteredPerformances, businessLines]);

  // Calculer la prime pour chaque salarié
  const calculatePrime = (perf: EmployeePerformance) => {
    const kpis: KPIType[] = ['abs', 'qd', 'oa', 'ddp', 'ekh'];

    // Total économies du salarié (N1 + N2)
    const totalEconomies = kpis.reduce((sum, kpi) => {
      const data = perf[kpi];
      return sum + data.economiesRealisees + data.economiesRealisees2N2;
    }, 0);

    // Calcul de la prime basé sur les économies réalisées
    // Formule simplifiée: Prime = Économies × Taux de redistribution (ex: 10%)
    const tauxRedistribution = 0.10; // 10% des économies redistribuées en prime
    const primeCalculee = totalEconomies * tauxRedistribution;

    // Détail par indicateur
    const detailParIndicateur = kpis.map(kpi => {
      const data = perf[kpi];
      const eco = data.economiesRealisees + data.economiesRealisees2N2;
      return {
        kpi,
        economies: eco,
        prime: eco * tauxRedistribution,
      };
    });

    return {
      totalEconomies,
      primeCalculee,
      detailParIndicateur,
      coefficientCompetence: perf.coefficientCompetence,
    };
  };

  // Totaux globaux
  const totals = useMemo(() => {
    let totalEconomies = 0;
    let totalPrimes = 0;

    filteredPerformances.forEach(perf => {
      const primeData = calculatePrime(perf);
      totalEconomies += primeData.totalEconomies;
      totalPrimes += primeData.primeCalculee;
    });

    return { totalEconomies, totalPrimes };
  }, [filteredPerformances]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <HCMLoader text="Chargement des primes..." />
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
                <Coins className="w-6 h-6 text-amber-500" />
                Répartition des Primes par Salarié
              </h1>
              <p className="text-muted-foreground">
                Distribution des primes basée sur les économies réalisées
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <PiggyBank className="w-5 h-5 text-green-600" />
                <span className="text-sm text-muted-foreground">Total Économies</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {totals.totalEconomies.toLocaleString('fr-FR', {minimumFractionDigits: 2})} {currencyConfig.symbol}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-amber-600" />
                <span className="text-sm text-muted-foreground">Total Primes (10%)</span>
              </div>
              <p className="text-2xl font-bold text-amber-600">
                {totals.totalPrimes.toLocaleString('fr-FR', {minimumFractionDigits: 2})} {currencyConfig.symbol}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Coins className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-muted-foreground">Salariés éligibles</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {filteredPerformances.filter(p => calculatePrime(p).primeCalculee > 0).length} / {filteredPerformances.length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un salarié..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Table des Primes */}
        <Card className="border-2 border-amber-500/30">
          <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-600">
            <CardTitle className="text-white">Répartition des Primes</CardTitle>
            <CardDescription className="text-white/70">
              Prime = 10% des économies réalisées par salarié
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-amber-500/10">
                    <th className="text-left py-3 px-4 font-semibold">Nom du salarié</th>
                    <th className="text-left py-3 px-4 font-semibold">Catégorie</th>
                    <th className="text-center py-3 px-4 font-semibold">Coef. Compétence</th>
                    <th className="text-right py-3 px-4 font-semibold">Économies ABS</th>
                    <th className="text-right py-3 px-4 font-semibold">Économies QD</th>
                    <th className="text-right py-3 px-4 font-semibold">Économies OA</th>
                    <th className="text-right py-3 px-4 font-semibold">Économies DDP</th>
                    <th className="text-right py-3 px-4 font-semibold">Économies EKH</th>
                    <th className="text-right py-3 px-4 font-semibold">Total Économies</th>
                    <th className="text-right py-3 px-4 font-semibold">PRIME</th>
                  </tr>
                </thead>
                <tbody>
                  {businessLines.map((bl) => {
                    const teamPerformances = performancesByTeam.get(bl.id) || [];
                    const teamTotalPrime = teamPerformances.reduce((sum, p) => sum + calculatePrime(p).primeCalculee, 0);

                    return (
                      <React.Fragment key={bl.id}>
                        <tr className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
                          <td colSpan={10} className="py-3 px-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Building2 className="w-5 h-5" />
                                <span className="font-bold">{bl.activity_name}</span>
                                <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                                  {teamPerformances.length} salarié(s)
                                </Badge>
                              </div>
                              <span className="font-bold">
                                Total Primes: {teamTotalPrime.toLocaleString('fr-FR', {minimumFractionDigits: 2})} {currencyConfig.symbol}
                              </span>
                            </div>
                          </td>
                        </tr>
                        {teamPerformances.map((perf, idx) => {
                          const primeData = calculatePrime(perf);
                          const detail = primeData.detailParIndicateur;

                          return (
                            <tr
                              key={perf.employeeId}
                              className={cn(
                                "border-b border-border/50 hover:bg-muted/30",
                                idx % 2 === 0 ? "bg-transparent" : "bg-muted/10"
                              )}
                            >
                              <td className="py-2 px-4 font-medium">{perf.employeeName}</td>
                              <td className="py-2 px-4 text-muted-foreground">{perf.professionalCategory}</td>
                              <td className="py-2 px-4 text-center">
                                <Badge variant="outline" className="bg-blue-500/10 text-blue-600">
                                  {(primeData.coefficientCompetence * 100).toFixed(1)}%
                                </Badge>
                              </td>
                              <td className="py-2 px-4 text-right text-sm">
                                {detail.find(d => d.kpi === 'abs')?.economies.toLocaleString('fr-FR', {minimumFractionDigits: 0}) || '0'} {currencyConfig.symbol}
                              </td>
                              <td className="py-2 px-4 text-right text-sm">
                                {detail.find(d => d.kpi === 'qd')?.economies.toLocaleString('fr-FR', {minimumFractionDigits: 0}) || '0'} {currencyConfig.symbol}
                              </td>
                              <td className="py-2 px-4 text-right text-sm">
                                {detail.find(d => d.kpi === 'oa')?.economies.toLocaleString('fr-FR', {minimumFractionDigits: 0}) || '0'} {currencyConfig.symbol}
                              </td>
                              <td className="py-2 px-4 text-right text-sm">
                                {detail.find(d => d.kpi === 'ddp')?.economies.toLocaleString('fr-FR', {minimumFractionDigits: 0}) || '0'} {currencyConfig.symbol}
                              </td>
                              <td className="py-2 px-4 text-right text-sm">
                                {detail.find(d => d.kpi === 'ekh')?.economies.toLocaleString('fr-FR', {minimumFractionDigits: 0}) || '0'} {currencyConfig.symbol}
                              </td>
                              <td className="py-2 px-4 text-right font-medium text-green-600">
                                {primeData.totalEconomies.toLocaleString('fr-FR', {minimumFractionDigits: 2})} {currencyConfig.symbol}
                              </td>
                              <td className="py-2 px-4 text-right">
                                <Badge className={cn(
                                  "text-sm",
                                  primeData.primeCalculee > 0
                                    ? "bg-amber-500 text-white"
                                    : "bg-gray-200 text-gray-600"
                                )}>
                                  {primeData.primeCalculee.toLocaleString('fr-FR', {minimumFractionDigits: 2})} {currencyConfig.symbol}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-amber-500/20 font-bold text-lg">
                    <td colSpan={8} className="py-4 px-4 text-right">TOTAL GÉNÉRAL:</td>
                    <td className="py-4 px-4 text-right text-green-600">
                      {totals.totalEconomies.toLocaleString('fr-FR', {minimumFractionDigits: 2})} {currencyConfig.symbol}
                    </td>
                    <td className="py-4 px-4 text-right text-amber-600">
                      {totals.totalPrimes.toLocaleString('fr-FR', {minimumFractionDigits: 2})} {currencyConfig.symbol}
                    </td>
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
