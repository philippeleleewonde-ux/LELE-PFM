import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { OB, FadeInView, ZoomInView, OBGlassCard, neonGlow } from '../shared';

const steps = [
  { num: '1', label: 'Ton profil', desc: 'Age, situation, metier', icon: '👤', color: OB.blueLight },
  { num: '2', label: 'Tes revenus', desc: 'Salaire, business, aides', icon: '💰', color: OB.greenLight },
  { num: '3', label: 'Tes depenses', desc: 'Par categorie', icon: '🛒', color: OB.orangeLight },
  { num: '4', label: 'Ton historique', desc: '3 a 5 ans de donnees', icon: '📊', color: OB.accent },
];

export default function Slide2Receipt({ isActive }: { isActive: boolean }) {
  return (
    <LinearGradient colors={[OB.darkBg, '#12131A']} style={styles.container}>
      {isActive && (
        <>
          {/* Steps Card */}
          <FadeInView active={isActive} delay={100}>
          <OBGlassCard style={styles.card}>
            <Text style={styles.cardTitle}>On te pose quelques questions</Text>

            {steps.map((s, i) => (
              <FadeInView key={s.num} active={isActive} delay={200 + i * 120} duration={400} from="left" style={[styles.stepRow, i < steps.length - 1 && styles.stepRowBorder]}>
                <View style={[styles.stepNum, { backgroundColor: s.color + '20' }]}>
                  <Text style={[styles.stepNumText, { color: s.color }]}>{s.icon}</Text>
                </View>
                <View style={styles.stepInfo}>
                  <Text style={styles.stepLabel}>{s.label}</Text>
                  <Text style={styles.stepDesc}>{s.desc}</Text>
                </View>
                <Text style={[styles.stepCheck, { color: s.color }]}>{'\u2713'}</Text>
              </FadeInView>
            ))}

            {/* Result reveal */}
            <ZoomInView active={isActive} delay={800} style={styles.resultBox}>
              <Text style={styles.resultIcon}>{'\u{1F9E0}'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.resultTitle}>Le moteur analyse tout</Text>
                <Text style={styles.resultSub}>et detecte tes economies cachees</Text>
              </View>
            </ZoomInView>
          </OBGlassCard>
          </FadeInView>

          {/* Text */}
          <FadeInView active={isActive} delay={400}>
            <Text style={[styles.tagline, neonGlow(OB.accent)]}>On identifie comment tu depenses</Text>
          </FadeInView>
          <FadeInView active={isActive} delay={500}>
            <Text style={styles.heading}>
              Quelques questions.{'\n'}Des reponses puissantes.
            </Text>
          </FadeInView>
          <FadeInView active={isActive} delay={600}>
            <Text style={styles.body}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Tu nous dis comment tu vis</Text>, on calcule comment tu peux vivre mieux. Pas de jugement, juste des chiffres.
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
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  stepRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  stepNum: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontSize: 16 },
  stepInfo: { flex: 1 },
  stepLabel: { fontSize: 13, fontWeight: '700', color: OB.textPrimary },
  stepDesc: { fontSize: 11, color: OB.textMuted, marginTop: 1 },
  stepCheck: { fontSize: 16, fontWeight: '800' },
  resultBox: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: 'rgba(251,189,35,0.08)', borderWidth: 1, borderColor: 'rgba(251,189,35,0.25)' },
  resultIcon: { fontSize: 20 },
  resultTitle: { fontSize: 12, fontWeight: '700', color: OB.blueLight, ...neonGlow(OB.blueLight) },
  resultSub: { fontSize: 11, color: OB.textSecondary, marginTop: 2 },
  tagline: { fontSize: 13, fontWeight: '700', color: OB.blue, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10, textAlign: 'center' },
  heading: { fontSize: 26, fontWeight: '800', color: OB.textPrimary, textAlign: 'center', lineHeight: 34, marginBottom: 12 },
  body: { fontSize: 15, color: OB.textSecondary, textAlign: 'center', lineHeight: 22, maxWidth: 300 },
});
