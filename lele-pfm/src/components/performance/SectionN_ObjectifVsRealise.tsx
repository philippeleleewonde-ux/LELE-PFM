import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useObjectifVsRealise, ObjectifVsRealise, IndicatorOvR } from '@/hooks/useObjectifVsRealise';
import { PerfGlassCard, PF, FadeInView } from './shared';
import { ProgressBar } from '@/components/charts/ProgressBar';
import { formatCurrency, formatPercent } from '@/services/format-helpers';

// ─── Status helpers ───

function statusIcon(status: 'ahead' | 'on_track' | 'behind'): string {
  switch (status) {
    case 'ahead':
      return '\u2713'; // checkmark
    case 'on_track':
      return '\u2248'; // approx equal
    case 'behind':
      return '!';
  }
}

function statusColor(status: 'ahead' | 'on_track' | 'behind'): string {
  switch (status) {
    case 'ahead':
      return PF.green;
    case 'on_track':
      return PF.cyan;
    case 'behind':
      return PF.red;
  }
}

function statusLabelKey(status: 'ahead' | 'on_track' | 'behind'): string {
  switch (status) {
    case 'ahead':
      return 'objectifVsRealise.statusAhead';
    case 'on_track':
      return 'objectifVsRealise.statusOnTrack';
    case 'behind':
      return 'objectifVsRealise.statusBehind';
  }
}

// ─── GlobalProgressCard ───

function GlobalProgressCard({ data }: { data: ObjectifVsRealise }) {
  const { t } = useTranslation('performance');
  const { annual, planYear, weeksElapsed, totalWeeksInYear } = data;
  const prorataPercent = ((weeksElapsed / totalWeeksInYear) * 100).toFixed(1);
  const color = statusColor(annual.status);

  return (
    <PerfGlassCard style={s.heroCard}>
      <View style={s.heroHeader}>
        <Text style={s.heroTitle}>{t('objectifVsRealise.globalProgress')}</Text>
        <View style={[s.yearBadge, { borderColor: PF.accent + '40' }]}>
          <Text style={s.yearBadgeText}>{t('drivingDashboard.year', { n: planYear })}</Text>
        </View>
      </View>

      <View style={s.heroRow}>
        <Text style={s.heroLabel}>{t('objectifVsRealise.annualObjective')}</Text>
        <Text style={s.heroValue}>{formatCurrency(annual.objectif)}</Text>
      </View>
      <View style={s.heroRow}>
        <Text style={s.heroLabel}>{t('objectifVsRealise.realized')}</Text>
        <Text style={[s.heroValue, { color }]}>{formatCurrency(annual.realise)}</Text>
      </View>

      <View style={s.barWrap}>
        <ProgressBar
          progress={Math.min(100, annual.progression)}
          color={color}
          height={10}
        />
      </View>

      <View style={s.heroRow}>
        <Text style={s.heroSub}>
          {formatPercent(annual.progression)} {t('objectifVsRealise.expectedSuffix', { prorataPercent })}
        </Text>
        <View style={[s.statusPill, { backgroundColor: color + '20' }]}>
          <Text style={[s.statusPillText, { color }]}>
            {statusIcon(annual.status)} {t(statusLabelKey(annual.status))}
          </Text>
        </View>
      </View>

      {annual.ecart !== 0 && (
        <Text style={[s.ecartText, { color: annual.ecart >= 0 ? PF.green : PF.red }]}>
          {annual.ecart >= 0 ? '+' : ''}{formatCurrency(annual.ecart)} {t('objectifVsRealise.vsProrata')}
        </Text>
      )}
    </PerfGlassCard>
  );
}

// ─── PeriodRows ───

interface PeriodRowProps {
  label: string;
  objectif: number;
  realise: number;
  progression: number;
  status: 'ahead' | 'on_track' | 'behind';
}

function PeriodRow({ label, objectif, realise, progression, status }: PeriodRowProps) {
  const color = statusColor(status);
  return (
    <View style={s.periodRow}>
      <Text style={s.periodLabel}>{label}</Text>
      <View style={s.periodRight}>
        <Text style={s.periodValues}>
          {formatCurrency(realise)} / {formatCurrency(objectif)}
        </Text>
        <Text style={[s.periodPct, { color }]}>{formatPercent(progression)}</Text>
        <Text style={[s.periodIcon, { color }]}>{statusIcon(status)}</Text>
      </View>
    </View>
  );
}

