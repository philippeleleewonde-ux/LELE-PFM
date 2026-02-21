import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { OB, FadeInView, ZoomInView, OBGlassCard, neonGlow } from '../shared';

const benefits = [
  { icon: '\u{1F4B0}', title: 'Ton épargne est boostée', desc: 'Ton cashback naturel vient renforcer tes réserves', color: OB.greenLight },
  { icon: '\u{1F389}', title: 'Tes plaisirs aussi', desc: 'Une partie finance ce qui te fait envie', color: OB.orangeLight },
  { icon: '\u{1F6E1}\uFE0F', title: 'Sans toucher au vital', desc: 'On ne coupe jamais l\'essentiel', color: OB.blueLight },
];

export default function Slide6Cube({ isActive }: { isActive: boolean }) {
  return (
    <LinearGradient colors={[OB.darkBg, '#12131A']} style={styles.container}>
      {isActive && (
        <>
          {/* Benefits Card */}
          <FadeInView active={isActive} delay={100}>
          <OBGlassCard style={styles.card}>
            {/* Treasure icon */}
            <ZoomInView active={isActive} delay={200} style={styles.iconCenter}>
              <View style={styles.treasureBadge}>
                <Text style={styles.treasureEmoji}>{'\u{1F48E}'}</Text>
              </View>
            </ZoomInView>

            <Text style={styles.cardTitle}>Ton cashback naturel travaille pour toi</Text>

            {benefits.map((b, i) => (
              <FadeInView key={b.title} active={isActive} delay={400 + i * 150} duration={400} from="left" style={[styles.benefitRow, i < benefits.length - 1 && styles.benefitRowBorder]}>
                <View style={[styles.benefitIcon, { backgroundColor: b.color + '15' }]}>
                  <Text style={{ fontSize: 16 }}>{b.icon}</Text>
                </View>
                <View style={styles.benefitInfo}>
                  <Text style={[styles.benefitTitle, { color: b.color }]}>{b.title}</Text>
                  <Text style={styles.benefitDesc}>{b.desc}</Text>
                </View>
              </FadeInView>
            ))}
          </OBGlassCard>
          </FadeInView>

          {/* Text */}
          <FadeInView active={isActive} delay={500}>
            <Text style={[styles.tagline, neonGlow(OB.accent)]}>Le meilleur des deux mondes</Text>
          </FadeInView>
          <FadeInView active={isActive} delay={600}>
            <Text style={styles.heading}>
              Un cashback qui booste{'\n'}épargne ET plaisirs.
            </Text>
          </FadeInView>
          <FadeInView active={isActive} delay={700}>
            <Text style={styles.body}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Ton cashback naturel booste ton épargne ET tes plaisirs</Text>, sans effort ni sacrifice.
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
  iconCenter: { alignItems: 'center', marginBottom: 12 },
  treasureBadge: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,215,0,0.12)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)' },
  treasureEmoji: { fontSize: 28 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: OB.textPrimary, textAlign: 'center', marginBottom: 14 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  benefitRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  benefitIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  benefitInfo: { flex: 1 },
  benefitTitle: { fontSize: 13, fontWeight: '700' },
  benefitDesc: { fontSize: 11, color: OB.textMuted, marginTop: 2 },
  tagline: { fontSize: 13, fontWeight: '700', color: OB.blue, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10, textAlign: 'center' },
  heading: { fontSize: 26, fontWeight: '800', color: OB.textPrimary, textAlign: 'center', lineHeight: 34, marginBottom: 12 },
  body: { fontSize: 15, color: OB.textSecondary, textAlign: 'center', lineHeight: 22, maxWidth: 300 },
});
