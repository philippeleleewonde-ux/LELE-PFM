import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { OB, FadeInView, OBGlassCard, neonGlow } from '../shared';

function AnimatedBar({ potentiel, color, isActive, delay }: { potentiel: number; color: string; isActive: boolean; delay: number }) {
  const width = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (isActive) {
      width.setValue(0);
      Animated.timing(width, { toValue: potentiel, duration: 800, delay, useNativeDriver: false }).start();
    } else {
      width.setValue(0);
    }
  }, [isActive]);

  const widthInterp = width.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.barTrack}>
      <Animated.View style={[styles.barFill, { width: widthInterp, backgroundColor: color }]} />
    </View>
  );
}

export default function Slide4Waterfall({ isActive }: { isActive: boolean }) {
  const { t } = useTranslation('onboarding');

  const categories = [
    { label: t('slide4.cat1'), potentiel: 80, color: OB.orangeLight, delay: 300 },
    { label: t('slide4.cat2'), potentiel: 45, color: OB.greenLight, delay: 500 },
    { label: t('slide4.cat3'), potentiel: 35, color: OB.blueLight, delay: 700 },
    { label: t('slide4.cat4'), potentiel: 5, color: OB.textMuted, delay: 900 },
  ];

  return (
    <LinearGradient colors={[OB.darkBg, '#12131A']} style={styles.container}>
      {isActive && (
        <>
          {/* Categories Card */}
          <FadeInView active={isActive} delay={100}>
          <OBGlassCard style={styles.card}>
            <Text style={styles.cardTitle}>{t('slide4.cardTitle')}</Text>

            {categories.map((cat, i) => (
              <FadeInView key={cat.label} active={isActive} delay={200 + i * 100} duration={400} from="left" style={styles.catRow}>
                <View style={styles.catHeader}>
                  <Text style={styles.catLabel}>{cat.label}</Text>
                  <Text style={[styles.catPct, { color: cat.color, ...neonGlow(cat.color) }]}>{cat.potentiel}%</Text>
                </View>
                <AnimatedBar potentiel={cat.potentiel} color={cat.color} isActive={isActive} delay={cat.delay} />
                <Text style={styles.catHint}>
                  {cat.potentiel >= 60 ? t('slide4.hintHigh') : cat.potentiel >= 30 ? t('slide4.hintMedium') : t('slide4.hintLow')}
                </Text>
              </FadeInView>
            ))}
          </OBGlassCard>
          </FadeInView>

          {/* Text */}
          <FadeInView active={isActive} delay={400}>
            <Text style={[styles.tagline, neonGlow(OB.accent)]}>{t('slide4.tagline')}</Text>
          </FadeInView>
          <FadeInView active={isActive} delay={500}>
            <Text style={styles.heading}>
              {t('slide4.heading')}
            </Text>
          </FadeInView>
          <FadeInView active={isActive} delay={600}>
            <Text style={styles.body}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>{t('slide4.bodyBold')}</Text>{t('slide4.bodyEnd')}
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
  cardTitle: { fontSize: 13, fontWeight: '700', color: OB.textPrimary, textAlign: 'center', marginBottom: 14 },
  catRow: { marginBottom: 12 },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  catLabel: { fontSize: 13, fontWeight: '600', color: OB.textSecondary },
  catPct: { fontSize: 14, fontWeight: '800' },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: 'rgba(51,65,85,0.4)', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  catHint: { fontSize: 10, color: OB.textMuted, marginTop: 3 },
  tagline: { fontSize: 13, fontWeight: '700', color: OB.blue, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10, textAlign: 'center' },
  heading: { fontSize: 26, fontWeight: '800', color: OB.textPrimary, textAlign: 'center', lineHeight: 34, marginBottom: 12 },
  body: { fontSize: 15, color: OB.textSecondary, textAlign: 'center', lineHeight: 22, maxWidth: 300 },
});
