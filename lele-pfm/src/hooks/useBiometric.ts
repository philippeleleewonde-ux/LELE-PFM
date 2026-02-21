import { useState, useCallback } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAppStore } from '@/stores/app.store';

export interface BiometricResult {
  success: boolean;
  error?: string;
}

export const useBiometric = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const biometricEnabled = useAppStore((state) => state.biometricEnabled);
  const setBiometricEnabled = useAppStore((state) => state.setBiometricEnabled);

  const checkBiometricAvailable = useCallback(async (): Promise<boolean> => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        return false;
      }

      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setIsAvailable(enrolled);
      return enrolled;
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return false;
    }
  }, []);

  const authenticate = useCallback(
    async (reason: string = 'Authenticate to continue'): Promise<BiometricResult> => {
      setIsLoading(true);

      try {
        if (!biometricEnabled) {
          return {
            success: false,
            error: 'Biometric authentication is not enabled',
          };
        }

        const isAvailable = await checkBiometricAvailable();
        if (!isAvailable) {
          return {
            success: false,
            error: 'Biometric authentication is not available',
          };
        }

        const result = await LocalAuthentication.authenticateAsync({
          disableDeviceFallback: false,
          reason,
        });

        return {
          success: result.success,
          error: result.error,
        };
      } catch (error) {
        console.error('Biometric authentication error:', error);
        return {
          success: false,
          error: 'Authentication failed',
        };
      } finally {
        setIsLoading(false);
      }
    },
    [biometricEnabled, checkBiometricAvailable]
  );

  const enableBiometric = useCallback(async (): Promise<boolean> => {
    try {
      const available = await checkBiometricAvailable();
      if (available) {
        setBiometricEnabled(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error enabling biometric:', error);
      return false;
    }
  }, [checkBiometricAvailable, setBiometricEnabled]);

  const disableBiometric = useCallback(() => {
    setBiometricEnabled(false);
  }, [setBiometricEnabled]);

  return {
    isAvailable,
    isLoading,
    biometricEnabled,
    checkBiometricAvailable,
    authenticate,
    enableBiometric,
    disableBiometric,
  };
};
