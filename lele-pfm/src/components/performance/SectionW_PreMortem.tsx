import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PF, PerfGlassCard } from './shared';
import { useInvestmentStore } from '@/stores/investment-store';
import {
  runPreMortem,
  type FailureMode,
  type PreMortemAnalysis,
} from '@/domain/calculators/pre-mortem-engine';

// ─── Color helpers ───

function riskColor(level: PreMortemAnalysis['overallRiskLevel']): string {
  switch (level) {
    case 'low':
      return PF.green;
    case 'moderate':
      return PF.yellow;
    case 'elevated':
      return PF.orange;
    case 'high':
      return PF.red;
  }
}

function impactColor(impact: FailureMode['impact']): string {
  switch (impact) {
    case 'low':
      return PF.green;
    case 'medium':
      return PF.yellow;
    case 'high':
      return PF.orange;
    case 'critical':
      return PF.red;
  }
}

function impactLabel(impact: FailureMode['impact']): string {
  switch (impact) {
    case 'low':
      return 'Faible';
    case 'medium':
      return 'Moyen';
    case 'high':
      return 'Élevé';
    case 'critical':
      return 'Critique';
  }
}

function riskLabel(level: PreMortemAnalysis['overallRiskLevel']): string {
  switch (level) {
    case 'low':
      return 'Faible';
    case 'moderate':
      return 'Modéré';
    case 'elevated':
      return 'Élevé';
    case 'high':
      return 'Très élevé';
  }
}

// ─── Component ───

