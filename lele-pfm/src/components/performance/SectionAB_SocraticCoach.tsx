import React, { useMemo, useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PF, PerfGlassCard } from './shared';
import { useInvestmentStore } from '@/stores/investment-store';
import {
  generateSocraticSession,
  type SocraticQuestion,
  type QuestionPriority,
  type QuestionCategory,
  type SocraticSession,
} from '@/domain/calculators/socratic-coach-engine';

type TFunction = (key: string, options?: Record<string, unknown>) => string;

// ─── Color / Label Helpers ───

function priorityColor(p: QuestionPriority): string {
  switch (p) {
    case 'critical':
      return PF.red;
    case 'important':
      return PF.orange;
    case 'educational':
      return PF.blue;
  }
}

function priorityLabel(p: QuestionPriority, t: TFunction): string {
  return t(`coach.priority.${p}`);
}

function categoryLabel(c: QuestionCategory, t: TFunction): string {
  return t(`coach.category.${c}`);
}

function levelLabel(level: SocraticSession['coachingLevel'], t: TFunction): string {
  return t(`coach.level.${level}`);
}

function levelColor(level: SocraticSession['coachingLevel']): string {
  switch (level) {
    case 'debutant':
      return PF.red;
    case 'intermediaire':
      return PF.orange;
    case 'avance':
      return PF.green;
  }
}

// ─── Question Card ───

function QuestionCard({ question, t }: { question: SocraticQuestion; t: TFunction }) {
  const [expanded, setExpanded] = useState(false);
  const animOpacity = useRef(new Animated.Value(0)).current;
  const animHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animOpacity, {
        toValue: expanded ? 1 : 0,
        duration: 250,
        useNativeDriver: false,
      }),
      Animated.timing(animHeight, {
        toValue: expanded ? 1 : 0,
        duration: 250,
        useNativeDriver: false,
      }),
    ]).start();
  }, [expanded]);

  const pColor = priorityColor(question.priority);

  return (
    <View style={styles.questionCard}>
      {/* Priority + Category badges */}
      <View style={styles.badgeRow}>
        <View style={[styles.priorityBadge, { backgroundColor: pColor + '20' }]}>
          <Text style={[styles.priorityBadgeText, { color: pColor }]}>
            {priorityLabel(question.priority, t)}
          </Text>
        </View>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>
            {categoryLabel(question.category, t)}
          </Text>
        </View>
      </View>

      {/* Question text */}
      <Text style={styles.questionText}>{question.question}</Text>

      {/* Toggle button */}
      <Pressable
        onPress={() => setExpanded(!expanded)}
        style={styles.toggleButton}
      >
        <Text style={styles.toggleText}>
          {expanded ? t('coach.hideAnswer') : t('coach.showAnswer')}
        </Text>
      </Pressable>

      {/* Expandable answer section */}
      {expanded && (
        <Animated.View style={{ opacity: animOpacity }}>
          {/* Insight */}
          <Text style={styles.insightText}>{question.insight}</Text>

          {/* Recommendation card (gold-bordered like PreMortem mitigation) */}
          <View style={styles.recommendationCard}>
            <Text style={styles.recommendationLabel}>{t('coach.recommendationLabel')}</Text>
            <Text style={styles.recommendationText}>
              {question.recommendation}
            </Text>
          </View>

          {/* Trigger reason */}
          <Text style={styles.triggerText}>{question.triggerReason}</Text>
        </Animated.View>
      )}
    </View>
  );
}

// ─── Main Component ───

export function SectionAB_SocraticCoach() {
  const { t } = useTranslation('performance');
  const allocations = useInvestmentStore((s) => s.allocations);
  const investorProfile = useInvestmentStore((s) => s.investorProfile);

  const session = useMemo(() => {
    if (!investorProfile || allocations.length === 0) return null;
    return generateSocraticSession(allocations);
  }, [allocations, investorProfile]);

  // Empty state
  if (!investorProfile) {
    return (
      <PerfGlassCard>
        <Text style={styles.emptyText}>
          {t('coach.configureProfile')}
        </Text>
      </PerfGlassCard>
    );
  }

  if (!session || session.questions.length === 0) {
    return (
      <PerfGlassCard>
        <Text style={styles.emptyText}>
          {t('coach.noQuestions')}
        </Text>
      </PerfGlassCard>
    );
  }

  const lvlColor = levelColor(session.coachingLevel);

  return (
    <View style={styles.container}>
      {/* Header card */}
      <PerfGlassCard style={styles.section}>
        <Text style={styles.sectionTitle}>{t('coach.title')}</Text>
        <Text style={styles.subtitle}>
          {t('coach.subtitle')}
        </Text>
        <Text style={styles.subtitleMuted}>
          {t('coach.subtitleHint')}
        </Text>

        {/* Level + Focus area row */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View
              style={[styles.levelBadge, { backgroundColor: lvlColor + '20' }]}
            >
              <Text style={[styles.levelBadgeText, { color: lvlColor }]}>
                {t('coach.levelPrefix')} {levelLabel(session.coachingLevel, t)}
              </Text>
            </View>
            <Text style={styles.focusText}>{session.focusArea}</Text>
          </View>
          <View style={styles.issueCountBox}>
            <Text style={styles.issueCountNumber}>
              {session.totalIssuesDetected}
            </Text>
            <Text style={styles.issueCountLabel}>
              {session.totalIssuesDetected !== 1 ? t('coach.pointsPlural') : t('coach.points')}
            </Text>
          </View>
        </View>

        {/* Session summary */}
        <Text style={styles.summaryText}>{session.sessionSummary}</Text>
      </PerfGlassCard>

      {/* Questions list */}
      <PerfGlassCard style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t('coach.questions', { count: session.questions.length })}
        </Text>
        <View style={styles.questionList}>
          {session.questions.map((q) => (
            <QuestionCard key={q.id} question={q} t={t} />
          ))}
        </View>
      </PerfGlassCard>

      {/* Footer */}
      <PerfGlassCard style={styles.section}>
        <Text style={styles.footerText}>
          {t('coach.footerText')}
        </Text>
        <Text style={styles.footerMuted}>
          {t('coach.footerDisclaimer')}
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

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  levelBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  focusText: {
    color: PF.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  issueCountBox: {
    alignItems: 'center',
  },
  issueCountNumber: {
    color: PF.accent,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 28,
  },
  issueCountLabel: {
    color: PF.textMuted,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  summaryText: {
    color: PF.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },

  // Questions
  questionList: {
    gap: 14,
    marginTop: 8,
  },
  questionCard: {
    borderWidth: 1,
    borderColor: PF.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  categoryBadgeText: {
    color: PF.textMuted,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  questionText: {
    color: PF.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 10,
  },
  toggleButton: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: PF.accent + '15',
    marginBottom: 4,
  },
  toggleText: {
    color: PF.accent,
    fontSize: 11,
    fontWeight: '700',
  },

  // Expanded answer
  insightText: {
    color: PF.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 10,
    marginBottom: 10,
  },
  recommendationCard: {
    borderWidth: 1,
    borderColor: PF.gold + '40',
    borderRadius: 8,
    padding: 10,
    backgroundColor: PF.gold + '08',
    marginBottom: 10,
  },
  recommendationLabel: {
    color: PF.gold,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  recommendationText: {
    color: PF.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  triggerText: {
    color: PF.textMuted,
    fontSize: 11,
    lineHeight: 15,
    fontStyle: 'italic',
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
