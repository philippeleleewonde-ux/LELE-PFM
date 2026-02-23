import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { OB, FadeInView, OBGlassCard, neonGlow } from '../shared';

function AnimatedRing({ isActive }: { isActive: boolean }) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (isActive) {
      progress.setValue(0);
      Animated.timing(progress, { toValue: 72, duration: 1500, delay: 400, useNativeDriver: false }).start();
    } else {
      progress.setValue(0);
    }
  }, [isActive]);

  const widthInterp = progress.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.barTrack}>
      <Animated.View style={[styles.barFill, { width: widthInterp }]}>
        <LinearGradient colors={[OB.blue, OB.purple]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
      </Animated.View>
    </View>
  );
}

export default function Slide3Level({ isActive }: { isActive: boolean }) {
  const { t } = useTranslation('onboarding');

  const kpis = [
    { label: t('slide3.kpi1'), value: '840 000 F', color: OB.greenLight },
    { label: t('slide3.kpi2'), value: '210 000 F', color: OB.orangeLight },
    { label: t('slide3.kpi3'), value: '120 000 F', color: OB.blueLight },
  ];

  return (
    <LinearGradient colors={[OB.darkBg, '#12131A']} style={styles.container}>
      {isActive && (
        <>
          {/* Score Card */}
          <FadeInView active={isActive} delay={100}>
          <OBGlassCard style={styles.card}>
            <View style={styles.scoreRow}>
              <View>
                <Text style={styles.scoreLabel}>{t('slide3.scoreLabel')}</Text>
                <Text style={styles.scoreValue}>72 <Text style={styles.scoreSuffix}>/ 100</Text></Text>
              </View>
              <View style={styles.gradeBadge}>
                <Text style={styles.gradeText}>B</Text>
              </View>
            </View>

            <AnimatedRing isActive={isActive} />

            {/* Mini KPIs */}
            <View style={styles.kpisCol}>
              {kpis.map((k, i) => (
                <FadeInView key={k.label} active={isActive} delay={600 + i * 120} duration={400} from="left" style={styles.kpiRow}>
                  <View style={[styles.kpiDot, { backgroundColor: k.color }]} />
                  <Text style={styles.kpiLabel}>{k.label}</Text>
                  <Text style={[styles.kpiValue, { color: k.color }]}>{k.value}</Text>
                </FadeInView>
              ))}
            </View>
          </OBGlassCard>
          </FadeInView>

          {/* Text */}
          <FadeInView active={isActive} delay={300}>
            <Text style={[styles.tagline, neonGlow(OB.accent)]}>{t('slide3.tagline')}</Text>
          </FadeInView>
          <FadeInView active={isActive} delay={400}>
            <Text style={styles.heading}>
              {t('slide3.heading')}
            </Text>
          </FadeInView>
          <FadeInView active={isActive} delay={500}>
            <Text style={styles.body}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>{t('slide3.bodyBold')}</Text>{t('slide3.bodyEnd')}
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
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  scoreLabel: { fontSize: 11, color: OB.textMuted, marginBottom: 4 },
  scoreValue: { fontSize: 32, fontWeight: '800', color: OB.textPrimary, ...neonGlow('#FFFFFF') },
  scoreSuffix: { fontSize: 16, fontWeight: '600', color: OB.textMuted },
  gradeBadge: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,215,0,0.15)', alignItems: 'center', justifyContent: 'center' },
  gradeText: { fontSize: 22, fontWeight: '800', color: OB.gold, ...neonGlow(OB.gold) },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: 'rgba(51,65,85,0.5)', overflow: 'hidden', marginBottom: 14 },
  barFill: { height: '100%', borderRadius: 4, overflow: 'hidden' },
  kpisCol: { gap: 8 },
  kpiRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kpiDot: { width: 8, height: 8, borderRadius: 4 },
  kpiLabel: { flex: 1, fontSize: 12, color: OB.textSecondary },
  kpiValue: { fontSize: 13, fontWeight: '700' },
  tagline: { fontSize: 13, fontWeight: '700', color: OB.blue, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10, textAlign: 'center' },
  heading: { fontSize: 26, fontWeight: '800', color: OB.textPrimary, textAlign: 'center', lineHeight: 34, marginBottom: 12 },
  body: { fontSize: 15, color: OB.textSecondary, textAlign: 'center', lineHeight: 22, maxWidth: 300 },
});
