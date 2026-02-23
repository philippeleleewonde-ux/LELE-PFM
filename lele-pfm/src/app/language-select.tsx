import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useLanguageSwitch } from '@/hooks/useLanguageSwitch';
import type { Language } from '@/stores/app.store';

const LANGUAGES: Array<{ code: Language; flag: string; name: string; native: string }> = [
  { code: 'fr', flag: '🇫🇷', name: 'Français', native: 'Français' },
  { code: 'en', flag: '🇬🇧', name: 'English', native: 'English' },
  { code: 'es', flag: '🇪🇸', name: 'Español', native: 'Español' },
  { code: 'pt', flag: '🇧🇷', name: 'Português', native: 'Português' },
];

export default function LanguageSelectScreen() {
  const router = useRouter();
  const { changeAppLanguage } = useLanguageSwitch();

  const handleSelect = async (lang: Language) => {
    await changeAppLanguage(lang);
    router.replace('/onboarding');
  };

  return (
    <LinearGradient colors={['#0F1014', '#1A1C23']} style={styles.container}>
      {/* Logo */}
      <View style={styles.logoWrap}>
        <LinearGradient
          colors={['#3B82F6', '#8B5CF6']}
          style={styles.logo}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.logoText}>PFM</Text>
        </LinearGradient>
      </View>

      <Text style={styles.title}>Choose your language</Text>
      <Text style={styles.subtitle}>Choisissez votre langue</Text>

      {/* Language cards */}
      <View style={styles.grid}>
        {LANGUAGES.map((lang) => (
          <Pressable
            key={lang.code}
            onPress={() => handleSelect(lang.code)}
            style={({ pressed }) => [
              styles.card,
              pressed && styles.cardPressed,
            ]}
          >
            <Text style={styles.flag}>{lang.flag}</Text>
            <Text style={styles.langName}>{lang.native}</Text>
          </Pressable>
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logoWrap: {
    marginBottom: 32,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#A1A1AA',
    textAlign: 'center',
    marginBottom: 32,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    width: '100%',
    maxWidth: 320,
  },
  card: {
    width: '45%',
    aspectRatio: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  cardPressed: {
    backgroundColor: 'rgba(251,189,35,0.12)',
    borderColor: '#FBBF24',
    transform: [{ scale: 0.96 }],
  },
  flag: {
    fontSize: 40,
  },
  langName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
