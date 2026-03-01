import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack, Redirect, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, ActivityIndicator, View, Platform, StyleSheet } from 'react-native';
import i18n from '../i18n';
import { lightColors, darkColors } from '../theme/colors';
import { useAuthStore } from '../stores/auth.store';
import { useAppStore } from '../stores/app.store';
import { supabase } from '../infrastructure/supabase/client';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { NativeWindStyleSheet } from "nativewind";

NativeWindStyleSheet.setOutput({
  default: "native",
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const segments = useSegments();

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setUser = useAuthStore((s) => s.setUser);
  const setSession = useAuthStore((s) => s.setSession);
  const logout = useAuthStore((s) => s.logout);
  const isOnboarded = useAppStore((s) => s.isOnboarded);
  const isSetupComplete = useAppStore((s) => s.isSetupComplete);
  const isLanguageSet = useAppStore((s) => s.isLanguageSet);
  const language = useAppStore((s) => s.language);

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language]);

  // Listen for Supabase auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            firstName: session.user.user_metadata?.first_name || '',
            lastName: session.user.user_metadata?.last_name || '',
            currency: 'EUR',
            locale: 'fr',
            createdAt: session.user.created_at,
            updatedAt: session.user.updated_at || session.user.created_at,
          });
          setSession(
            session.access_token,
            session.refresh_token,
            session.expires_at
          );
        } else {
          logout();
        }
        setIsReady(true);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (!isReady) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary[700]} />
      </View>
    );
  }

  const inAuthGroup = segments[0] === '(auth)';
  const inOnboarding = segments[0] === 'onboarding';
  const inSetupWizard = segments[0] === 'setup-wizard';
  const inLanguageSelect = segments[0] === 'language-select';

  const isWeb = Platform.OS === 'web';

  return (
    <SafeAreaProvider>
      <StatusBar
        style={colorScheme === 'dark' ? 'light' : 'dark'}
        backgroundColor={colors.background}
      />

      {/* Responsive mobile shell: constrain to 430px on web, full width on native */}
      <View style={responsiveStyles.outerShell}>
        <View style={responsiveStyles.appFrame}>
          {/* Language select redirect: show language picker before everything */}
          {!isLanguageSet && !inLanguageSelect && (
            <Redirect href="/language-select" />
          )}

          {/* Onboarding redirect: show onboarding if not completed yet */}
          {isLanguageSet && !isOnboarded && !inOnboarding && !inLanguageSelect && (
            <Redirect href="/onboarding" />
          )}

          {/* Auth redirect: after onboarding, redirect to login if not authenticated */}
          {isOnboarded && !isAuthenticated && !inAuthGroup && !inOnboarding && (
            <Redirect href="/(auth)/login" />
          )}

          {/* Setup wizard redirect: after auth, if setup not complete */}
          {isAuthenticated && !isSetupComplete && !inSetupWizard && !inOnboarding && (
            <Redirect href="/setup-wizard" />
          )}

          {/* Tabs redirect: if authenticated, setup complete, and in auth group, go to tabs */}
          {isAuthenticated && isSetupComplete && inAuthGroup && (
            <Redirect href="/(tabs)" />
          )}
          <ErrorBoundary>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: {
                  backgroundColor: colors.background,
                },
              }}
            >
              <Stack.Screen name="language-select" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="setup-wizard" />
              <Stack.Screen name="(tabs)" />
            </Stack>
          </ErrorBoundary>
        </View>
      </View>
    </SafeAreaProvider>
  );
}

const MAX_APP_WIDTH = 430;

const responsiveStyles = StyleSheet.create({
  outerShell: {
    flex: 1,
    backgroundColor: '#0A0B0E',
    alignItems: 'center',
  },
  appFrame: {
    flex: 1,
    width: '100%',
    ...(Platform.OS === 'web' ? {
      maxWidth: MAX_APP_WIDTH,
      // Subtle side borders to frame the app
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: 'rgba(255,255,255,0.06)',
      // Soft glow shadow on desktop
      shadowColor: '#FBBF24',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.08,
      shadowRadius: 30,
    } : {}),
  },
});
