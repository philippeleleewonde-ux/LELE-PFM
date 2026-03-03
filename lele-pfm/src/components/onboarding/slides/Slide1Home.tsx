import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { OB, FadeInView, ZoomInView, OBGlassCard, neonGlow } from '../shared';

export default function Slide1Home({ isActive }: { isActive: boolean }) {
  const { t } = useTranslation('onboarding');

  const comparisons = [
    { avant: t('slide1.comp1Before'), apres: t('slide1.comp1After'), icon: '💸' },
    { avant: t('slide1.comp2Before'), apres: t('slide1.comp2After'), icon: '🏦' },
    { avant: t('slide1.comp3Before'), apres: t('slide1.comp3After'), icon: '🎯' },
    { avant: t('slide1.comp4Before'), apres: t('slide1.comp4After'), icon: '📈' },
  ];

  return (
    <LinearGradient colors={[OB.darkBg, OB.darkBgAlt]} style={styles.container}>
      {isActive && (
        <>
          {/* Logo */}
          <ZoomInView active={isActive} delay={100} style={styles.logoWrap}>
            <LinearGradient colors={[OB.blue, OB.purple]} style={styles.logo} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={styles.logoText}>PFM</Text>
            </LinearGradient>
          </ZoomInView>

          {/* Title */}
          <FadeInView active={isActive} delay={300}>
            <Text style={styles.title}>
              {t('slide1.title')}{'\n'}
              <Text style={styles.titleGradient}>{t('slide1.titleHighlight')}</Text>
            </Text>
          </FadeInView>

          {/* Subtitle */}
          <FadeInView active={isActive} delay={500}>
            <Text style={styles.subtitle}>
              {t('slide1.subtitle')}
            </Text>
          </FadeInView>

          {/* Comparison */}
          <FadeInView active={isActive} delay={700} style={styles.compBox}>
            <OBGlassCard style={styles.compBoxInner}>
            <View style={styles.compHeader}>
              <Text style={[styles.compHeaderText, { color: OB.textMuted }]}>{t('slide1.headerBefore')}</Text>
              <Text style={[styles.compHeaderText, { color: OB.blue, ...neonGlow(OB.accent) }]}>{t('slide1.headerAfter')}</Text>
            </View>
            {comparisons.map((c, i) => (
              <FadeInView key={c.icon} active={isActive} delay={800 + i * 100} duration={400} from="top" style={[styles.compRow, i < comparisons.length - 1 && styles.compRowBorder]}>
                <Text style={styles.compClassic}>{c.avant}</Text>
                <Text style={styles.compIcon}>{c.icon}</Text>
                <Text style={styles.compPfm}>{c.apres}</Text>
              </FadeInView>
            ))}
            </OBGlassCard>
          </FadeInView>
        </>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 24, paddingTop: 48 },
  logoWrap: { marginBottom: 16 },
  logo: { width: 80, height: 80, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  title: { fontSize: 26, fontWeight: '800', color: OB.textPrimary, textAlign: 'center', lineHeight: 34, marginBottom: 8 },
  titleGradient: { color: OB.blueLight, ...neonGlow(OB.accent) },
  subtitle: { fontSize: 15, color: OB.textSecondary, textAlign: 'center', marginBottom: 24, maxWidth: 280 },
  compBox: { width: '100%', maxWidth: 320 },
  compBoxInner: { borderRadius: 16, padding: 14 },
  compHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, paddingHorizontal: 4 },
  compHeaderText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  compRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  compRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  compClassic: { flex: 1, fontSize: 12, color: OB.textMuted },
  compIcon: { fontSize: 16, marginHorizontal: 8 },
  compPfm: { flex: 1, fontSize: 12, color: OB.blueLight, fontWeight: '600', textAlign: 'right' },
});
