import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { OB, FadeInView, OBGlassCard, neonGlow } from '../shared';

function AnimatedBar({ pct, color, isActive, delay }: { pct: number; color: string; isActive: boolean; delay: number }) {
  const width = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (isActive) {
      width.setValue(0);
      Animated.timing(width, { toValue: pct, duration: 1000, delay, useNativeDriver: false }).start();
    } else {
      width.setValue(0);
    }
  }, [isActive]);

  const widthInterp = width.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.barTrack}>
      <Animated.View style={[styles.barFill, { width: widthInterp }]}>
        <LinearGradient colors={[OB.blue, color]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
      </Animated.View>
    </View>
  );
}

export default function Slide5Calendar({ isActive }: { isActive: boolean }) {
  const { t } = useTranslation('onboarding');

  const years = [
    { label: t('slide5.year1'), pct: 30, amount: '432 000 F', color: OB.blueLight, delay: 300 },
    { label: t('slide5.year2'), pct: 60, amount: '864 000 F', color: OB.accent, delay: 500 },
    { label: t('slide5.year3'), pct: 100, amount: '1 440 000 F', color: OB.gold, delay: 700 },
  ];

  return (
    <LinearGradient colors={[OB.darkBg, '#12131A']} style={styles.container}>
      {isActive && (
        <>
          {/* Pactole Card */}
          <FadeInView active={isActive} delay={100}>
          <OBGlassCard style={styles.card}>
            <Text style={styles.cardTitle}>{t('slide5.cardTitle')}</Text>

            {years.map((y, i) => (
              <FadeInView key={y.label} active={isActive} delay={200 + i * 100} duration={400} from="left" style={styles.yearRow}>
                <View style={styles.yearHeader}>
                  <View style={styles.yearLabelRow}>
                    <Text style={styles.yearLabel}>{y.label}</Text>
                    <View style={[styles.pctBadge, { backgroundColor: y.color + '20' }]}>
                      <Text style={[styles.pctText, { color: y.color }]}>{y.pct}%</Text>
                    </View>
                  </View>
                  <Text style={[styles.yearAmount, { color: y.color, ...neonGlow(y.color) }]}>{y.amount}</Text>
                </View>
                <AnimatedBar pct={y.pct} color={y.color} isActive={isActive} delay={y.delay} />
              </FadeInView>
            ))}

            {/* Treasure reveal */}
            <FadeInView active={isActive} delay={900} duration={400} from="top" style={styles.treasureBox}>
              <Text style={styles.treasureIcon}>{'\u{1F4B0}'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.treasureTitle}>{t('slide5.treasureTitle')}</Text>
                <Text style={styles.treasureSub}>{t('slide5.treasureSub')}</Text>
              </View>
            </FadeInView>
          </OBGlassCard>
          </FadeInView>

          {/* Text */}
          <FadeInView active={isActive} delay={400}>
            <Text style={[styles.tagline, neonGlow(OB.accent)]}>{t('slide5.tagline')}</Text>
          </FadeInView>
          <FadeInView active={isActive} delay={500}>
            <Text style={styles.heading}>
              {t('slide5.heading')}
            </Text>
          </FadeInView>
          <FadeInView active={isActive} delay={600}>
            <Text style={styles.body}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>{t('slide5.bodyBold')}</Text>{t('slide5.bodyEnd')}
            </Text>
          </FadeInView>
        </>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingBottom: 120, paddingTop: 60 },
  card: { width: '100%', maxWidth: 300, borderRadius: 16, padding: 16, marginBottom: 28 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: OB.textPrimary, textAlign: 'center', marginBottom: 14 },
  yearRow: { marginBottom: 14 },
  yearHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  yearLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  yearLabel: { fontSize: 14, fontWeight: '700', color: OB.textPrimary },
  pctBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  pctText: { fontSize: 11, fontWeight: '800' },
  yearAmount: { fontSize: 15, fontWeight: '800' },
  barTrack: { height: 10, borderRadius: 5, backgroundColor: 'rgba(51,65,85,0.4)', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 5, overflow: 'hidden' },
  treasureBox: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4, padding: 12, borderRadius: 12, backgroundColor: 'rgba(255,215,0,0.08)', borderWidth: 1, borderColor: 'rgba(255,215,0,0.25)' },
  treasureIcon: { fontSize: 20 },
  treasureTitle: { fontSize: 12, fontWeight: '700', color: OB.gold, ...neonGlow(OB.gold) },
  treasureSub: { fontSize: 11, color: OB.textSecondary, marginTop: 2 },
  tagline: { fontSize: 13, fontWeight: '700', color: OB.blue, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10, textAlign: 'center' },
  heading: { fontSize: 26, fontWeight: '800', color: OB.textPrimary, textAlign: 'center', lineHeight: 34, marginBottom: 12 },
  body: { fontSize: 15, color: OB.textSecondary, textAlign: 'center', lineHeight: 22, maxWidth: 300 },
});
