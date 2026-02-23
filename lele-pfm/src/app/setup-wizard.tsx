import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/stores/app.store';
import { useWizardStore } from '@/stores/wizard-store';
import { useEngineCalculation } from '@/hooks/useEngineCalculation';
import { useEngineStore } from '@/stores/engine-store';
import SetupWizardScreen from '@/components/setup-wizard/SetupWizardScreen';
import { WZ } from '@/components/setup-wizard/shared';

export default function SetupWizardRoute() {
  const { t } = useTranslation('wizard');
  const router = useRouter();
  const setSetupComplete = useAppStore((s) => s.setSetupComplete);
  const formData = useWizardStore((s) => s.formData);
  const { calculate } = useEngineCalculation();
  const setCurrency = useEngineStore((s) => s.setCurrency);
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    setLoading(true);
    setCurrency(formData.currency || 'FCFA');
    try {
      await calculate(formData);
    } catch {
      // Engine errors are non-blocking — proceed to dashboard
    }
    setSetupComplete(true);
    router.replace('/(tabs)');
  };

  if (loading) {
    return (
      <View style={styles.overlay}>
        <View style={styles.loaderCard}>
          <ActivityIndicator size="large" color={WZ.accent} />
          <Text style={styles.loaderText}>{t('loading.analyzing')}</Text>
          <Text style={styles.loaderSub}>{t('loading.calculatingProfile')}</Text>
        </View>
      </View>
    );
  }

  return <SetupWizardScreen onComplete={handleComplete} />;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: WZ.darkBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderCard: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  loaderText: {
    color: WZ.accent,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 20,
    textShadowColor: WZ.accent,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  loaderSub: {
    color: WZ.textSecondary,
    fontSize: 13,
    marginTop: 8,
  },
});
