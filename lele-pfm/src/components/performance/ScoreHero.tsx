import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ProgressRing } from './ProgressRing';
import { PF } from './shared';
import { formatGrade } from '@/services/format-helpers';

interface ScoreHeroProps {
  score: number; // 0-100
  grade: string;
  compact?: boolean;
}

export function ScoreHero({ score, grade, compact = false }: ScoreHeroProps) {
  const { t } = useTranslation('performance');
  const gradeInfo = formatGrade(grade);
  const ringSize = compact ? 90 : 160;
  const ringStroke = compact ? 8 : 12;

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <ProgressRing
        progress={score}
        size={ringSize}
        strokeWidth={ringStroke}
        color={gradeInfo.color}
      >
        <View style={styles.center}>
          <Text style={[styles.score, compact && styles.scoreCompact, { color: gradeInfo.color }]}>
            {score}
          </Text>
          <Text style={[styles.scoreMax, compact && styles.scoreMaxCompact]}>/100</Text>
        </View>
      </ProgressRing>

      <View style={[styles.info, compact && styles.infoCompact]}>
        <View style={[styles.gradeBadge, { backgroundColor: gradeInfo.bg }]}>
          <Text style={[styles.gradeText, { color: gradeInfo.color }]}>{grade}</Text>
        </View>
        <Text style={styles.gradeLabel}>{gradeInfo.label}</Text>
        {!compact && (
          <Text style={styles.subtitle}>{t('scoreHero.yourFinancialScore')}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 16,
  },
  containerCompact: {
    flexDirection: 'row',
    paddingVertical: 12,
    gap: 20,
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  score: {
    fontSize: 36,
    fontWeight: '800',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  scoreCompact: {
    fontSize: 24,
  },
  scoreMax: {
    fontSize: 16,
    color: PF.textMuted,
    marginTop: 8,
  },
  scoreMaxCompact: {
    fontSize: 12,
    marginTop: 4,
  },
  info: {
    alignItems: 'center',
    gap: 6,
  },
  infoCompact: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  gradeBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  gradeText: {
    fontSize: 20,
    fontWeight: '800',
  },
  gradeLabel: {
    color: PF.textSecondary,
    fontSize: 13,
  },
  subtitle: {
    color: PF.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
});