function PeriodRows({ data }: { data: ObjectifVsRealise }) {
  const { t } = useTranslation('performance');
  return (
    <PerfGlassCard style={s.sectionCard}>
      <Text style={s.sectionTitle}>{t('objectifVsRealise.byPeriod')}</Text>
      <PeriodRow
        label={t('objectifVsRealise.weekly')}
        objectif={data.weekly.objectif}
        realise={data.weekly.realise}
        progression={data.weekly.progression}
        status={data.weekly.status}
      />
      <PeriodRow
        label={t('objectifVsRealise.monthlyLabel')}
        objectif={data.monthly.objectif}
        realise={data.monthly.realise}
        progression={data.monthly.progression}
        status={data.monthly.status}
      />
      <PeriodRow
        label={t('objectifVsRealise.quarterLabel', { quarter: data.quarterly.quarter })}
        objectif={data.quarterly.objectif}
        realise={data.quarterly.realise}
        progression={data.quarterly.progression}
        status={data.quarterly.status}
      />
      <PeriodRow
        label={t('objectifVsRealise.annual')}
        objectif={data.annual.objectif}
        realise={data.annual.realise}
        progression={data.annual.progression}
        status={data.annual.status}
      />
    </PerfGlassCard>
  );
}

// ─── CategoryBreakdown ───

function CategoryRow({
  code,
  label,
  color,
  objectifProrata,
  realiseAnnuel,
  ecart,
  progression,
  status,
}: {
  code: string;
  label: string;
  color: string;
  objectifProrata: number;
  realiseAnnuel: number;
  ecart: number;
  progression: number;
  status: 'ahead' | 'on_track' | 'behind';
}) {
  const { t } = useTranslation('performance');
  const sColor = statusColor(status);
  return (
    <View style={s.catRow}>
      <View style={s.catHeader}>
        <View style={[s.catDot, { backgroundColor: color }]} />
        <Text style={s.catLabel}>{t(label)}</Text>
        <Text style={[s.catAmount, { color: sColor }]}>{formatCurrency(realiseAnnuel)}</Text>
      </View>
      <View style={s.catBarWrap}>
        <ProgressBar
          progress={Math.min(100, progression)}
          color={sColor}
          height={6}
        />
      </View>
      <View style={s.catFooter}>
        <Text style={s.catSub}>obj. {formatCurrency(objectifProrata)}</Text>
        <Text style={[s.catEcart, { color: ecart >= 0 ? PF.green : PF.red }]}>
          {ecart >= 0 ? '+' : ''}{formatCurrency(ecart)}
        </Text>
      </View>
    </View>
  );
}

function CategoryBreakdown({ data }: { data: ObjectifVsRealise }) {
  const { t } = useTranslation('performance');
  return (
    <PerfGlassCard style={s.sectionCard}>
      <Text style={s.sectionTitle}>{t('objectifVsRealise.byCategory')}</Text>
      {data.byCategory.map((cat, i) => (
        <CategoryRow key={cat.code} {...cat} />
      ))}
    </PerfGlassCard>
  );
}

// ─── IndicatorBreakdown ───

function IndicatorItem({ ind }: { ind: IndicatorOvR }) {
  const { t } = useTranslation('performance');
  const annualColor = statusColor(ind.annual.status);

  return (
    <PerfGlassCard style={s.indCard}>
      {/* Header */}
      <View style={s.indHeader}>
        <View style={[s.catDot, { backgroundColor: ind.color, width: 10, height: 10, borderRadius: 5 }]} />
        <Text style={s.indName}>{ind.name}</Text>
        <View style={[s.indRateBadge, { backgroundColor: ind.color + '20' }]}>
          <Text style={[s.indRateText, { color: ind.color }]}>{ind.rate.toFixed(1)}%</Text>
        </View>
      </View>

      {/* Annual progress bar */}
      <View style={s.barWrap}>
        <ProgressBar
          progress={Math.min(100, ind.annual.progression)}
          color={annualColor}
          height={6}
        />
      </View>

      {/* Period rows: Hebdo / Mensuel / Annuel */}
      <View style={s.indPeriodRow}>
        <Text style={s.indPeriodLabel}>{t('objectifVsRealise.weekly')}</Text>
        <Text style={s.indPeriodValues}>
          {formatCurrency(ind.weekly.realise)} / {formatCurrency(ind.weekly.objectif)}
        </Text>
        <Text style={[s.indPeriodPct, { color: statusColor(ind.weekly.status) }]}>
          {formatPercent(ind.weekly.progression)}
        </Text>
        <Text style={[s.indPeriodIcon, { color: statusColor(ind.weekly.status) }]}>
          {statusIcon(ind.weekly.status)}
        </Text>
      </View>

      <View style={s.indPeriodRow}>
        <Text style={s.indPeriodLabel}>{t('objectifVsRealise.monthlyLabel')}</Text>
        <Text style={s.indPeriodValues}>
          {formatCurrency(ind.monthly.realise)} / {formatCurrency(ind.monthly.objectif)}
        </Text>
        <Text style={[s.indPeriodPct, { color: statusColor(ind.monthly.status) }]}>
          {formatPercent(ind.monthly.progression)}
        </Text>
        <Text style={[s.indPeriodIcon, { color: statusColor(ind.monthly.status) }]}>
          {statusIcon(ind.monthly.status)}
        </Text>
      </View>

      <View style={s.indPeriodRow}>
        <Text style={s.indPeriodLabel}>{t('objectifVsRealise.annual')}</Text>
        <Text style={s.indPeriodValues}>
          {formatCurrency(ind.annual.realise)} / {formatCurrency(ind.annual.objectif)}
        </Text>
        <Text style={[s.indPeriodPct, { color: annualColor }]}>
          {formatPercent(ind.annual.progressionProrata)}
        </Text>
        <Text style={[s.indPeriodIcon, { color: annualColor }]}>
          {statusIcon(ind.annual.status)}
        </Text>
      </View>

      {/* Ecart vs prorata */}
      {ind.annual.ecart !== 0 && (
        <Text style={[s.indEcart, { color: ind.annual.ecart >= 0 ? PF.green : PF.red }]}>
          {ind.annual.ecart >= 0 ? '+' : ''}{formatCurrency(ind.annual.ecart)} {t('objectifVsRealise.vsProrata')}
        </Text>
      )}
    </PerfGlassCard>
  );
}

