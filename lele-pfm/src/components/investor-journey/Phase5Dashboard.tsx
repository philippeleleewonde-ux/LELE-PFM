import React, { useState, useEffect, useMemo, memo } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from 'react-native';
import {
  Briefcase,
  CalendarCheck,
  ClipboardList,
  MessageSquare,
  History,
  Settings,
  TrendingUp,
  TrendingDown,
  Flame,
  Info,
  Wallet,
} from 'lucide-react-native';
import { PF, PerfGlassCard, SectionHeader } from '@/components/performance/shared';
import { JourneyProgressBar } from '@/components/investor-journey/JourneyProgressBar';
import { ProcedureStepCard } from '@/components/investor-journey/ProcedureStepCard';
import { AdvisoryBanner } from '@/components/investor-journey/AdvisoryBanner';
import { CheckInModal } from '@/components/investor-journey/CheckInModal';
import { RendezVousConfigModal } from '@/components/investor-journey/RendezVousConfigModal';
import { useInvestorJourney } from '@/hooks/useInvestorJourney';
import { useRendezVous } from '@/hooks/useRendezVous';
import { useInvestmentAdvisory } from '@/hooks/useInvestmentAdvisory';
import { usePortfolioPerformance } from '@/hooks/usePortfolioPerformance';
import { useJourneyStore } from '@/stores/journey-store';
import { CheckInRecord, ProcedureStep, RendezVousConfig } from '@/types/investor-journey';

// ─── Portfolio Overview Section ───

