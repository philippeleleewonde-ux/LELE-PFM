import React, { useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { WZ, GlassCard, FadeInView, neonGlow } from '../shared';
import { useWizardStore } from '@/stores/wizard-store';

interface Props {
  isActive: boolean;
}

const QUESTIONS = [
  'Je contrôle bien mes dépenses au quotidien',
  "J'arrive à épargner régulièrement",
  'Je me sens serein(e) face à un imprévu financier',
  'Je sais exactement où va mon argent chaque mois',
  "J'ai une vision claire de mes objectifs financiers",
];

export default function Step5SelfEval({ isActive }: Props) {
  const { formData, updateFormData } = useWizardStore();
  const ratings = formData.ratings;

  const handleRate = useCallback((questionIndex: number, starValue: number) => {
    const newRatings = [...ratings];
    newRatings[questionIndex] = starValue;
    updateFormData({ ratings: newRatings });
  }, [ratings, updateFormData]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <FadeInView active={isActive} delay={0}>
        <Text style={styles.title}>Auto-évaluation</Text>
        <Text style={styles.subtitle}>
          Comment évaluez-vous vos habitudes financières ?
        </Text>
      </FadeInView>

      {QUESTIONS.map((question, qIndex) => {
        const currentRating = ratings[qIndex] ?? 0;

        return (
          <FadeInView key={qIndex} active={isActive} delay={100 + qIndex * 80}>
            <GlassCard style={styles.card}>
              <Text style={styles.questionNumber}>
                {qIndex + 1}/{QUESTIONS.length}
              </Text>
              <Text style={styles.questionText}>{question}</Text>

              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => {
                  const isSelected = star <= currentRating;
                  return (
                    <Pressable
                      key={star}
                      onPress={() => handleRate(qIndex, star)}
                      hitSlop={6}
                      style={({ pressed }) => [
                        styles.starButton,
                        pressed && styles.starPressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.starIcon,
                          { color: isSelected ? WZ.accent : WZ.textMuted },
                          isSelected && neonGlow(WZ.accent),
                        ]}
                      >
                        ★
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {currentRating > 0 && (
                <Text style={styles.ratingLabel}>
                  {currentRating === 1 && 'Pas du tout'}
                  {currentRating === 2 && 'Un peu'}
                  {currentRating === 3 && 'Moyennement'}
                  {currentRating === 4 && 'Plutôt oui'}
                  {currentRating === 5 && 'Tout à fait'}
                </Text>
              )}
            </GlassCard>
          </FadeInView>
        );
      })}

      {/* Summary */}
      <FadeInView active={isActive} delay={600}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Votre score</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryScore}>
              {ratings.reduce((a, b) => a + b, 0)}
            </Text>
            <Text style={styles.summaryMax}>/25</Text>
          </View>
          <View style={styles.summaryBar}>
            <View
              style={[
                styles.summaryFill,
                {
                  width: `${(ratings.reduce((a, b) => a + b, 0) / 25) * 100}%`,
                },
              ]}
            />
          </View>
        </View>
      </FadeInView>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WZ.darkBg,
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: WZ.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: WZ.textSecondary,
    marginBottom: 24,
    lineHeight: 22,
  },
  card: {
    marginBottom: 16,
  },
  questionNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: WZ.textMuted,
    marginBottom: 6,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: WZ.textPrimary,
    lineHeight: 24,
    marginBottom: 16,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  starButton: {
    padding: 6,
  },
  starPressed: {
    opacity: 0.7,
    transform: [{ scale: 1.15 }],
  },
  starIcon: {
    fontSize: 32,
  },
  ratingLabel: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: WZ.accent,
    marginTop: 10,
  },
  summaryCard: {
    backgroundColor: WZ.cardBg,
    borderWidth: 1,
    borderColor: WZ.accent + '33',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    marginTop: 8,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: WZ.textSecondary,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  summaryScore: {
    fontSize: 40,
    fontWeight: '900',
    color: WZ.accent,
    ...neonGlow(WZ.accent),
  },
  summaryMax: {
    fontSize: 18,
    fontWeight: '600',
    color: WZ.textMuted,
    marginLeft: 4,
  },
  summaryBar: {
    width: '100%',
    height: 6,
    backgroundColor: WZ.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 12,
  },
  summaryFill: {
    height: '100%',
    backgroundColor: WZ.accent,
    borderRadius: 3,
  },
  bottomSpacer: {
    height: 40,
  },
});
