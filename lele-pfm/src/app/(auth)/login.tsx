import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import { Link, useRouter } from 'expo-router';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../stores/auth.store';
import { useAppStore } from '../../stores/app.store';

// Neon dark fintech theme (Gemini design)
const C = {
  darkBg: '#0F1014',
  darkBgAlt: '#1A1C23',
  border: 'rgba(255,255,255,0.1)',
  accent: '#FBBF24',
  accentLight: '#FBBF24',
  accentDark: '#D9A11B',
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#52525B',
  red: '#EF4444',
  redBg: 'rgba(239,68,68,0.1)',
  inputBg: 'rgba(255,255,255,0.06)',
  cardBg: 'rgba(255,255,255,0.05)',
};

function neonGlow(color: string = C.accent): TextStyle {
  return { textShadowColor: color, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 };
}

function AuthSpotlights() {
  const blur = Platform.select({ web: { filter: 'blur(80px)' } as any, default: { opacity: 0.4 } });
  return (
    <>
      <View style={[authSpotStyles.circle, { top: -60, left: -80, backgroundColor: 'rgba(217,161,27,0.12)' }, blur]} />
      <View style={[authSpotStyles.circle, { top: '40%' as any, right: -100, backgroundColor: 'rgba(251,189,35,0.10)' }, blur]} />
      <View style={[authSpotStyles.circle, { bottom: -40, left: '30%' as any, backgroundColor: 'rgba(74,222,128,0.06)' }, blur]} />
    </>
  );
}

const authSpotStyles = StyleSheet.create({
  circle: { position: 'absolute', width: 280, height: 280, borderRadius: 140 },
});

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const isLoading = useAuthStore((s) => s.isLoading);
  const setLoading = useAuthStore((s) => s.setLoading);
  const setOnboarded = useAppStore((s) => s.setOnboarded);

  const handleLogin = async () => {
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError(t('errors.requiredField'));
      return;
    }

    setLoading(true);
    const result = await authService.signIn(email.trim(), password);
    setLoading(false);

    if (!result.success) {
      setError(result.error || t('messages.error'));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <AuthSpotlights />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoSection}>
          <LinearGradient
            colors={[C.accent, C.accentDark]}
            style={styles.logoBadge}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.logoText}>PFM</Text>
          </LinearGradient>
          <Text style={styles.appName}>LELE PFM</Text>
          <Text style={styles.tagline}>{t('auth.tagline')}</Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          <LinearGradient
            colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.formTitle}>{t('auth.login')}</Text>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('auth.email')}</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="email@exemple.com"
              placeholderTextColor={C.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('auth.password')}</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="********"
              placeholderTextColor={C.textMuted}
              secureTextEntry
              autoComplete="password"
              editable={!isLoading}
            />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              isLoading && styles.buttonDisabled,
              pressed && !isLoading && { opacity: 0.9, transform: [{ scale: 0.98 }] },
            ]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#0F1014" />
            ) : (
              <Text style={styles.buttonText}>{t('auth.login')}</Text>
            )}
          </Pressable>

          <Pressable onPress={() => {}} style={styles.forgotLink}>
            <Text style={styles.linkText}>{t('auth.forgotPassword')}</Text>
          </Pressable>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('auth.noAccount')}</Text>
          <Link href="/register" asChild>
            <Pressable>
              <Text style={styles.linkText}> {t('auth.register')}</Text>
            </Pressable>
          </Link>
        </View>

        <Pressable
          style={styles.replayLink}
          onPress={() => {
            setOnboarded(false);
            router.replace('/onboarding');
          }}
        >
          <Text style={styles.replayText}>
            {'\u{1F3AC}'} Revoir la presentation
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.darkBg,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: C.accent,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  logoText: {
    color: '#0F1014',
    fontSize: 24,
    fontWeight: '800',
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 2,
    color: C.textPrimary,
  },
  tagline: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    color: C.textSecondary,
  },
  formCard: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 24,
    color: C.textPrimary,
  },
  errorBox: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: C.redBg,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    color: C.red,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: C.textSecondary,
  },
  input: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.inputBg,
    paddingHorizontal: 16,
    fontSize: 16,
    color: C.textPrimary,
  },
  button: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: C.accentLight,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#0F1014',
    fontSize: 16,
    fontWeight: '700',
  },
  forgotLink: {
    alignItems: 'center',
    marginTop: 16,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.accent,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: C.textMuted,
  },
  replayLink: {
    alignItems: 'center',
    marginTop: 24,
  },
  replayText: {
    fontSize: 13,
    color: C.textMuted,
  },
});
