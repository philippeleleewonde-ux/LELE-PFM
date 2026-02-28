import React, { memo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PF, PerfGlassCard } from '@/components/performance/shared';
import { ProgressRing } from '@/components/performance/ProgressRing';
import { useMonthlyMission } from '@/hooks/useMonthlyMission';
import { PILLAR_CONFIG } from '@/constants/pillar-mapping';
import { useInvestmentStore } from '@/stores/investment-store';
import { Check } from 'lucide-react-native';

function MaMissionInner() {
  const { t } = useTranslation('app');
  const {
    currentMission,
    missionStatus,
    completedCount,
    totalMissions,
    confirmMission,
    skipCurrentMission,
    history,
  } = useMonthlyMission();
  const strategyGeneratedAt = useInvestmentStore((s) => s.strategyGeneratedAt);
  const setStrategyGeneratedAt = useInvestmentStore((s) => s.setStrategyGeneratedAt);

  if (!currentMission) {
    // Auto-init strategy date if profile exists
    const profile = useInvestmentStore.getState().investorProfile;
    if (profile && !strategyGeneratedAt) {
      setStrategyGeneratedAt(new Date().toISOString());
    }

    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{t('gps.mission.noMission')}</Text>
      </View>
    );
  }

  const config = PILLAR_CONFIG[currentMission.pillar];
  const progress = totalMissions > 0 ? (completedCount / totalMissions) * 100 : 0;

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      {/* Progress ring */}
      <View style={styles.progressCenter}>
        <ProgressRing
          progress={progress}
          size={80}
          strokeWidth={6}
          color={PF.accent}
        />
        <Text style={styles.progressText}>
          {t('gps.mission.progress', { completed: completedCount, total: totalMissions })}
        </Text>
      </View>

      {/* Current mission card */}
      <PerfGlassCard style={styles.missionCard}>
        <View style={[styles.pillarBadge, { backgroundColor: config.color + '20', borderColor: config.color + '40' }]}>
          <Text style={[styles.pillarBadgeText, { color: config.color }]}>
            {t(config.labelKey)}
          </Text>
        </View>

        <Text style={styles.missionTitle}>{t(currentMission.titleKey)}</Text>
        <Text style={styles.missionDesc}>{t(currentMission.descKey)}</Text>

        {/* Difficulty dots */}
        <View style={styles.difficultyRow}>
          {[1, 2, 3].map((d) => (
            <View
              key={d}
              style={[
                styles.difficultyDot,
                d <= currentMission.difficulty
                  ? { backgroundColor: config.color }
                  : { backgroundColor: 'rgba(255,255,255,0.1)' },
              ]}
            />
          ))}
        </View>

        {missionStatus === 'pending' ? (
          <View style={styles.actionRow}>
            <Pressable onPress={confirmMission} style={[styles.confirmBtn, { backgroundColor: config.color }]}>
              <Check size={16} color="#0F1014" />
              <Text style={styles.confirmText}>{t('gps.mission.confirm')}</Text>
            </Pressable>
            <Pressable onPress={skipCurrentMission} style={styles.skipBtn}>
              <Text style={styles.skipText}>{t('gps.mission.skip')}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.doneBadge}>
            <Text style={styles.doneText}>
              {missionStatus === 'completed' ? t('gps.mission.done') : t('gps.mission.skipped')}
            </Text>
          </View>
        )}
      </PerfGlassCard>

      {/* History */}
      {history.length > 0 && (
        <PerfGlassCard style={styles.historyCard}>
          <Text style={styles.historyTitle}>{t('gps.mission.history')}</Text>
          {history.slice(-5).reverse().map((record, idx) => (
            <View key={idx} style={styles.historyRow}>
              <View style={[
                styles.historyDot,
                { backgroundColor: record.status === 'completed' ? PF.green : PF.textMuted },
              ]} />
              <Text style={styles.historyText}>
                {record.templateId} — {record.status === 'completed'
                  ? t('gps.mission.completed')
                  : t('gps.mission.skipped')}
              </Text>
            </View>
          ))}
        </PerfGlassCard>
      )}
    </ScrollView>
  );
}

export const MaMission = memo(MaMissionInner);

const styles = StyleSheet.create({
  content: { paddingBottom: 24, gap: 12 },
  empty: { padding: 24 },
  emptyText: { color: PF.textSecondary, fontSize: 14, textAlign: 'center' },
  progressCenter: { alignItems: 'center', gap: 8, paddingVertical: 8 },
  progressText: { color: PF.textSecondary, fontSize: 13, fontWeight: '600' },
  missionCard: { padding: 16, gap: 12 },
  pillarBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  pillarBadgeText: { fontSize: 11, fontWeight: '700' },
  missionTitle: { color: PF.textPrimary, fontSize: 17, fontWeight: '700' },
  missionDesc: { color: PF.textSecondary, fontSize: 13, lineHeight: 20 },
  difficultyRow: { flexDirection: 'row', gap: 4 },
  difficultyDot: { width: 8, height: 8, borderRadius: 4 },
  actionRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  confirmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  confirmText: { color: '#0F1014', fontSize: 14, fontWeight: '700' },
  skipBtn: { paddingVertical: 12, paddingHorizontal: 16 },
  skipText: { color: PF.textMuted, fontSize: 13, fontWeight: '600' },
  doneBadge: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#4ADE8020',
  },
  doneText: { color: PF.green, fontSize: 13, fontWeight: '600' },
  historyCard: { padding: 14 },
  historyTitle: { color: PF.textPrimary, fontSize: 13, fontWeight: '700', marginBottom: 8 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  historyDot: { width: 6, height: 6, borderRadius: 3 },
  historyText: { color: PF.textSecondary, fontSize: 12 },
});
