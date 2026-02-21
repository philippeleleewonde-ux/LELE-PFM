import React, { useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { GlassCard } from '@/components/ui/GlassCard';
import { formatCurrency } from '@/services/format-helpers';
import { getGradeColor } from '@/domain/calculators/weekly-savings-engine';
import { WeeklySavingsResult } from '@/domain/calculators/weekly-savings-engine';
import { Grade } from '@/types';
import { getWeekRangeLabel } from '@/utils/week-helpers';
import { Lightbulb } from 'lucide-react-native';
import { FinancialScoreRing } from '@/components/performance/FinancialScoreRing';
import { usePerformanceStore } from '@/stores/performance-store';

// ─── Financial Tips by Score Range ───

const TIPS: Record<string, string[]> = {
  critical: [
    "Priorite absolue : identifiez vos 3 plus grosses depenses et reduisez-les de 10%.",
    "Commencez petit : mettez de cote meme 500 FCFA par jour. La regularite est la cle.",
    "Chaque depense non essentielle est une opportunite d'epargne. Analysez vos achats.",
    "Creez un budget d'urgence : listez uniquement vos depenses vitales cette semaine.",
    "Notez chaque depense pendant 7 jours. La prise de conscience est le premier pas.",
  ],
  weak: [
    "Vous progressez ! Fixez-vous un objectif d'epargne hebdomadaire, meme modeste.",
    "Astuce : attendez 48h avant tout achat non essentiel. 70% seront evites.",
    "Identifiez vos abonnements inutiles. Chaque petit montant compte sur l'annee.",
    "Preparez vos repas : la restauration pese lourd sur le budget sans qu'on le remarque.",
    "Definissez un jour sans depense par semaine. Votre portefeuille vous remerciera.",
  ],
  average: [
    "Bon travail ! Pour passer au niveau superieur, augmentez votre epargne de 5% cette semaine.",
    "Vous etes sur la bonne voie. Essayez de ne pas toucher a vos economies pendant 1 mois.",
    "Conseil d'expert : automatisez votre epargne des la reception de vos revenus.",
    "Diversifiez vos efforts : reduisez 2 categories au lieu d'une seule pour plus d'impact.",
    "Comparez vos depenses ce mois-ci vs le mois dernier. Les tendances revelent des opportunites.",
  ],
  good: [
    "Excellent parcours ! Vous etes au-dessus de la moyenne. Visez les 80/100 ce mois-ci.",
    "Votre discipline paye. Pensez a investir votre surplus d'epargne pour le faire fructifier.",
    "Bravo ! Maintenez ce rythme et vous atteindrez votre objectif EPR en avance.",
    "A ce niveau, chaque point gagne demande plus d'effort. Concentrez-vous sur les details.",
    "Vous etes en bonne voie. Fixez-vous un objectif : terminer le mois sans depassement.",
  ],
  excellent: [
    "Chapeau ! Vous etes un modele de gestion financiere. Continuez sur cette lancee !",
    "Performance remarquable ! Pensez a des objectifs long terme : immobilier, placement.",
    "Vous maitrisez vos finances. C'est le moment d'optimiser : negociez vos contrats.",
    "Score exceptionnel ! Votre discipline financiere est votre plus grand atout.",
    "Vous faites partie des meilleurs gestionnaires. Inspirez votre entourage !",
  ],
};

function getScoreRange(score: number): string {
  if (score <= 20) return 'critical';
  if (score <= 40) return 'weak';
  if (score <= 60) return 'average';
  if (score <= 80) return 'good';
  return 'excellent';
}

function getDailyTip(score: number): string {
  const range = getScoreRange(score);
  const tips = TIPS[range];
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000,
  );
  return tips[dayOfYear % tips.length];
}

// ─── Component ───

interface Props {
  grade: Grade;
  score: number;
  weeklyBudget: number;
  weeklySpent: number;
  savings: WeeklySavingsResult;
  currentWeek: number;
  currentYear: number;
  planYear: 1 | 2 | 3;
  currentQuarter: 1 | 2 | 3 | 4;
}

