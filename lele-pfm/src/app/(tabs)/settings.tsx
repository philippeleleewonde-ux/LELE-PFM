import React, { useState } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme';
import { ErrorBoundary } from '../../components/ui/ErrorBoundary';
import { useAuthStore } from '../../stores/auth.store';
import { useAppStore } from '../../stores/app.store';
import { authService } from '../../services/auth.service';
import {
  User as UserIcon,
  LogOut,
  Moon,
  Bell,
  Shield,
  ChevronRight,
  Info,
  Shuffle,
  Trash2,
  RotateCcw,
  Briefcase,
  Edit3,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { generateDemoData } from '@/services/demo-data-generator';
import { populateDemoTracking } from '@/services/demo-full-generator';
import { useWizardStore } from '@/stores/wizard-store';
import { useEngineCalculation } from '@/hooks/useEngineCalculation';
import { useEngineStore } from '@/stores/engine-store';
import { useTransactionStore } from '@/stores/transaction-store';
import { usePerformanceStore } from '@/stores/performance-store';
import { ViewModeSelector } from '@/components/settings/ViewModeSelector';
import { useViewMode } from '@/hooks/useViewMode';
import { useInvestmentStore } from '@/stores/investment-store';
import { useIncomeStore } from '@/stores/income-store';
import { useImpulseStore } from '@/stores/impulse-store';
import { useSavingsGoalStore } from '@/stores/savings-goal-store';
import { useChallengeStore } from '@/stores/challenge-store';
import { useAssetStore } from '@/stores/asset-store';
import { useJourneyStore } from '@/stores/journey-store';
import { InvestorProfileSheet } from '@/components/investment/InvestorProfileSheet';

interface SettingsRowProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  colors: any;
  isLast?: boolean;
}

function SettingsRow({ icon, label, value, onPress, rightElement, colors, isLast }: SettingsRowProps) {
  return (
    <TouchableOpacity
      style={[
        styles.settingsRow,
        { borderBottomColor: colors.border },
        isLast && { borderBottomWidth: 0 },
      ]}
      onPress={onPress}
      disabled={!onPress && !rightElement}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingsRowLeft}>
        {icon}
        <Text style={[styles.settingsRowLabel, { color: colors.text }]}>{label}</Text>
      </View>
      <View style={styles.settingsRowRight}>
        {value && (
          <Text style={[styles.settingsRowValue, { color: colors.textTertiary }]}>{value}</Text>
        )}
        {rightElement}
        {onPress && !rightElement && (
          <ChevronRight size={18} color={colors.textTertiary} />
        )}
      </View>
    </TouchableOpacity>
  );
}

