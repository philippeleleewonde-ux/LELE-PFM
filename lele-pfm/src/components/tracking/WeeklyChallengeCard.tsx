import React from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BookOpen, Zap, CheckCircle, ChevronRight, Trophy } from 'lucide-react-native';
import { GlassCard } from '@/components/ui/GlassCard';
import { useWeeklyChallenge } from '@/hooks/useWeeklyChallenge';
import { DIFFICULTY_COLORS, DIFFICULTY_LABELS } from '@/constants/financial-challenges';

interface WeeklyChallengeCardProps {
  week?: number;
  year?: number;
}

export function WeeklyChallengeCard({ week, year }: WeeklyChallengeCardProps = {}) {
  const {
    challenge,
    planWeek,
    savoirRead,
    conditionMet,
    isFullyComplete,
    score,
    maxScore,
    completedCount,
    onReadSavoir,
    onManualFaire,
  } = useWeeklyChallenge(week, year);
  const { t } = useTranslation(['tracking', 'challenges']);
  const { width } = useWindowDimensions();
  const isSmall = width < 360;

  if (!challenge) return null;

  const diffColor = DIFFICULTY_COLORS[challenge.difficulty] ?? '#A1A1AA';
  const isManual = challenge.conditionKey === 'manual';

  return (
    <GlassCard variant="dark" style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Trophy size={16} color="#22D3EE" />
          <Text style={styles.headerTitle}>{t('challenge.title')}</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.weekBadge, { backgroundColor: `${diffColor}20`, borderColor: `${diffColor}40` }]}>
            <Text style={[styles.weekBadgeText, { color: diffColor }]}>
              S{planWeek}
            </Text>
          </View>
        </View>
      </View>

      {/* Module info */}
      <View style={styles.moduleRow}>
        <Text style={styles.moduleTitle}>{t(`challenges:${challenge.moduleTitle}`)}</Text>
        <Text style={[styles.diffBadge, { color: diffColor }]}>
          {t(`challenges:${DIFFICULTY_LABELS[challenge.difficulty]}`)}
        </Text>
      </View>

      {/* Progress steps */}
      <View style={styles.stepsRow}>
        <StepDot label={t('challenge.knowledge')} done={savoirRead} active={!savoirRead} color="#22D3EE" />
        <View style={[styles.stepLine, (savoirRead) && styles.stepLineDone]} />
        <StepDot label={t('challenge.action')} done={conditionMet} active={savoirRead && !conditionMet} color="#FBBF24" />
        <View style={[styles.stepLine, (conditionMet) && styles.stepLineDone]} />
        <StepDot label={t('challenge.validated')} done={isFullyComplete} active={conditionMet && !isFullyComplete} color="#4ADE80" />
      </View>

      {/* Savoir section */}
      {!savoirRead ? (
        <View style={styles.savoirBox}>
          <BookOpen size={16} color="#22D3EE" />
          <Text style={[styles.savoirText, isSmall && { fontSize: 13 }]}>
            {t(`challenges:${challenge.savoir}`)}
          </Text>
          <Pressable onPress={onReadSavoir} style={styles.savoirBtn}>
            <Text style={styles.savoirBtnText}>{t('challenge.understood')}</Text>
            <ChevronRight size={14} color="#0F1014" />
          </Pressable>
        </View>
      ) : (
        <View style={styles.savoirDone}>
          <CheckCircle size={14} color="#22D3EE" />
          <Text style={styles.savoirDoneText} numberOfLines={2}>
            {t(`challenges:${challenge.savoir}`).slice(0, 80)}...
          </Text>
        </View>
      )}

      {/* Faire section */}
      {savoirRead && (
        <View style={styles.faireBox}>
          <Zap size={16} color="#FBBF24" />
          <View style={styles.faireContent}>
            <Text style={styles.faireLabel}>{t('challenge.actionLabel')}</Text>
            <Text style={[styles.faireText, isSmall && { fontSize: 13 }]}>
              {t(`challenges:${challenge.faire}`)}
            </Text>
          </View>
          {conditionMet ? (
            <View style={styles.faireCheckBadge}>
              <CheckCircle size={16} color="#4ADE80" />
            </View>
          ) : isManual ? (
            <Pressable onPress={onManualFaire} style={styles.faireDoneBtn}>
              <Text style={styles.faireDoneBtnText}>{t('challenge.done')}</Text>
            </Pressable>
          ) : (
            <View style={styles.fairePending}>
              <Text style={styles.fairePendingText}>{t('challenge.inProgress')}</Text>
            </View>
          )}
        </View>
      )}

      {/* Maitriser status */}
      {savoirRead && (
        <View style={styles.maitriserRow}>
          <Text style={styles.maitriserLabel}>{t('challenge.verifying')}</Text>
          <Text style={[
            styles.maitriserStatus,
            { color: conditionMet ? '#4ADE80' : '#52525B' },
          ]}>
            {conditionMet ? t('tracking:challenge.validatedBang') : t(`challenges:${challenge.maitriserDesc}`)}
          </Text>
        </View>
      )}

      {/* Score bar */}
      <View style={styles.scoreRow}>
        <View style={styles.scoreBarBg}>
          <View style={[styles.scoreBarFill, { width: `${(score / maxScore) * 100}%` }]} />
        </View>
        <Text style={styles.scoreText}>{score}/{maxScore}</Text>
      </View>

      {/* Completed count */}
      {completedCount > 0 && (
        <Text style={styles.completedText}>
          {completedCount}/48 {t('challenge.challengesCompleted')}
        </Text>
      )}

      {/* Full completion celebration */}
      {isFullyComplete && (
        <View style={styles.celebrateBanner}>
          <Trophy size={14} color="#FBBF24" />
          <Text style={styles.celebrateText}>{t('challenge.challengeComplete')}</Text>
        </View>
      )}
    </GlassCard>
  );
}

