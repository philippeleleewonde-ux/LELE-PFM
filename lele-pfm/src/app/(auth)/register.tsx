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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import { Link } from 'expo-router';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../stores/auth.store';

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

function AuthSpotlights() {
  const blur = Platform.select({ web: { filter: 'blur(80px)' } as any, default: { opacity: 0.4 } });
  return (
    <>
      <View style={[regSpotStyles.circle, { top: -60, left: -80, backgroundColor: 'rgba(217,161,27,0.12)' }, blur]} />
      <View style={[regSpotStyles.circle, { top: '40%' as any, right: -100, backgroundColor: 'rgba(251,189,35,0.10)' }, blur]} />
      <View style={[regSpotStyles.circle, { bottom: -40, left: '30%' as any, backgroundColor: 'rgba(74,222,128,0.06)' }, blur]} />
    </>
  );
}

const regSpotStyles = StyleSheet.create({
  circle: { position: 'absolute', width: 280, height: 280, borderRadius: 140 },
});

export default function RegisterScreen() {
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const isLoading = useAuthStore((s) => s.isLoading);
  const setLoading = useAuthStore((s) => s.setLoading);

  const handleRegister = async () => {
    setError(null);

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      setError(t('errors.requiredField'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('errors.passwordMismatch'));
      return;
    }

    setLoading(true);
    const result = await authService.signUp(
      email.trim(),
      password,
      firstName.trim(),
      lastName.trim()
    );
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
          <Text style={styles.formTitle}>{t('auth.register')}</Text>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfInput]}>
              <Text style={styles.label}>{t('auth.firstName')}</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Jean"
                placeholderTextColor={C.textMuted}
                autoCapitalize="words"
                editable={!isLoading}
                accessibilityLabel="Prénom"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfInput]}>
              <Text style={styles.label}>{t('auth.lastName')}</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Dupont"
                placeholderTextColor={C.textMuted}
                autoCapitalize="words"
                editable={!isLoading}
                accessibilityLabel="Nom de famille"
              />
            </View>
          </View>

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
              accessibilityLabel="Adresse email"
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
              editable={!isLoading}
              accessibilityLabel="Mot de passe"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('auth.confirmPassword')}</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="********"
              placeholderTextColor={C.textMuted}
              secureTextEntry
              editable={!isLoading}
              accessibilityLabel="Confirmer le mot de passe"
            />
          </View>

          <Text style={styles.hint}>{t('validation.password')}</Text>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              isLoading && styles.buttonDisabled,
              pressed && !isLoading && { opacity: 0.9, transform: [{ scale: 0.98 }] },
            ]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#0F1014" />
            ) : (
              <Text style={styles.buttonText}>{t('auth.createAccount')}</Text>
            )}
          </Pressable>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('auth.hasAccount')}</Text>
          <Link href="/login" asChild>
            <Pressable>
              <Text style={styles.linkText}> {t('auth.login')}</Text>
            </Pressable>
          </Link>
        </View>
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
    marginBottom: 32,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: C.accent,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  logoText: {
    color: '#0F1014',
    fontSize: 22,
    fontWeight: '800',
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 2,
    color: C.textPrimary,
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
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
  hint: {
    fontSize: 12,
    marginBottom: 16,
    lineHeight: 18,
    color: C.textMuted,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: C.textMuted,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.accent,
  },
});