function PortfolioOverview() {
  const perf = usePortfolioPerformance();

  if (!perf) {
    return (
      <PerfGlassCard style={styles.sectionCard}>
        <SectionHeader icon={Briefcase} title="Vue portefeuille" color={PF.accent} />
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            Aucun bilan enregistre. Faites votre premier bilan pour voir vos performances.
          </Text>
        </View>
      </PerfGlassCard>
    );
  }

  const isPositive = perf.totalReturns >= 0;
  const returnColor = isPositive ? PF.green : PF.red;
  const projColor = perf.vsProjection >= 0 ? PF.green : PF.red;

  return (
    <PerfGlassCard style={styles.sectionCard}>
      <SectionHeader icon={Briefcase} title="Vue portefeuille" color={PF.accent} />

      {/* Main value */}
      <View style={styles.portfolioMain}>
        <Text style={styles.portfolioLabel}>Valeur totale</Text>
        <Text style={styles.portfolioValue}>
          {perf.currentValue.toLocaleString()} FCFA
        </Text>
      </View>

      {/* Metrics grid */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Investi</Text>
          <Text style={styles.metricValue}>
            {perf.totalInvested.toLocaleString()}
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Rendements</Text>
          <View style={styles.metricRow}>
            {isPositive ? (
              <TrendingUp size={14} color={returnColor} />
            ) : (
              <TrendingDown size={14} color={returnColor} />
            )}
            <Text style={[styles.metricValue, { color: returnColor }]}>
              {isPositive ? '+' : ''}{perf.totalReturns.toLocaleString()}
            </Text>
          </View>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Performance</Text>
          <Text style={[styles.metricValue, { color: returnColor }]}>
            {isPositive ? '+' : ''}{perf.overallPerformance.toFixed(2)}%
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>vs Projection</Text>
          <Text style={[styles.metricValue, { color: projColor }]}>
            {perf.vsProjection >= 0 ? '+' : ''}{perf.vsProjection.toFixed(2)}%
          </Text>
        </View>
      </View>
    </PerfGlassCard>
  );
}

// ─── Next Rendez-vous Section ───

interface RendezVousSectionProps {
  onOpenCheckIn: () => void;
  onOpenConfig: () => void;
}

function RendezVousSection({ onOpenCheckIn, onOpenConfig }: RendezVousSectionProps) {
  const rdv = useRendezVous();

  return (
    <PerfGlassCard style={styles.sectionCard}>
      <SectionHeader icon={CalendarCheck} title="Prochain rendez-vous" color={PF.blue} />

      <View style={styles.rdvContent}>
        {/* Countdown */}
        <View style={styles.countdownContainer}>
          <Text style={styles.countdownNumber}>{rdv.daysUntilNext}</Text>
          <Text style={styles.countdownLabel}>jour{rdv.daysUntilNext !== 1 ? 's' : ''}</Text>
        </View>

        <View style={styles.rdvInfo}>
          {rdv.nextDate && (
            <Text style={styles.rdvDate}>
              {rdv.nextDate.toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </Text>
          )}

          {/* Streak */}
          {rdv.streak > 0 && (
            <View style={styles.streakBadge}>
              <Flame size={14} color={PF.orange} />
              <Text style={styles.streakText}>{rdv.streak} bilan{rdv.streak > 1 ? 's' : ''} consecutif{rdv.streak > 1 ? 's' : ''}</Text>
            </View>
          )}

          {rdv.isOverdue && (
            <View style={styles.overdueBadge}>
              <Text style={styles.overdueText}>En retard</Text>
            </View>
          )}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.rdvActions}>
        <Pressable onPress={onOpenCheckIn} style={styles.checkInBtn}>
          <Text style={styles.checkInBtnText}>Faire mon bilan</Text>
        </Pressable>
        <Pressable onPress={onOpenConfig} style={styles.configLink}>
          <Settings size={14} color={PF.textSecondary} />
          <Text style={styles.configLinkText}>Configurer</Text>
        </Pressable>
      </View>
    </PerfGlassCard>
  );
}

// ─── Procedure Checklist Section ───

function ProcedureChecklist() {
  const {
    acceptedAssets,
    procedureProgress,
    toggleStepComplete,
    initProcedureProgress,
    chosenStrategy,
    monthlyBudget,
    capitalInitial,
    investedAmounts,
    setInvestedAmount,
  } = useInvestorJourney();

  // Local state for text inputs (string) — synced to store as numbers
  const [localAmounts, setLocalAmounts] = useState<Record<string, string>>({});

  // Initialize local amounts from store on mount
  useEffect(() => {
    const initial: Record<string, string> = {};
    for (const asset of acceptedAssets) {
      const stored = investedAmounts[asset.id];
      if (stored && stored > 0) {
        initial[asset.id] = String(stored);
      }
    }
    setLocalAmounts(initial);
  }, []);

  // Initialize procedure progress for each accepted asset (needed for toggleStepComplete)
  useEffect(() => {
    for (const asset of acceptedAssets) {
      if (!procedureProgress[asset.id]) {
        initProcedureProgress(asset.id, asset.assetClass, 'CM');
      }
    }
  }, [acceptedAssets, procedureProgress, initProcedureProgress]);

  // Compute per-asset allocation guidance
  const assetGuidance = useMemo(() => {
    if (!chosenStrategy || acceptedAssets.length === 0) return {};

    const totalWeight = chosenStrategy.pillarWeights.reduce((s, pw) => s + pw.weight, 0);
    const result: Record<string, { allocation: number; minInitial: number; maxInitial: number; recommendedInitial: number; minMonthly: number; maxMonthly: number; recommendedMonthly: number }> = {};

    for (const asset of acceptedAssets) {
      // Find asset's pillar weight
      const pillarWeight = chosenStrategy.pillarWeights.find(
        (pw) => pw.pillar === asset.pillar,
      );
      const pillarPct = pillarWeight ? pillarWeight.weight : 0;

      // Count assets in same pillar for equal distribution
      const samePillarCount = acceptedAssets.filter(
        (a) => a.pillar === asset.pillar,
      ).length;
      const assetPct = samePillarCount > 0 ? pillarPct / samePillarCount : 0;
      const ratio = totalWeight > 0 ? assetPct / 100 : 0;

      // Per-asset amounts based on allocation %
      const recInitial = Math.round(capitalInitial * ratio);
      const minInitial = Math.round(Math.max(recInitial * 0.3, 5000));
      const maxInitial = Math.round(recInitial * 1.5);

      const recMonthly = Math.round(monthlyBudget * ratio);
      const minMonthly = Math.round(Math.max(recMonthly * 0.3, 2000));
      const maxMonthly = Math.round(recMonthly * 1.5);

      result[asset.id] = {
        allocation: Math.round(assetPct),
        minInitial,
        maxInitial,
        recommendedInitial: recInitial,
        minMonthly,
        maxMonthly,
        recommendedMonthly: recMonthly,
      };
    }

    return result;
  }, [chosenStrategy, acceptedAssets, capitalInitial, monthlyBudget]);

  const handleAmountChange = (assetId: string, value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    setLocalAmounts((prev) => ({ ...prev, [assetId]: cleaned }));
    const num = parseInt(cleaned) || 0;
    if (num > 0) {
      setInvestedAmount(assetId, num);
    }
  };

  if (acceptedAssets.length === 0) return null;

  return (
    <PerfGlassCard style={styles.sectionCard}>
      <SectionHeader icon={ClipboardList} title="Procedures administratives" color={PF.green} />

      {acceptedAssets.map((asset) => {
        const progress = procedureProgress[asset.id];
        const completedSteps = progress?.completedSteps ?? [];
        const guidance = assetGuidance[asset.id];

        // Build a simple placeholder steps list based on asset class
        const mockSteps: ProcedureStep[] = [
          {
            order: 1,
            titleKey: `Ouvrir un compte ${asset.assetClass}`,
            descriptionKey: `Se rendre a l'institution financiere pour l'ouverture de compte.`,
            institution: 'Institution financiere',
            documents: ["Piece d'identite", 'Justificatif de domicile'],
            estimatedDays: 3,
            tips: ['Prendre rendez-vous en avance'],
          },
          {
            order: 2,
            titleKey: 'Effectuer le premier versement',
            descriptionKey: 'Verser le capital initial sur le compte.',
            institution: 'Banque / Mobile Money',
            documents: ['Releve bancaire'],
            estimatedDays: 1,
            tips: [],
          },
          {
            order: 3,
            titleKey: 'Configurer les versements automatiques',
            descriptionKey: 'Mettre en place les virements recurrents mensuels.',
            institution: 'Banque',
            documents: ['RIB'],
            estimatedDays: 2,
            tips: ['Choisir une date proche du jour de paie'],
          },
        ];

        const totalSteps = mockSteps.length;
        const completedCount = completedSteps.length;
        const progressPercent = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;

        return (
          <View key={asset.id} style={styles.procedureAsset}>
            {/* Asset header with allocation % */}
            <View style={styles.procedureHeader}>
              <Text style={styles.procedureAssetName}>{asset.name}</Text>
              <View style={styles.procedureHeaderRight}>
                {guidance && (
                  <View style={styles.allocationBadge}>
                    <Text style={styles.allocationBadgeText}>{guidance.allocation}%</Text>
                  </View>
                )}
                <Text style={styles.procedureProgress}>
                  {completedCount}/{totalSteps}
                </Text>
              </View>
            </View>

            {/* Progress bar */}
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${progressPercent}%` },
                ]}
              />
            </View>

            {/* Investment guidance card */}
            {guidance && guidance.recommendedInitial > 0 && (
              <View style={styles.guidanceCard}>
                <View style={styles.guidanceHeader}>
                  <Info size={14} color={PF.blue} />
                  <Text style={styles.guidanceTitle}>Montant conseille</Text>
                </View>
                <View style={styles.guidanceGrid}>
                  <View style={styles.guidanceItem}>
                    <Text style={styles.guidanceLabel}>Minimum</Text>
                    <Text style={styles.guidanceValue}>
                      {guidance.minInitial.toLocaleString()} FCFA
                    </Text>
                  </View>
                  <View style={[styles.guidanceItem, styles.guidanceItemHighlight]}>
                    <Text style={styles.guidanceLabelHighlight}>Recommande</Text>
                    <Text style={styles.guidanceValueHighlight}>
                      {guidance.recommendedInitial.toLocaleString()} FCFA
                    </Text>
                  </View>
                  <View style={styles.guidanceItem}>
                    <Text style={styles.guidanceLabel}>Maximum</Text>
                    <Text style={styles.guidanceValue}>
                      {guidance.maxInitial.toLocaleString()} FCFA
                    </Text>
                  </View>
                </View>
                {guidance.recommendedMonthly > 0 && (
                  <View style={styles.guidanceMonthly}>
                    <Text style={styles.guidanceMonthlyText}>
                      Versement mensuel conseille : {guidance.minMonthly.toLocaleString()} - {guidance.maxMonthly.toLocaleString()} FCFA
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Steps */}
            {mockSteps.map((step) => (
              <View key={step.order}>
                <ProcedureStepCard
                  step={step}
                  isCompleted={completedSteps.includes(step.order)}
                  onToggle={() => toggleStepComplete(asset.id, step.order)}
                  stepNumber={step.order}
                />
                {/* Investment amount input on the "versement" step */}
                {step.order === 2 && (
                  <View style={styles.investedInputContainer}>
                    <View style={styles.investedInputHeader}>
                      <Wallet size={14} color={PF.accent} />
                      <Text style={styles.investedInputLabel}>Montant investi</Text>
                    </View>
                    <View style={styles.investedInputRow}>
                      <TextInput
                        style={styles.investedInput}
                        value={localAmounts[asset.id] ?? ''}
                        onChangeText={(v) => handleAmountChange(asset.id, v)}
                        keyboardType="numeric"
                        placeholder={guidance ? guidance.recommendedInitial.toLocaleString() : '0'}
                        placeholderTextColor={PF.textMuted}
                      />
                      <Text style={styles.investedInputCurrency}>FCFA</Text>
                    </View>
                    {investedAmounts[asset.id] > 0 && guidance && (
                      <Text style={[
                        styles.investedFeedback,
                        {
                          color: investedAmounts[asset.id] >= guidance.minInitial
                            ? PF.green
                            : PF.orange,
                        },
                      ]}>
                        {investedAmounts[asset.id] >= guidance.minInitial
                          ? investedAmounts[asset.id] >= guidance.recommendedInitial
                            ? 'Montant dans la fourchette recommandee'
                            : 'Montant acceptable (au-dessus du minimum)'
                          : 'Montant en dessous du minimum conseille'}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>
        );
      })}
    </PerfGlassCard>
  );
}

// ─── Advisory Messages Section ───

function AdvisorySection() {
  const { allAdvisories, dismissAdvisory } = useInvestmentAdvisory();

  // Sort by severity: urgent first
  const sorted = [...allAdvisories].sort((a, b) => {
    const order = { urgent: 0, warning: 1, info: 2, success: 3 };
    return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
  });

  if (sorted.length === 0) return null;

  return (
    <PerfGlassCard style={styles.sectionCard}>
      <SectionHeader icon={MessageSquare} title="Conseils & Alertes" color={PF.orange} />

      {sorted.map((advisory) => (
        <AdvisoryBanner
          key={advisory.id}
          advisory={advisory}
          onDismiss={dismissAdvisory}
        />
      ))}
    </PerfGlassCard>
  );
}

// ─── Check-in History Section ───

function CheckInHistory() {
  const checkIns = useJourneyStore((s) => s.checkIns);

  if (checkIns.length === 0) return null;

  const sorted = [...checkIns].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const statusColors: Record<string, string> = {
    completed: PF.green,
    skipped: PF.accent,
    missed: PF.red,
  };

  const statusLabels: Record<string, string> = {
    completed: 'Fait',
    skipped: 'Ignore',
    missed: 'Manque',
  };

  return (
    <PerfGlassCard style={styles.sectionCard}>
      <SectionHeader icon={History} title="Historique des bilans" color={PF.violet} />

      {sorted.slice(0, 10).map((checkIn) => {
        const date = new Date(checkIn.date);
        const color = statusColors[checkIn.status] ?? PF.textMuted;
        const isPositive = checkIn.overallPerformance >= 0;

        return (
          <View key={checkIn.id} style={styles.historyItem}>
            <View style={[styles.historyDot, { backgroundColor: color }]} />
            <View style={styles.historyContent}>
              <Text style={styles.historyDate}>
                {date.toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
              {checkIn.status === 'completed' && (
                <Text style={styles.historyValue}>
                  {checkIn.totalPortfolioValue.toLocaleString()} FCFA
                </Text>
              )}
            </View>
            <View style={styles.historyRight}>
              {checkIn.status === 'completed' && (
                <Text
                  style={[
                    styles.historyPerf,
                    { color: isPositive ? PF.green : PF.red },
                  ]}
                >
                  {isPositive ? '+' : ''}{checkIn.overallPerformance.toFixed(2)}%
                </Text>
              )}
              <View style={[styles.statusBadge, { backgroundColor: color + '20' }]}>
                <Text style={[styles.statusText, { color }]}>
                  {statusLabels[checkIn.status] ?? checkIn.status}
                </Text>
              </View>
            </View>
          </View>
        );
      })}
    </PerfGlassCard>
  );
}

// ─── Main Dashboard ───

function Phase5DashboardInner() {
  const {
    acceptedAssets,
    rendezVousConfig,
    setRendezVousConfig,
    addCheckIn,
    chosenStrategy,
    activeStrategies,
    checkIns,
    investmentDuration,
    investedAmounts,
  } = useInvestorJourney();
  const perf = usePortfolioPerformance();
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  const handleCheckInSubmit = (checkIn: CheckInRecord) => {
    addCheckIn(checkIn);
  };

  const handleConfigSave = (config: RendezVousConfig) => {
    setRendezVousConfig(config);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Progress bar */}
      <JourneyProgressBar currentPhase="accompaniment" />

      {/* Portfolio overview */}
      <PortfolioOverview />

      {/* Next rendez-vous */}
      <RendezVousSection
        onOpenCheckIn={() => setShowCheckIn(true)}
        onOpenConfig={() => setShowConfig(true)}
      />

      {/* Procedure checklist */}
      <ProcedureChecklist />

      {/* Advisory messages */}
      <AdvisorySection />

      {/* Check-in history */}
      <CheckInHistory />

      {/* Modals */}
      <CheckInModal
        visible={showCheckIn}
        onClose={() => setShowCheckIn(false)}
        assets={acceptedAssets}
        onSubmit={handleCheckInSubmit}
        chosenStrategy={chosenStrategy}
        allStrategies={activeStrategies}
        previousCheckIns={checkIns}
        projectedValue={perf?.projectedValue}
        durationMonths={investmentDuration?.months}
        prefillInvestedAmounts={investedAmounts}
      />

      <RendezVousConfigModal
        visible={showConfig}
        onClose={() => setShowConfig(false)}
        config={rendezVousConfig}
        onSave={handleConfigSave}
      />
    </ScrollView>
  );
}

export const Phase5Dashboard = memo(Phase5DashboardInner);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PF.darkBg,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  sectionCard: {
    padding: 16,
  },
  emptyState: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: PF.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Portfolio Overview
  portfolioMain: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  portfolioLabel: {
    color: PF.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  portfolioValue: {
    color: PF.accent,
    fontSize: 26,
    fontWeight: '800',
    marginTop: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  metricItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  metricLabel: {
    color: PF.textMuted,
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  metricValue: {
    color: PF.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  // Rendez-vous
  rdvContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  countdownContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: PF.blue + '20',
    borderWidth: 2,
    borderColor: PF.blue + '40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownNumber: {
    color: PF.blue,
    fontSize: 22,
    fontWeight: '800',
  },
  countdownLabel: {
    color: PF.blue,
    fontSize: 10,
    fontWeight: '500',
    marginTop: -2,
  },
  rdvInfo: {
    flex: 1,
    gap: 6,
  },
  rdvDate: {
    color: PF.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakText: {
    color: PF.orange,
    fontSize: 12,
    fontWeight: '600',
  },
  overdueBadge: {
    alignSelf: 'flex-start',
    backgroundColor: PF.red + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  overdueText: {
    color: PF.red,
    fontSize: 11,
    fontWeight: '700',
  },
  rdvActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkInBtn: {
    flex: 1,
    backgroundColor: PF.blue,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  checkInBtnText: {
    color: '#0F1014',
    fontSize: 14,
    fontWeight: '700',
  },
  configLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  configLinkText: {
    color: PF.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },

  // Procedure checklist
  procedureAsset: {
    marginBottom: 16,
  },
  procedureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  procedureAssetName: {
    color: PF.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  procedureProgress: {
    color: PF.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: PF.green,
    borderRadius: 2,
  },
  procedureHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  allocationBadge: {
    backgroundColor: PF.accent + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  allocationBadgeText: {
    color: PF.accent,
    fontSize: 11,
    fontWeight: '700',
  },

  // Investment guidance
  guidanceCard: {
    backgroundColor: PF.blue + '10',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: PF.blue + '20',
  },
  guidanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  guidanceTitle: {
    color: PF.blue,
    fontSize: 12,
    fontWeight: '700',
  },
  guidanceGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  guidanceItem: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    gap: 2,
  },
  guidanceItemHighlight: {
    backgroundColor: PF.accent + '15',
    borderWidth: 1,
    borderColor: PF.accent + '30',
  },
  guidanceLabel: {
    color: PF.textMuted,
    fontSize: 9,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  guidanceLabelHighlight: {
    color: PF.accent,
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  guidanceValue: {
    color: PF.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  guidanceValueHighlight: {
    color: PF.accent,
    fontSize: 13,
    fontWeight: '800',
  },
  guidanceMonthly: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  guidanceMonthlyText: {
    color: PF.textSecondary,
    fontSize: 11,
    textAlign: 'center',
  },

  // Invested amount input
  investedInputContainer: {
    marginLeft: 36,
    marginTop: 4,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: PF.accent + '15',
  },
  investedInputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  investedInputLabel: {
    color: PF.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  investedInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  investedInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: PF.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: PF.border,
  },
  investedInputCurrency: {
    color: PF.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  investedFeedback: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 6,
  },

  // Check-in history
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  historyContent: {
    flex: 1,
    gap: 2,
  },
  historyDate: {
    color: PF.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  historyValue: {
    color: PF.textSecondary,
    fontSize: 12,
  },
  historyRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  historyPerf: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