// ─── Step Dot ───

function StepDot({ label, done, active, color }: {
  label: string; done: boolean; active: boolean; color: string;
}) {
  return (
    <View style={styles.stepDot}>
      <View style={[
        styles.stepCircle,
        done && { backgroundColor: color, borderColor: color },
        active && { borderColor: color },
      ]}>
        {done && <CheckCircle size={12} color="#0F1014" />}
      </View>
      <Text style={[
        styles.stepLabel,
        done && { color },
        active && { color: '#A1A1AA' },
      ]}>
        {label}
      </Text>
    </View>
  );
}

// ─── Styles ───

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    color: '#A1A1AA',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weekBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  weekBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  moduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  moduleTitle: {
    color: '#E4E4E7',
    fontSize: 15,
    fontWeight: '700',
  },
  diffBadge: {
    fontSize: 11,
    fontWeight: '700',
  },
  // Steps
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 0,
  },
  stepDot: {
    alignItems: 'center',
    gap: 4,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#52525B',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#52525B',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#52525B',
    marginHorizontal: 4,
    marginBottom: 16,
  },
  stepLineDone: {
    backgroundColor: '#22D3EE',
  },
  // Savoir
  savoirBox: {
    backgroundColor: 'rgba(34,211,238,0.06)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.15)',
    gap: 10,
    marginBottom: 12,
  },
  savoirText: {
    color: '#D4D4D8',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  savoirBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#22D3EE',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
  },
  savoirBtnText: {
    color: '#0F1014',
    fontSize: 13,
    fontWeight: '700',
  },
  savoirDone: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
    paddingVertical: 4,
  },
  savoirDoneText: {
    color: '#71717A',
    fontSize: 12,
    flex: 1,
    fontStyle: 'italic',
  },
  // Faire
  faireBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(251,189,35,0.06)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(251,189,35,0.12)',
    marginBottom: 10,
  },
  faireContent: {
    flex: 1,
    gap: 2,
  },
  faireLabel: {
    color: '#FBBF24',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  faireText: {
    color: '#D4D4D8',
    fontSize: 13,
    fontWeight: '500',
  },
  faireCheckBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(74,222,128,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  faireDoneBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FBBF24',
  },
  faireDoneBtnText: {
    color: '#0F1014',
    fontSize: 11,
    fontWeight: '700',
  },
  fairePending: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  fairePendingText: {
    color: '#52525B',
    fontSize: 10,
    fontWeight: '600',
  },
  // Maitriser
  maitriserRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  maitriserLabel: {
    color: '#52525B',
    fontSize: 11,
    fontWeight: '600',
  },
  maitriserStatus: {
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  // Score
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#22D3EE',
  },
  scoreText: {
    color: '#71717A',
    fontSize: 11,
    fontWeight: '700',
    minWidth: 40,
    textAlign: 'right',
  },
  completedText: {
    color: '#52525B',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 8,
  },
  celebrateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(251,189,35,0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(251,189,35,0.2)',
  },
  celebrateText: {
    color: '#FBBF24',
    fontSize: 13,
    fontWeight: '800',
  },
});