function SettingsScreenInner() {
  const theme = useTheme();
  const colors = theme.colors;
  const { t } = useTranslation(['common', 'app']);
  const user = useAuthStore((s) => s.user);
  const biometricEnabled = useAppStore((s) => s.biometricEnabled);
  const setBiometricEnabled = useAppStore((s) => s.setBiometricEnabled);
  const notificationsEnabled = useAppStore((s) => s.notificationsEnabled);
  const setNotificationsEnabled = useAppStore((s) => s.setNotificationsEnabled);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showInvestorSheet, setShowInvestorSheet] = useState(false);
  const router = useRouter();
  const { isInvestor } = useViewMode();
  const investorProfile = useInvestmentStore((s) => s.investorProfile);
  const clearInvestorProfile = useInvestmentStore((s) => s.clearInvestorProfile);
  const updateFormData = useWizardStore((s) => s.updateFormData);
  const resetWizard = useWizardStore((s) => s.resetWizard);
  const setSetupComplete = useAppStore((s) => s.setSetupComplete);
  const { calculate } = useEngineCalculation();
  const clearTransactions = useTransactionStore((s) => s.clearTransactions);
  const clearRecords = usePerformanceStore((s) => s.clearRecords);
  const clearIncomes = useIncomeStore((s) => s.clearIncomes);
  const clearPurchases = useImpulseStore((s) => s.clearPurchases);
  const clearGoals = useSavingsGoalStore((s) => s.clearGoals);
  const clearChallenges = useChallengeStore((s) => s.clearChallenges);
  const clearInvestmentRecords = useInvestmentStore((s) => s.clearInvestmentRecords);
  const resetInvestment = useInvestmentStore((s) => s.resetAll);
  const clearAssets = useAssetStore((s) => s.clearAssets);
  const resetJourney = useJourneyStore((s) => s.resetJourney);

  const handleRegenerateDemo = async () => {
    setIsGenerating(true);
    try {
      // 1. Clear all tracking stores
      clearTransactions();
      clearIncomes();
      clearPurchases();
      clearGoals();
      clearChallenges();
      clearRecords();
      clearInvestmentRecords();
      resetInvestment();
      clearAssets();
      resetJourney();

      // 2. Generate wizard data + run engine calculation
      const demoData = generateDemoData();
      updateFormData(demoData);
      const engineStore = useEngineStore.getState();
      engineStore.setCurrency(demoData.currency);
      const output = await calculate(demoData);

      // 3. Populate tracking stores with 10 weeks of realistic data
      if (output) {
        const targets = useEngineStore.getState().incomeTargets;
        populateDemoTracking(output, demoData.currency, targets);
      }

      // 4. Success
      if (Platform.OS === 'web') {
        window.alert(t('app:settings.demoSuccess'));
      } else {
        Alert.alert(t('app:settings.done'), t('app:settings.demoSuccess'));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('app:settings.unknownError');
      if (Platform.OS === 'web') {
        window.alert(t('app:settings.error') + ': ' + msg);
      } else {
        Alert.alert(t('app:settings.error'), msg);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearTracking = () => {
    const doDelete = () => {
      clearTransactions();
      clearIncomes();
      clearPurchases();
      clearGoals();
      clearChallenges();
      clearRecords();
      clearInvestmentRecords();
      resetInvestment();
      clearAssets();
      resetJourney();
      if (Platform.OS === 'web') {
        window.alert(t('app:settings.trackingDeletedSuccess'));
      } else {
        Alert.alert(t('app:settings.done'), t('app:settings.trackingDeletedSuccess'));
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(t('app:settings.deleteTrackingConfirmTitle') + '\n' + t('app:settings.deleteTrackingConfirmMessage'))) {
        doDelete();
      }
    } else {
      Alert.alert(
        t('app:settings.deleteTrackingConfirmTitle'),
        t('app:settings.deleteTrackingConfirmMessage'),
        [
          { text: t('app:settings.cancel'), style: 'cancel' },
          { text: t('app:settings.delete'), style: 'destructive', onPress: doDelete },
        ]
      );
    }
  };

  const handleRestartWizard = () => {
    const doRestart = () => {
      // Clear all stores
      clearTransactions();
      clearIncomes();
      clearPurchases();
      clearGoals();
      clearChallenges();
      clearRecords();
      clearInvestmentRecords();
      resetInvestment();
      clearAssets();
      resetJourney();
      // Clear engine + wizard
      useEngineStore.getState().clearEngineOutput();
      resetWizard();
      // Reset setup flag → triggers redirect to /setup-wizard in _layout.tsx
      setSetupComplete(false);
    };

    if (Platform.OS === 'web') {
      if (window.confirm(t('app:settings.restartWebMessage'))) {
        doRestart();
      }
    } else {
      Alert.alert(
        t('app:settings.restartTitle'),
        t('app:settings.restartMessage'),
        [
          { text: t('app:settings.cancel'), style: 'cancel' },
          { text: t('app:settings.restart'), style: 'destructive', onPress: doRestart },
        ]
      );
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('settings.logout'),
      t('messages.confirmDelete'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('auth.logout'),
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            await authService.signOut();
            setIsLoggingOut(false);
          },
        },
      ]
    );
  };

  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : '?';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.md,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.title,
            {
              color: colors.text,
              fontSize: theme.typography.heading1.fontSize,
              fontWeight: theme.typography.heading1.fontWeight,
            },
          ]}
        >
          {t('settings.title')}
        </Text>
      </View>

      {/* Profile Card */}
      <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary[100] }]}>
          <Text style={[styles.avatarText, { color: colors.primary[700] }]}>{initials}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: colors.text }]}>
            {user ? `${user.firstName} ${user.lastName}` : '—'}
          </Text>
          <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
            {user?.email || '—'}
          </Text>
        </View>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, paddingHorizontal: theme.spacing.lg }]}>
          {t('settings.account')}
        </Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SettingsRow
            icon={<UserIcon size={20} color={colors.primary[600]} />}
            label={t('settings.account')}
            onPress={() => {}}
            colors={colors}
          />
          <SettingsRow
            icon={<Shield size={20} color={colors.primary[600]} />}
            label={t('settings.security')}
            onPress={() => {}}
            colors={colors}
            isLast
          />
        </View>
      </View>

      {/* Preferences Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, paddingHorizontal: theme.spacing.lg }]}>
          {t('settings.appearance')}
        </Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SettingsRow
            icon={<Moon size={20} color={colors.primary[600]} />}
            label={t('settings.darkMode')}
            colors={colors}
            rightElement={
              <Switch
                value={false}
                disabled
                trackColor={{ false: colors.neutral[300], true: colors.primary[400] }}
                thumbColor={colors.surface}
              />
            }
          />
          <SettingsRow
            icon={<Bell size={20} color={colors.primary[600]} />}
            label={t('settings.notifications')}
            colors={colors}
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: colors.neutral[300], true: colors.primary[400] }}
                thumbColor={colors.surface}
              />
            }
            isLast
          />
        </View>
      </View>

      {/* View Mode Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, paddingHorizontal: theme.spacing.lg }]}>
          {t('app:settings.viewMode')}
        </Text>
        <View style={{ marginHorizontal: 16 }}>
          <ViewModeSelector />
        </View>
      </View>

      {/* Investor Profile Section (visible in Placement mode only) */}
      {isInvestor && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary, paddingHorizontal: theme.spacing.lg }]}>
            {t('app:settings.investorProfile')}
          </Text>
          <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {investorProfile ? (
              <>
                <SettingsRow
                  icon={<Briefcase size={20} color="#FBBF24" />}
                  label={t('app:settings.risk')}
                  value={t(`app:settings.riskLevels.${investorProfile.riskTolerance}`)}
                  colors={colors}
                />
                <SettingsRow
                  icon={<Briefcase size={20} color="#A78BFA" />}
                  label={t('app:settings.horizon')}
                  value={t(`app:settings.horizonLevels.${investorProfile.horizon}`)}
                  colors={colors}
                />
                <SettingsRow
                  icon={<Briefcase size={20} color="#4ADE80" />}
                  label={t('app:settings.investmentShare')}
                  value={`${investorProfile.investmentRatio}%`}
                  colors={colors}
                />
                <SettingsRow
                  icon={<Edit3 size={20} color={colors.primary[600]} />}
                  label={t('app:settings.editProfile')}
                  onPress={() => setShowInvestorSheet(true)}
                  colors={colors}
                  isLast
                />
              </>
            ) : (
              <SettingsRow
                icon={<Briefcase size={20} color="#FBBF24" />}
                label={t('app:settings.configureProfile')}
                onPress={() => setShowInvestorSheet(true)}
                colors={colors}
                isLast
              />
            )}
          </View>
        </View>
      )}

      {/* About Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, paddingHorizontal: theme.spacing.lg }]}>
          {t('settings.about')}
        </Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SettingsRow
            icon={<Info size={20} color={colors.primary[600]} />}
            label={t('settings.version')}
            value="1.0.0"
            colors={colors}
            isLast
          />
        </View>
      </View>

      {/* Dev Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary, paddingHorizontal: theme.spacing.lg }]}>
          {t('app:settings.development')}
        </Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.demoRow, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
            onPress={handleRegenerateDemo}
            activeOpacity={0.7}
            disabled={isGenerating}
          >
            <View style={styles.settingsRowLeft}>
              {isGenerating ? (
                <ActivityIndicator size="small" color={colors.primary[600]} />
              ) : (
                <Shuffle size={20} color={colors.primary[600]} />
              )}
              <Text style={[styles.settingsRowLabel, { color: colors.text }]}>
                {isGenerating ? t('app:settings.generating') : t('app:settings.demoData')}
              </Text>
            </View>
            {!isGenerating && (
              <Text style={[styles.settingsRowValue, { color: colors.textTertiary }]}>
                {t('app:settings.regenerate')}
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.demoRow, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
            onPress={handleClearTracking}
            activeOpacity={0.7}
          >
            <View style={styles.settingsRowLeft}>
              <Trash2 size={20} color={colors.danger[600]} />
              <Text style={[styles.settingsRowLabel, { color: colors.danger[600] }]}>
                {t('app:settings.deleteTracking')}
              </Text>
            </View>
            <Text style={[styles.settingsRowValue, { color: colors.textTertiary }]}>
              {t('app:settings.allTracking')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.demoRow]}
            onPress={handleRestartWizard}
            activeOpacity={0.7}
          >
            <View style={styles.settingsRowLeft}>
              <RotateCcw size={20} color={colors.danger[600]} />
              <Text style={[styles.settingsRowLabel, { color: colors.danger[600] }]}>
                {t('app:settings.restartWizard')}
              </Text>
            </View>
            <Text style={[styles.settingsRowValue, { color: colors.textTertiary }]}>
              {t('app:settings.clearAll')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Logout Button */}
      <View style={[styles.section, { paddingHorizontal: theme.spacing.lg }]}>
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.danger[50], borderColor: colors.danger[200] }]}
          onPress={handleLogout}
          disabled={isLoggingOut}
          activeOpacity={0.8}
        >
          {isLoggingOut ? (
            <ActivityIndicator color={colors.danger[600]} />
          ) : (
            <>
              <LogOut size={20} color={colors.danger[600]} />
              <Text style={[styles.logoutText, { color: colors.danger[600] }]}>
                {t('settings.logout')}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      <InvestorProfileSheet
        visible={showInvestorSheet}
        onClose={() => setShowInvestorSheet(false)}
      />
    </ScrollView>
  );
}

export default function SettingsScreen() {
  return (
    <ErrorBoundary>
      <SettingsScreenInner />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    borderBottomWidth: 1,
  },
  title: {
    marginBottom: 8,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
  },
  profileInfo: {
    marginLeft: 14,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 14,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  sectionCard: {
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  settingsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsRowLabel: {
    fontSize: 16,
  },
  settingsRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingsRowValue: {
    fontSize: 14,
  },
  demoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
