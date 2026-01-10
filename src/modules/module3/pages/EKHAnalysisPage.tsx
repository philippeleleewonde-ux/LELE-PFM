/**
 * ============================================
 * HCM COST SAVINGS - ÉCARTS DE KNOW-HOW (EKH) PAGE
 * ============================================
 * Page dédiée à l'analyse des Écarts de Know-How
 * Extraite de PerformanceRecapPage pour scalabilité 10K+ salariés
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Activity,
  Building2,
  Home,
  RefreshCw,
} from 'lucide-react';
import { HCMLoader } from '@/components/ui/HCMLoader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { CURRENCY_CONFIG } from '@/modules/module1/lib/currency';

import { usePerformanceData } from '../contexts/PerformanceDataContext';
import type { EmployeePerformance } from '../types/performance';

export default function EKHAnalysisPage() {
  const navigate = useNavigate();
  const {
    loading,
    employeePerformances,
    businessLines,
    selectedCurrency,
    getTotals,
    refreshData,
  } = usePerformanceData();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeLevel, setActiveLevel] = useState<'1' | '2' | 'total'>('1');

  const currencyConfig = CURRENCY_CONFIG[selectedCurrency] || CURRENCY_CONFIG.EUR;

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

  // Calcul $EB$3 = Total Pertes Constatées EKH (N1 + N2)
  const pertesConstateesRefEB3 = useMemo(() => {
    return filteredPerformances.reduce((total, perf) => {
      const ddpData = perf.ddp;
      const ekhData = perf.ekh;
      const coefficientCompetence = perf.coefficientCompetence || 0;
      const economiesDDP_N1 = ddpData.economiesRealisees || 0;
      const scoreFinancierN1 = economiesDDP_N1 * coefficientCompetence;
      const pprPrevuesN1 = ekhData.pprPrevues || 0;
      const economiesRealiseesN1 = scoreFinancierN1;
      const economiesRealiseesN2 = scoreFinancierN1;

      let pertesN1 = pprPrevuesN1 - economiesRealiseesN1;
      let pertesN2 = pprPrevuesN1 - economiesRealiseesN2;

      const nomSalarie = perf.employeeName || '';
      let pertesConstateesN1Final: number;
      if (economiesRealiseesN1 === 0 && economiesRealiseesN2 === 0 && nomSalarie !== '') {
        pertesConstateesN1Final = pertesN1;
      } else if (economiesRealiseesN1 === 0 && economiesRealiseesN2 === 0 && nomSalarie === '') {
        pertesConstateesN1Final = 0;
      } else if (economiesRealiseesN1 > 0 && economiesRealiseesN2 === 0) {
        pertesConstateesN1Final = pertesN1;
      } else if (economiesRealiseesN1 === 0 && economiesRealiseesN2 > 0) {
        pertesConstateesN1Final = 0;
      } else {
        pertesConstateesN1Final = pertesN1;
      }

      let pertesConstateesN2Final: number;
      if (economiesRealiseesN1 === 0 && economiesRealiseesN2 === 0 && nomSalarie !== '') {
        pertesConstateesN2Final = 0;
      } else if (economiesRealiseesN1 === 0 && economiesRealiseesN2 === 0 && nomSalarie === '') {
        pertesConstateesN2Final = 0;
      } else if (economiesRealiseesN1 > 0 && economiesRealiseesN2 === 0) {
        pertesConstateesN2Final = 0;
      } else if (economiesRealiseesN1 === 0 && economiesRealiseesN2 > 0) {
        pertesConstateesN2Final = pertesN2;
      } else {
        pertesConstateesN2Final = pertesN2;
      }

      return total + pertesConstateesN1Final + pertesConstateesN2Final;
    }, 0);
  }, [filteredPerformances]);

  // Fonction pour obtenir les données EKH d'un salarié
  const getEKHData = (perf: EmployeePerformance) => {
    const ddpData = perf.ddp;
    const ekhData = perf.ekh;
    const coefficientCompetence = perf.coefficientCompetence || 0;

    // NIVEAU 1
    const economiesDDP_N1 = ddpData.economiesRealisees || 0;
    const scoreFinancierN1 = economiesDDP_N1 * coefficientCompetence;
    const pprPrevuesN1 = ekhData.pprPrevues || 0;
    const economiesRealiseesN1 = scoreFinancierN1;

    // NIVEAU 2
    const scoreFinancierN2 = economiesDDP_N1 * coefficientCompetence;
    const pprPrevuesN2 = pprPrevuesN1;
    const economiesRealiseesN2 = scoreFinancierN2;

    // Pertes constatées N1
    let pertesConstateesN1_EKH: number;
    if (economiesRealiseesN1 < 0) {
      pertesConstateesN1_EKH = pprPrevuesN1 - (-economiesRealiseesN1);
    } else if (economiesRealiseesN1 > 0) {
      pertesConstateesN1_EKH = pprPrevuesN1 - economiesRealiseesN1;
    } else {
      pertesConstateesN1_EKH = pprPrevuesN1 - economiesRealiseesN1;
    }

    // Pertes constatées N2
    let pertesConstateesN2_EKH: number;
    if (economiesRealiseesN2 < 0) {
      pertesConstateesN2_EKH = pprPrevuesN2 - (-economiesRealiseesN2);
    } else if (economiesRealiseesN2 > 0) {
      pertesConstateesN2_EKH = pprPrevuesN2 - economiesRealiseesN2;
    } else {
      pertesConstateesN2_EKH = pprPrevuesN2 - economiesRealiseesN2;
    }

    const nomSalarie = perf.employeeName || '';

    // Pertes constatées N1 Final
    let pertesConstateesN1Final: number;
    if (economiesRealiseesN1 === 0 && economiesRealiseesN2 === 0 && nomSalarie !== '') {
      pertesConstateesN1Final = pertesConstateesN1_EKH;
    } else if (economiesRealiseesN1 === 0 && economiesRealiseesN2 === 0 && nomSalarie === '') {
      pertesConstateesN1Final = 0;
    } else if (economiesRealiseesN1 > 0 && economiesRealiseesN2 === 0) {
      pertesConstateesN1Final = pertesConstateesN1_EKH;
    } else if (economiesRealiseesN1 === 0 && economiesRealiseesN2 > 0) {
      pertesConstateesN1Final = 0;
    } else {
      pertesConstateesN1Final = pertesConstateesN1_EKH;
    }

    const pertesConstateesRefN1 = pertesConstateesRefEB3;

    // Pertes en % N1
    let pertesEnPourcentage2_N1: number;
    if (pertesConstateesN1Final === 0) {
      pertesEnPourcentage2_N1 = 0;
    } else if (pertesConstateesRefN1 === 0) {
      pertesEnPourcentage2_N1 = 0;
    } else {
      pertesEnPourcentage2_N1 = (pertesConstateesN1Final / pertesConstateesRefN1) * 100;
    }

    let pertesEnPourcentageN1: number;
    if (economiesRealiseesN1 === 0 && economiesRealiseesN2 === 0) {
      pertesEnPourcentageN1 = pertesEnPourcentage2_N1;
    } else if (economiesRealiseesN1 > 0 && economiesRealiseesN2 === 0) {
      pertesEnPourcentageN1 = pertesEnPourcentage2_N1;
    } else if (economiesRealiseesN1 === 0 && economiesRealiseesN2 > 0) {
      pertesEnPourcentageN1 = 0;
    } else {
      pertesEnPourcentageN1 = pertesEnPourcentage2_N1;
    }

    // Pertes constatées N2 Final
    let pertesConstateesN2Final: number;
    if (economiesRealiseesN1 === 0 && economiesRealiseesN2 === 0 && nomSalarie !== '') {
      pertesConstateesN2Final = 0;
    } else if (economiesRealiseesN1 === 0 && economiesRealiseesN2 === 0 && nomSalarie === '') {
      pertesConstateesN2Final = 0;
    } else if (economiesRealiseesN1 > 0 && economiesRealiseesN2 === 0) {
      pertesConstateesN2Final = 0;
    } else if (economiesRealiseesN1 === 0 && economiesRealiseesN2 > 0 && nomSalarie !== '') {
      pertesConstateesN2Final = pertesConstateesN2_EKH;
    } else {
      pertesConstateesN2Final = pertesConstateesN2_EKH;
    }

    const pertesConstateesRefN2 = pertesConstateesRefN1;

    // Pertes en % N2
    let pertesEnPourcentage2_N2: number;
    if (pertesConstateesN2Final === 0) {
      pertesEnPourcentage2_N2 = 0;
    } else if (pertesConstateesRefN2 === 0) {
      pertesEnPourcentage2_N2 = 0;
    } else {
      pertesEnPourcentage2_N2 = (pertesConstateesN2Final / pertesConstateesRefN2) * 100;
    }

    let pertesEnPourcentageN2: number;
    if (economiesRealiseesN1 === 0 && economiesRealiseesN2 === 0) {
      pertesEnPourcentageN2 = 0;
    } else if (economiesRealiseesN1 > 0 && economiesRealiseesN2 === 0) {
      pertesEnPourcentageN2 = 0;
    } else if (economiesRealiseesN1 === 0 && economiesRealiseesN2 > 0) {
      pertesEnPourcentageN2 = pertesEnPourcentage2_N2;
    } else {
      pertesEnPourcentageN2 = pertesEnPourcentage2_N2;
    }

    return {
      coefficientCompetence,
      scoreFinancierN1,
      pertesConstateesN1: pertesConstateesN1Final,
      pprPrevuesN1,
      economiesRealiseesN1,
      pertesEnPourcentageN1,
      pertesConstateesRefN1,
      scoreFinancierN2,
      pertesConstateesN2: pertesConstateesN2Final,
      pprPrevuesN2,
      economiesRealiseesN2,
      pertesEnPourcentageN2,
      pertesConstateesRefN2,
    };
  };

  // Totaux calculés
  const ekhTotals = useMemo(() => {
    return filteredPerformances.reduce((acc, perf) => {
      const data = getEKHData(perf);
      return {
        scoreFinancierN1: acc.scoreFinancierN1 + data.scoreFinancierN1,
        scoreFinancierN2: acc.scoreFinancierN2 + data.scoreFinancierN2,
        pertesConstateesN1: acc.pertesConstateesN1 + data.pertesConstateesN1,
        pertesConstateesN2: acc.pertesConstateesN2 + data.pertesConstateesN2,
        pprPrevuesN1: acc.pprPrevuesN1 + data.pprPrevuesN1,
        pprPrevuesN2: acc.pprPrevuesN2 + data.pprPrevuesN2,
        economiesRealiseesN1: acc.economiesRealiseesN1 + data.economiesRealiseesN1,
        economiesRealiseesN2: acc.economiesRealiseesN2 + data.economiesRealiseesN2,
      };
    }, {
      scoreFinancierN1: 0, scoreFinancierN2: 0,
      pertesConstateesN1: 0, pertesConstateesN2: 0,
      pprPrevuesN1: 0, pprPrevuesN2: 0,
      economiesRealiseesN1: 0, economiesRealiseesN2: 0,
    });
  }, [filteredPerformances, pertesConstateesRefEB3]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <HCMLoader text="Chargement des données EKH..." />
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
                <Activity className="w-6 h-6 text-cyan-500" />
                Écarts de Know-How (EKH)
              </h1>
              <p className="text-muted-foreground">
                Analyse des compétences - {filteredPerformances.length} salariés
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

        {/* Controls */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <Input
                placeholder="Rechercher un salarié..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <Tabs value={activeLevel} onValueChange={(v) => setActiveLevel(v as '1' | '2' | 'total')}>
                <TabsList>
                  <TabsTrigger value="1">Niveau 1</TabsTrigger>
                  <TabsTrigger value="2">Niveau 2</TabsTrigger>
                  <TabsTrigger value="total">Niveau TOTAL</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Table EKH */}
        <Card className="border-2 border-cyan-500/30">
          <CardHeader className="bg-gradient-to-r from-cyan-500 to-blue-600">
            <CardTitle className="text-white">
              Écarts de Know-How - Niveau {activeLevel === 'total' ? 'TOTAL' : activeLevel}
            </CardTitle>
            <CardDescription className="text-white/70">
              Analyse des coefficients de compétence
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {activeLevel === 'total' ? (
              // NIVEAU TOTAL
              <div className="p-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 bg-cyan-500/10">
                      <th className="py-3 px-4 text-center font-semibold">Score Financier</th>
                      <th className="py-3 px-4 text-center font-semibold">Pertes constatées</th>
                      <th className="py-3 px-4 text-center font-semibold">PPR PREVUES</th>
                      <th className="py-3 px-4 text-center font-semibold">ECONOMIES REALISEES</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-4 px-4 text-center font-bold text-lg text-blue-600">
                        {(ekhTotals.scoreFinancierN1 + ekhTotals.scoreFinancierN2).toLocaleString('fr-FR', {minimumFractionDigits: 2})} {currencyConfig.symbol}
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-lg text-orange-600">
                        {(ekhTotals.pertesConstateesN1 + ekhTotals.pertesConstateesN2).toLocaleString('fr-FR', {minimumFractionDigits: 2})} {currencyConfig.symbol}
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-lg">
                        {(ekhTotals.pprPrevuesN1 + ekhTotals.pprPrevuesN2).toLocaleString('fr-FR', {minimumFractionDigits: 2})} {currencyConfig.symbol}
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-xl text-green-600">
                        {(ekhTotals.economiesRealiseesN1 + ekhTotals.economiesRealiseesN2).toLocaleString('fr-FR', {minimumFractionDigits: 2})} {currencyConfig.symbol}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              // NIVEAU 1 ou 2
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 bg-cyan-500/10">
                      <th className="text-left py-3 px-2 font-semibold">Nom du salarié</th>
                      <th className="text-left py-3 px-2 font-semibold">Catégorie pro</th>
                      <th className="text-center py-3 px-2 font-semibold">Coef. compétence</th>
                      <th className="text-right py-3 px-2 font-semibold">Score financier</th>
                      <th className="text-right py-3 px-2 font-semibold">Pertes constatées</th>
                      <th className="text-right py-3 px-2 font-semibold">PPR PREVUES</th>
                      <th className="text-right py-3 px-2 font-semibold">ECONOMIES REALISEES</th>
                      <th className="text-center py-3 px-2 font-semibold">Pertes en %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {businessLines.map((bl) => {
                      const teamPerformances = performancesByTeam.get(bl.id) || [];
                      return (
                        <React.Fragment key={bl.id}>
                          <tr className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
                            <td colSpan={8} className="py-3 px-3">
                              <div className="flex items-center gap-3">
                                <Building2 className="w-5 h-5" />
                                <span className="font-bold">{bl.activity_name}</span>
                                <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                                  {teamPerformances.length} salarié(s)
                                </Badge>
                              </div>
                            </td>
                          </tr>
                          {teamPerformances.map((perf, idx) => {
                            const data = getEKHData(perf);
                            const isN1 = activeLevel === '1';
                            return (
                              <tr
                                key={perf.employeeId}
                                className={cn(
                                  "border-b border-border/50 hover:bg-muted/30",
                                  idx % 2 === 0 ? "bg-transparent" : "bg-muted/10"
                                )}
                              >
                                <td className="py-2 px-2 font-medium">{perf.employeeName}</td>
                                <td className="py-2 px-2 text-muted-foreground">{perf.professionalCategory}</td>
                                <td className="py-2 px-2 text-center">
                                  <Badge variant="outline" className="bg-cyan-500/10 text-cyan-600">
                                    {(data.coefficientCompetence * 100).toFixed(1)}%
                                  </Badge>
                                </td>
                                <td className="py-2 px-2 text-right text-blue-600 font-medium">
                                  {(isN1 ? data.scoreFinancierN1 : data.scoreFinancierN2).toLocaleString('fr-FR', {minimumFractionDigits: 2})} {currencyConfig.symbol}
                                </td>
                                <td className="py-2 px-2 text-right text-orange-600 font-medium">
                                  {(isN1 ? data.pertesConstateesN1 : data.pertesConstateesN2).toLocaleString('fr-FR', {minimumFractionDigits: 2})} {currencyConfig.symbol}
                                </td>
                                <td className="py-2 px-2 text-right">
                                  {(isN1 ? data.pprPrevuesN1 : data.pprPrevuesN2).toLocaleString('fr-FR', {minimumFractionDigits: 2})} {currencyConfig.symbol}
                                </td>
                                <td className="py-2 px-2 text-right text-green-600 font-bold">
                                  {(isN1 ? data.economiesRealiseesN1 : data.economiesRealiseesN2).toLocaleString('fr-FR', {minimumFractionDigits: 2})} {currencyConfig.symbol}
                                </td>
                                <td className="py-2 px-2 text-center">
                                  <Badge variant="outline" className={cn(
                                    (isN1 ? data.pertesEnPourcentageN1 : data.pertesEnPourcentageN2) > 50
                                      ? "bg-red-500/10 text-red-600"
                                      : "bg-green-500/10 text-green-600"
                                  )}>
                                    {(isN1 ? data.pertesEnPourcentageN1 : data.pertesEnPourcentageN2).toFixed(1)}%
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
                    <tr className="border-t-2 font-bold bg-cyan-500/10">
                      <td colSpan={3} className="py-4 px-2 text-right">
                        TOTAL EKH NIVEAU {activeLevel}:
                      </td>
                      <td className="py-4 px-2 text-right text-blue-600">
                        {(activeLevel === '1' ? ekhTotals.scoreFinancierN1 : ekhTotals.scoreFinancierN2).toLocaleString('fr-FR', {minimumFractionDigits: 2})} {currencyConfig.symbol}
                      </td>
                      <td className="py-4 px-2 text-right text-orange-600">
                        {(activeLevel === '1' ? ekhTotals.pertesConstateesN1 : ekhTotals.pertesConstateesN2).toLocaleString('fr-FR', {minimumFractionDigits: 2})} {currencyConfig.symbol}
                      </td>
                      <td className="py-4 px-2 text-right">
                        {(activeLevel === '1' ? ekhTotals.pprPrevuesN1 : ekhTotals.pprPrevuesN2).toLocaleString('fr-FR', {minimumFractionDigits: 2})} {currencyConfig.symbol}
                      </td>
                      <td className="py-4 px-2 text-right text-green-600">
                        {(activeLevel === '1' ? ekhTotals.economiesRealiseesN1 : ekhTotals.economiesRealiseesN2).toLocaleString('fr-FR', {minimumFractionDigits: 2})} {currencyConfig.symbol}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