export function SimpleDashboardHero({
  grade,
  score,
  weeklyBudget,
  weeklySpent,
  savings,
  currentWeek,
  currentYear,
  planYear,
  currentQuarter,
}: Props) {
  const { width } = useWindowDimensions();
  const isSmall = width < 360;
  const remaining = Math.max(0, weeklyBudget - weeklySpent);
  const gradeColor = getGradeColor(grade);
  const progressPercent =
    weeklyBudget > 0 ? Math.min((weeklySpent / weeklyBudget) * 100, 100) : 0;
  const weekRange = getWeekRangeLabel(currentWeek, currentYear);
  const tip = useMemo(() => getDailyTip(score), [score]);
  const hasWeeklyData = usePerformanceStore((s) => s.records.length > 0);

  return (
    <GlassCard
      variant="neon"
      style={[styles.card, { marginHorizontal: isSmall ? 10 : 16 }]}
    >
      {/* Top bar: date + grade */}
      <View style={styles.topBar}>
        <Text style={styles.dateRange}>Semaine {weekRange}</Text>
        <View
          style={[
            styles.gradeBadge,
            {
              backgroundColor: gradeColor + '20',
              borderColor: gradeColor + '40',
            },
          ]}
        >
          <Text style={[styles.gradeText, { color: gradeColor }]}>{grade}</Text>
        </View>
      </View>

      {/* Score Hero — Double ring (dynamic) or simple circle (static) */}
      <View style={styles.scoreSection}>
        {hasWeeklyData ? (
          <FinancialScoreRing />
        ) : (
          <>
            <View style={[styles.scoreCircle, { borderColor: gradeColor }]}>
              <Text
                style={[
                  styles.scoreNumber,
                  { color: gradeColor },
                  isSmall && { fontSize: 32 },
                ]}
              >
                {score}
              </Text>
              <Text style={styles.scoreMax}>/100</Text>
            </View>
            <Text style={styles.scoreLabel}>Score financier</Text>
          </>
        )}
        <Text style={styles.scoreSubtitle}>
          {savings.budgetRespecte
            ? 'Vous etes dans les clous !'
            : 'Attention au depassement'}
        </Text>
      </View>

      {/* Key numbers */}
      <View style={styles.numbersRow}>
        <View style={styles.numberBox}>
          <Text style={styles.numberLabel}>Reste a depenser</Text>
          <Text
            style={[
              styles.numberValue,
              { color: remaining > 0 ? '#4ADE80' : '#F87171' },
              isSmall && { fontSize: 15 },
            ]}
          >
            {formatCurrency(remaining)}
          </Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.numberBox}>
          <Text style={styles.numberLabel}>Economise</Text>
          <Text
            style={[
              styles.numberValue,
              { color: '#4ADE80' },
              isSmall && { fontSize: 15 },
            ]}
          >
            {formatCurrency(savings.economies)}
          </Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.numberBox}>
          <Text style={styles.numberLabel}>
            EPR An{planYear} T{currentQuarter}
          </Text>
          <Text
            style={[
              styles.numberValue,
              {
                color:
                  savings.eprProvision >= savings.weeklyTarget
                    ? '#4ADE80'
                    : '#60A5FA',
              },
              isSmall && { fontSize: 15 },
            ]}
          >
            {formatCurrency(savings.weeklyTarget)}
          </Text>
        </View>
      </View>

      {/* Simple progress bar */}
      <View style={styles.barBg}>
        <View
          style={[
            styles.barFill,
            {
              width: `${progressPercent}%`,
              backgroundColor:
                progressPercent > 100
                  ? '#F87171'
                  : progressPercent > 80
                    ? '#FBBF24'
                    : '#4ADE80',
            },
          ]}
        />
      </View>
      <Text style={styles.barLabel}>
        {formatCurrency(weeklySpent)} depense sur {formatCurrency(weeklyBudget)}
      </Text>

      {/* Gold Tip Section */}
      <View style={styles.tipSection}>
        <View style={styles.tipHeader}>
          <Lightbulb size={14} color="#FBBF24" />
          <Text style={styles.tipHeaderText}>Conseil du jour</Text>
        </View>
        <Text style={styles.tipText}>{tip}</Text>
      </View>
    </GlassCard>
  );
}

// ─── Styles ───

const styles = StyleSheet.create({
  card: { marginBottom: 16 },

  // Top bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateRange: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '600',
  },
  gradeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  gradeText: { fontSize: 16, fontWeight: '900' },

  // Score hero
  scoreSection: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 12,
  },
  scoreCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreNumber: {
    fontSize: 36,
    fontWeight: '900',
    lineHeight: 40,
  },
  scoreMax: {
    color: '#71717A',
    fontSize: 13,
    fontWeight: '700',
    marginTop: -2,
  },
  scoreLabel: {
    color: '#FBBF24',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  scoreSubtitle: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },

  // Numbers
  numbersRow: { flexDirection: 'row', marginBottom: 14 },
  numberBox: { flex: 1, alignItems: 'center' },
  numberLabel: {
    color: '#71717A',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  numberValue: { fontSize: 17, fontWeight: '800' },
  separator: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 8,
  },

  // Progress bar
  barBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  barFill: { height: '100%', borderRadius: 3 },
  barLabel: { color: '#52525B', fontSize: 11, textAlign: 'center' },

  // Tip section
  tipSection: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(251,191,36,0.15)',
    paddingTop: 12,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  tipHeaderText: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tipText: {
    color: '#FBBF24',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
    opacity: 0.9,
  },
});