export function SectionW_PreMortem() {
  const allocations = useInvestmentStore((s) => s.allocations);
  const investorProfile = useInvestmentStore((s) => s.investorProfile);

  const analysis = useMemo(() => {
    if (!investorProfile || allocations.length === 0) return null;
    return runPreMortem(allocations);
  }, [allocations, investorProfile]);

  if (!investorProfile) {
    return (
      <PerfGlassCard>
        <Text style={styles.emptyText}>
          Configurez votre profil investisseur dans les réglages pour voir
          l'analyse pré-mortem.
        </Text>
      </PerfGlassCard>
    );
  }

  if (!analysis || analysis.failureModes.length === 0) {
    return (
      <PerfGlassCard>
        <Text style={styles.emptyText}>
          Aucun scénario de défaillance identifié pour votre portefeuille
          actuel.
        </Text>
      </PerfGlassCard>
    );
  }

  const survColor = riskColor(analysis.overallRiskLevel);

  return (
    <View style={styles.container}>
      {/* Header */}
      <PerfGlassCard style={styles.section}>
        <Text style={styles.sectionTitle}>Analyse Pré-Mortem</Text>
        <Text style={styles.subtitle}>Et si votre plan échouait ?</Text>
        <Text style={styles.subtitleMuted}>
          Anticipez les risques avant qu'ils ne se réalisent.
        </Text>

        {/* Survival probability */}
        <View style={styles.survivalRow}>
          <View style={styles.survivalCenter}>
            <Text style={[styles.survivalNumber, { color: survColor }]}>
              {analysis.survivalProbability}%
            </Text>
            <Text style={styles.survivalLabel}>Probabilité de survie</Text>
          </View>
          <View
            style={[styles.riskBadge, { backgroundColor: survColor + '20' }]}
          >
            <Text style={[styles.riskBadgeText, { color: survColor }]}>
              Risque {riskLabel(analysis.overallRiskLevel)}
            </Text>
          </View>
        </View>
      </PerfGlassCard>

      {/* Top 3 threats */}
      <PerfGlassCard style={styles.section}>
        <Text style={styles.sectionTitle}>Menaces principales</Text>
        <View style={styles.threatList}>
          {analysis.topThreats.map((threat) => {
            const badgeColor = impactColor(threat.impact);
            return (
              <View key={threat.id} style={styles.threatCard}>
                {/* Header row: badge + title + probability */}
                <View style={styles.threatHeader}>
                  <View
                    style={[
                      styles.impactBadge,
                      { backgroundColor: badgeColor + '20' },
                    ]}
                  >
                    <Text
                      style={[styles.impactBadgeText, { color: badgeColor }]}
                    >
                      {impactLabel(threat.impact)}
                    </Text>
                  </View>
                  <Text style={styles.threatTitle} numberOfLines={1}>
                    {threat.title}
                  </Text>
                  <Text style={[styles.threatProb, { color: badgeColor }]}>
                    {threat.probability}%
                  </Text>
                </View>

                {/* Description */}
                <Text style={styles.threatDesc}>{threat.description}</Text>

                {/* Trigger conditions */}
                <Text style={styles.triggerLabel}>Déclencheurs</Text>
                <Text style={styles.triggerText}>
                  {threat.triggerConditions}
                </Text>

                {/* Mitigation card */}
                <View style={styles.mitigationCard}>
                  <Text style={styles.mitigationLabel}>Parade</Text>
                  <Text style={styles.mitigationText}>
                    {threat.mitigation}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </PerfGlassCard>

      {/* Action plan */}
      {analysis.actionPlan.length > 0 && (
        <PerfGlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>Plan d'action</Text>
          <View style={styles.actionList}>
            {analysis.actionPlan.map((action, idx) => (
              <View key={idx} style={styles.actionRow}>
                <View style={styles.actionCheck}>
                  <Text style={styles.actionCheckText}>{idx + 1}</Text>
                </View>
                <Text style={styles.actionText}>{action}</Text>
              </View>
            ))}
          </View>
        </PerfGlassCard>
      )}

      {/* Footer */}
      <PerfGlassCard style={styles.section}>
        <Text style={styles.footerText}>
          {analysis.summary}
        </Text>
        <Text style={styles.footerMuted}>
          Cette analyse est indicative et basée sur des probabilités
          historiques. Elle ne constitue pas un conseil en investissement.
        </Text>
      </PerfGlassCard>
    </View>
  );
}

// ─── Styles ───

const styles = StyleSheet.create({
  container: { gap: 12 },
  section: { marginBottom: 0 },
  sectionTitle: {
    color: PF.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: PF.accent,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  subtitleMuted: {
    color: PF.textMuted,
    fontSize: 12,
    marginBottom: 16,
  },
  emptyText: {
    color: PF.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },

  // Survival
  survivalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  survivalCenter: {
    alignItems: 'flex-start',
  },
  survivalNumber: {
    fontSize: 36,
    fontWeight: '900',
    lineHeight: 40,
  },
  survivalLabel: {
    color: PF.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  riskBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Threats
  threatList: {
    gap: 14,
    marginTop: 8,
  },
  threatCard: {
    borderWidth: 1,
    borderColor: PF.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  threatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  impactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  impactBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  threatTitle: {
    color: PF.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  threatProb: {
    fontSize: 14,
    fontWeight: '800',
  },
  threatDesc: {
    color: PF.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 8,
  },
  triggerLabel: {
    color: PF.textMuted,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  triggerText: {
    color: PF.textMuted,
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 10,
  },
  mitigationCard: {
    borderWidth: 1,
    borderColor: PF.gold + '40',
    borderRadius: 8,
    padding: 10,
    backgroundColor: PF.gold + '08',
  },
  mitigationLabel: {
    color: PF.gold,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  mitigationText: {
    color: PF.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },

  // Action plan
  actionList: {
    gap: 10,
    marginTop: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  actionCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: PF.green + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  actionCheckText: {
    color: PF.green,
    fontSize: 11,
    fontWeight: '800',
  },
  actionText: {
    color: PF.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },

  // Footer
  footerText: {
    color: PF.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 8,
  },
  footerMuted: {
    color: PF.textMuted,
    fontSize: 10,
    lineHeight: 14,
    fontStyle: 'italic',
  },
});
