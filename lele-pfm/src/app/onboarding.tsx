import React from 'react';
import { useRouter } from 'expo-router';
import { useAppStore } from '../stores/app.store';
import OnboardingScreen from '../components/onboarding/OnboardingScreen';

export default function OnboardingRoute() {
  const router = useRouter();
  const setOnboarded = useAppStore((s) => s.setOnboarded);

  const handleComplete = () => {
    setOnboarded(true);
    router.replace('/(auth)/login');
  };

  return <OnboardingScreen onComplete={handleComplete} />;
}