function IndicatorBreakdown({ data }: { data: ObjectifVsRealise }) {
  const { t } = useTranslation('performance');
  if (data.byIndicator.length === 0) return null;

  return (
    <View style={s.indSection}>
      <Text style={s.sectionTitle}>{t('objectifVsRealise.byIndicator')}</Text>
      {data.byIndicator.map((ind, i) => (
        <FadeInView key={ind.code} delay={i * 60}>
          <IndicatorItem ind={ind} />
        </FadeInView>
      ))}
    </View>
  );
}

// ─── Main Component ───

export function SectionN_ObjectifVsRealise() {
  const data = useObjectifVsRealise();

  if (!data) return null;

  return (
    <View style={s.container}>
      <FadeInView>
        <GlobalProgressCard data={data} />
      </FadeInView>
      <FadeInView delay={100}>
        <PeriodRows data={data} />
      </FadeInView>
      <FadeInView delay={200}>
        <IndicatorBreakdown data={data} />
      </FadeInView>
      <FadeInView delay={300}>
        <CategoryBreakdown data={data} />
      </FadeInView>
    </View>
  );
}

// ─── Styles ───

const s = StyleSheet.create({
  container: {
    gap: 12,
  },

  // Hero card
  heroCard: {
    gap: 8,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  heroTitle: {
    color: PF.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  yearBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  yearBadgeText: {
    color: PF.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLabel: {
    color: PF.textSecondary,
    fontSize: 13,
  },
  heroValue: {
    color: PF.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  barWrap: {
    marginVertical: 4,
  },
  heroSub: {
    color: PF.textMuted,
    fontSize: 12,
    flex: 1,
  },
  statusPill: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  ecartText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },

  // Section card
  sectionCard: {
    gap: 10,
  },
  sectionTitle: {
    color: PF.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },

  // Period rows
  periodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: PF.border,
  },
  periodLabel: {
    color: PF.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    minWidth: 65,
  },
  periodRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-end',
  },
  periodValues: {
    color: PF.textSecondary,
    fontSize: 11,
    flex: 1,
    textAlign: 'right',
  },
  periodPct: {
    fontSize: 12,
    fontWeight: '700',
    minWidth: 42,
    textAlign: 'right',
  },
  periodIcon: {
    fontSize: 14,
    fontWeight: '700',
    minWidth: 16,
    textAlign: 'center',
  },

  // Category rows
  catRow: {
    gap: 4,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: PF.border,
  },
  catHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  catLabel: {
    color: PF.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  catAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
  catBarWrap: {
    marginLeft: 16,
  },
  catFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginLeft: 16,
  },
  catSub: {
    color: PF.textMuted,
    fontSize: 11,
  },
  catEcart: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Indicator section
  indSection: {
    gap: 8,
  },
  indCard: {
    gap: 6,
    marginBottom: 4,
  },
  indHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  indName: {
    color: PF.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  indRateBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  indRateText: {
    fontSize: 11,
    fontWeight: '800',
  },
  indPeriodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: PF.border,
  },
  indPeriodLabel: {
    color: PF.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    width: 55,
  },
  indPeriodValues: {
    color: PF.textMuted,
    fontSize: 10,
    flex: 1,
    textAlign: 'right',
  },
  indPeriodPct: {
    fontSize: 11,
    fontWeight: '700',
    minWidth: 38,
    textAlign: 'right',
  },
  indPeriodIcon: {
    fontSize: 12,
    fontWeight: '700',
    minWidth: 14,
    textAlign: 'center',
    marginLeft: 4,
  },
  indEcart: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right',
    marginTop: 2,
  },
});
