import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ProgressRing } from './ProgressRing';
import { PerfGlassCard, PF } from './shared';
import { formatCurrency, formatPercent } from '@/services/format-helpers';

interface SectionFProps {
  pob: number;
  inflationAdjusted: number;
  eprN1: number;
  eprN2: number;
  eprN3: number;
  epargneN1: number;
  epargneN2: number;
  epargneN3: number;
  discretionnaireN1: number;
  discretionnaireN2: number;
  discretionnaireN3: number;
  monthlyTargetN1: number;
  monthlyTargetN2: number;
  monthlyTargetN3: number;
}

export function SectionF_SavingsPlan(props: SectionFProps) {
  const { t } = useTranslation('performance');
  const pobColor = props.pob >= 70 ? PF.green : props.pob >= 40 ? PF.orange : PF.red;

  const rows = [
    { label: t('drivingDashboard.year', { n: 1 }), epr: props.eprN1, epargne: props.epargneN1, discr: props.discretionnaireN1, monthly: props.monthlyTargetN1 },
    { label: t('drivingDashboard.year', { n: 2 }), epr: props.eprN2, epargne: props.epargneN2, discr: props.discretionnaireN2, monthly: props.monthlyTargetN2 },
    { label: t('drivingDashboard.year', { n: 3 }), epr: props.eprN3, epargne: props.epargneN3, discr: props.discretionnaireN3, monthly: props.monthlyTargetN3 },
  ];

  return (
    <View style={styles.container}>
      {/* POB Ring */}
      <View style={styles.pobRow}>
        <ProgressRing progress={props.pob} size={100} strokeWidth={10} color={pobColor}>
          <View style={{ alignItems: 'center' }}>
            <Text style={[styles.pobValue, { color: pobColor }]}>{formatPercent(props.pob, 0)}</Text>
            <Text style={styles.pobLabel}>{t('savingsPlan.success')}</Text>
          </View>
        </ProgressRing>
        <View style={styles.pobInfo}>
          <Text style={styles.infoLabel}>{t('savingsPlan.cashbackProbability')}</Text>
          <Text style={styles.infoHint}>
            {props.pob >= 70 ? t('savingsPlan.onTrack') : props.pob >= 40 ? t('savingsPlan.canImprove') : t('savingsPlan.actFast')}
          </Text>
          <View style={{ marginTop: 8 }}>
            <Text style={styles.infoLabel}>{t('savingsPlan.inflationImpact')}</Text>
            <Text style={[styles.infoValue, { color: PF.cyan }]}>{formatCurrency(props.inflationAdjusted)}</Text>
          </View>
        </View>
      </View>

      {/* PEP Table */}
      <PerfGlassCard>
        {/* Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 0.8 }]}></Text>
          <Text style={styles.th}>{t('savingsPlan.cashback')}</Text>
          <Text style={styles.th}>{t('savingsPlan.boostSavings')}</Text>
          <Text style={styles.th}>{t('savingsPlan.boostPleasures')}</Text>
          <Text style={styles.th}>{t('savingsPlan.monthly')}</Text>
        </View>
        {/* Rows */}
        {rows.map((row) => (
          <View key={row.label} style={styles.tableRow}>
            <Text style={[styles.td, styles.tdLabel, { flex: 0.8 }]}>{row.label}</Text>
            <Text style={styles.td}>{formatCurrency(row.epr)}</Text>
            <Text style={styles.td}>{formatCurrency(row.epargne)}</Text>
            <Text style={styles.td}>{formatCurrency(row.discr)}</Text>
            <Text style={[styles.td, { color: PF.accent }]}>{formatCurrency(row.monthly)}</Text>
          </View>
        ))}
      </PerfGlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  pobRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  pobValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  pobLabel: {
    color: PF.textMuted,
    fontSize: 10,
  },
  pobInfo: {
    flex: 1,
    gap: 4,
  },
  infoLabel: {
    color: PF.textMuted,
    fontSize: 11,
  },
  infoHint: {
    color: PF.textSecondary,
    fontSize: 13,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: PF.border,
    paddingBottom: 8,
    marginBottom: 4,
  },
  th: {
    flex: 1,
    color: PF.textMuted,
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: PF.border,
  },
  td: {
    flex: 1,
    color: PF.textSecondary,
    fontSize: 11,
    textAlign: 'center',
  },
  tdLabel: {
    color: PF.textPrimary,
    fontWeight: '600',
    textAlign: 'left',
  },
});
