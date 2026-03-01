import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PF } from '@/components/performance/shared';
import { JourneyPhase } from '@/types/investor-journey';

const PHASES: { key: JourneyPhase; label: string }[] = [
  { key: 'recommendation', label: 'Recommandation' },
  { key: 'selection', label: 'Selection' },
  { key: 'scenarios', label: 'Strategies' },
  { key: 'duration', label: 'Duree' },
  { key: 'accompaniment', label: 'Suivi' },
];

const PHASE_ORDER: Record<JourneyPhase, number> = {
  recommendation: 0,
  selection: 1,
  scenarios: 2,
  duration: 3,
  accompaniment: 4,
};

interface JourneyProgressBarProps {
  currentPhase: JourneyPhase;
}

export function JourneyProgressBar({ currentPhase }: JourneyProgressBarProps) {
  const currentIndex = PHASE_ORDER[currentPhase];

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {PHASES.map((phase, idx) => {
          const isCompleted = idx < currentIndex;
          const isActive = idx === currentIndex;
          const isFuture = idx > currentIndex;

          const circleColor = isCompleted
            ? PF.green
            : isActive
              ? PF.accent
              : PF.textMuted;

          const lineColor =
            idx < PHASES.length - 1
              ? idx < currentIndex
                ? PF.green
                : 'rgba(255,255,255,0.08)'
              : 'transparent';

          return (
            <View key={phase.key} style={styles.stepWrapper}>
              <View style={styles.stepRow}>
                <View
                  style={[
                    styles.circle,
                    {
                      backgroundColor: isActive ? circleColor + '30' : 'transparent',
                      borderColor: circleColor,
                    },
                  ]}
                >
                  {isCompleted ? (
                    <Text style={[styles.checkmark, { color: PF.green }]}>✓</Text>
                  ) : (
                    <View
                      style={[
                        styles.dot,
                        { backgroundColor: isActive ? circleColor : isFuture ? PF.textMuted : circleColor },
                      ]}
                    />
                  )}
                </View>
                {idx < PHASES.length - 1 && (
                  <View style={[styles.line, { backgroundColor: lineColor }]} />
                )}
              </View>
              <Text
                style={[
                  styles.label,
                  {
                    color: isActive
                      ? PF.accent
                      : isCompleted
                        ? PF.green
                        : PF.textMuted,
                    fontWeight: isActive ? '700' : '500',
                  },
                ]}
                numberOfLines={1}
              >
                {phase.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  checkmark: {
    fontSize: 14,
    fontWeight: '700',
  },
  line: {
    flex: 1,
    height: 2,
    borderRadius: 1,
  },
  label: {
    fontSize: 9,
    marginTop: 6,
    textAlign: 'center',
  },
});
