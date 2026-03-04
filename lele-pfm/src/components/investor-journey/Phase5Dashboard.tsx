import React, { useState, useEffect, memo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
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
  const { acceptedAssets, procedureProgress, toggleStepComplete, initProcedureProgress } = useInvestorJourney();

  // Initialize procedure progress for each accepted asset (needed for toggleStepComplete)
  useEffect(() => {
    for (const asset of acceptedAssets) {
      if (!procedureProgress[asset.id]) {
        initProcedureProgress(asset.id, asset.assetClass, 'CM');
      }
    }
  }, [acceptedAssets, procedureProgress, initProcedureProgress]);

  if (acceptedAssets.length === 0) return null;

  return (
    <PerfGlassCard style={styles.sectionCard}>
      <SectionHeader icon={ClipboardList} title="Procedures administratives" color={PF.green} />

      {acceptedAssets.map((asset) => {
        const progress = procedureProgress[asset.id];
        const completedSteps = progress?.completedSteps ?? [];
        // Build a simple placeholder steps list based on asset class
        // In production, these would come from the procedures knowledge base
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
            {/* Asset header */}
            <View style={styles.procedureHeader}>
              <Text style={styles.procedureAssetName}>{asset.name}</Text>
              <Text style={styles.procedureProgress}>
                {completedCount}/{totalSteps}
              </Text>
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

            {/* Steps */}
            {mockSteps.map((step) => (
              <ProcedureStepCard
                key={step.order}
                step={step}
                isCompleted={completedSteps.includes(step.order)}
                onToggle={() => toggleStepComplete(asset.id, step.order)}
                stepNumber={step.order}
              />
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
