import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { OB, FadeInView, ZoomInView, neonGlow } from '../shared';

const steps = [
  { icon: '\u{23F1}\uFE0F', text: '5 minutes pour ton diagnostic' },
  { icon: '\u{1F4CA}', text: 'Ton score et ton grade instantanement' },
  { icon: '\u{1F4B0}', text: 'Ton pactole calcule sur 3 ans' },
  { icon: '\u{1F3AF}', text: 'Tes objectifs concrets par mois' },
  { icon: '\u{1F680}', text: 'Tu decolles vers ta liberte financiere' },
];

export default function Slide7Final({ isActive }: { isActive: boolean }) {
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
            <Text style={styles.heading}>
              5 minutes.{'\n'}Ensuite, on decolle.
            </Text>
          </FadeInView>

          {/* Steps list */}
          <View style={styles.stepsList}>
            {steps.map((s, i) => (
              <FadeInView
                key={s.text}
                active={isActive}
                delay={500 + i * 100}
                duration={400}
                from="left"
                style={[styles.stepRow, i < steps.length - 1 && styles.stepRowBorder]}
              >
                <View style={styles.stepIcon}>
                  <Text style={{ fontSize: 14 }}>{s.icon}</Text>
                </View>
                <Text style={styles.stepText}>{s.text}</Text>
              </FadeInView>
            ))}
          </View>

          {/* Bottom tagline */}
          <FadeInView active={isActive} delay={1100}>
            <Text style={[styles.bottomTagline, neonGlow(OB.gold)]}>
              Ton futur financier commence ici.
            </Text>
          </FadeInView>
        </>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingBottom: 120, paddingTop: 60 },
  logoWrap: { marginBottom: 16 },
  logo: { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#fff', fontSize: 26, fontWeight: '800' },
  heading: { fontSize: 28, fontWeight: '800', color: OB.textPrimary, textAlign: 'center', lineHeight: 36, marginBottom: 24, ...neonGlow('#FFFFFF') },
  stepsList: { width: '100%', maxWidth: 300 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  stepRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  stepIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(251,189,35,0.15)', alignItems: 'center', justifyContent: 'center', shadowColor: OB.accent, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } },
  stepText: { flex: 1, fontSize: 14, color: '#A1A1AA' },
  bottomTagline: { marginTop: 24, fontSize: 15, fontWeight: '700', color: OB.gold, textAlign: 'center' },
});
