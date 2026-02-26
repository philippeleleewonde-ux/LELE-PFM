import React from 'react';
import { ScrollView, View, Text, Pressable, Alert, Platform, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/auth.store';
import { useAppStore } from '../../stores/app.store';
import { useEngineStore } from '../../stores/engine-store';
import { GlassCard } from '../../components/ui/GlassCard';
import { ArrowUpRight, TrendingUp, AlertTriangle, Shield, Wallet, RotateCcw, Award, Target } from 'lucide-react-native';

// Dashboard Components
import { HomeHeader } from '../../components/dashboard/HomeHeader';
import { BalanceCards } from '../../components/dashboard/BalanceCards';
import { RecentTransactions } from '../../components/dashboard/RecentTransactions';
import { InvestmentCard } from '../../components/dashboard/InvestmentCard';
import { ScoreHero } from '../../components/performance/ScoreHero';
import { FinancialScoreRing } from '../../components/performance/FinancialScoreRing';
import { KPICard } from '../../components/performance/KPICard';
import { useFinancialScore } from '../../hooks/useFinancialScore';
import { usePerformanceStore } from '../../stores/performance-store';

// Hooks
import { useDashboardData } from '../../hooks/useDashboardData';
import { formatCurrency } from '../../services/format-helpers';
import { useWeeklyTracking } from '../../hooks/useWeeklyTracking';
import { getCurrentWeek, getWeekRangeLabel } from '../../utils/week-helpers';
import { useViewMode } from '../../hooks/useViewMode';
import { SimpleDashboardHero } from '../../components/dashboard/SimpleDashboardHero';
import { InvestmentSummaryCard } from '../../components/dashboard/InvestmentSummaryCard';
import { IncomeVsExpenseCard } from '../../components/dashboard/IncomeVsExpenseCard';
import { useActiveCompensations } from '../../hooks/useActiveCompensations';
import { useSavingsGoals } from '../../hooks/useSavingsGoals';

export default function DashboardScreen() {
  const { t } = useTranslation('app');
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const engineOutput = useEngineStore((s) => s.engineOutput);
  const currency = useEngineStore((s) => s.currency);
  const clearEngineOutput = useEngineStore((s) => s.clearEngineOutput);
  const resetAppSettings = useAppStore((s) => s.resetAppSettings);
  const logout = useAuthStore((s) => s.logout);
  const { recentTransactions, isLoading } = useDashboardData();
  const { week: currentWeek, year: currentYear } = getCurrentWeek();
  const weeklyTracking = useWeeklyTracking(currentWeek, currentYear);
  const { showSection, isSimple, isInvestor } = useViewMode();
  const { globalScore: dynamicScore, grade: dynamicGrade } = useFinancialScore();
  const hasWeeklyData = usePerformanceStore((s) => s.records.length > 0);
  const compensationInfo = useActiveCompensations(currentWeek, currentYear);
  const goalsAgg = useSavingsGoals();

  const handleResetAll = () => {
    const doReset = () => {
      clearEngineOutput();
      resetAppSettings();
      logout();
      router.replace('/onboarding');
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`${t('dashboard.resetTitle')} ?\n${t('dashboard.resetMessage')}`)) {
        doReset();
      }
    } else {
      Alert.alert(
        t('dashboard.resetTitle'),
        t('dashboard.resetMessage'),
        [
          { text: t('dashboard.cancel'), style: 'cancel' },
          { text: t('dashboard.confirm'), style: 'destructive', onPress: doReset },
        ]
      );
    }
  };

  return (
    <View className="flex-1 bg-darkBg">
      {/* Background Gradient Spotlights */}
      <View className="absolute top-0 left-0 right-0 h-full overflow-hidden pointer-events-none">
        <View className="absolute top-[-100] left-[-100] w-[300] h-[300] bg-goldDark/20 rounded-full blur-[100px]" />
        <View className="absolute top-[200] right-[-100] w-[250] h-[250] bg-gold/20 rounded-full blur-[100px]" />
        <View className="absolute bottom-[-50] left-[50] w-[300] h-[300] bg-success/10 rounded-full blur-[100px]" />
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>

        <HomeHeader
          userName={user?.firstName || t('dashboard.user')}
          onNotificationPress={() => console.log('Notifications')}
        />

        {engineOutput ? (
          <>
            {/* Simple Dashboard Hero (simple mode only) */}
            {isSimple && weeklyTracking.effectiveBudget > 0 && (
              <View style={{ paddingHorizontal: 0, marginBottom: 8 }}>
                <SimpleDashboardHero
                  grade={hasWeeklyData ? dynamicGrade : engineOutput.grade}
                  score={hasWeeklyData ? dynamicScore : engineOutput.globalScore}
                  weeklyBudget={weeklyTracking.effectiveBudget}
                  hasActiveCompensation={compensationInfo.hasActiveCompensations}
                  weeklySpent={weeklyTracking.weeklySpent}
                  savings={weeklyTracking.savings}
                  currentWeek={currentWeek}
                  currentYear={currentYear}
                  planYear={weeklyTracking.planYear}
                  currentQuarter={weeklyTracking.currentQuarter}
                />
              </View>
            )}

            {/* Score compact (expert + investor) — static or dynamic */}
            {showSection(['expert', 'investor']) && (
              <View className="px-6 mb-4">
                <GlassCard variant="dark" className="py-2">
                  {hasWeeklyData ? (
                    <FinancialScoreRing />
                  ) : (
                    <ScoreHero
                      score={engineOutput.globalScore}
                      grade={engineOutput.grade}
                      compact
                    />
                  )}
                </GlassCard>
              </View>
            )}

            {/* 4 mini KPI cards (expert + investor) */}
            {showSection(['expert', 'investor']) && (
              <View className="px-6 mb-6">
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  <KPICard
                    icon={TrendingUp}
                    label={t('dashboard.invisibleCosts')}
                    value={formatCurrency(engineOutput.step1.total_potential)}
                    alertLevel="green"
                  />
                  <KPICard
                    icon={AlertTriangle}
                    label={t('dashboard.visibleCosts')}
                    value={formatCurrency(engineOutput.step2.total_el)}
                    alertLevel="red"
                  />
                  <KPICard
                    icon={Shield}
                    label={t('dashboard.maxCost')}
                    value={formatCurrency(engineOutput.step6.var95)}
                    alertLevel="yellow"
                  />
                  <KPICard
                    icon={Wallet}
                    label={t('dashboard.invisibleTreasure')}
                    value={formatCurrency(engineOutput.step7.prl)}
                    alertLevel="cyan"
                  />
                </View>
              </View>
            )}

            {/* See full analysis button */}
            <View className="px-6 mb-8">
              <Pressable onPress={() => router.push('/(tabs)/performance')} style={{ backgroundColor: '#FBBF24', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                <Text style={{ color: '#0F1014', fontSize: 15, fontWeight: '800' }}>
                  {isSimple ? t('dashboard.seeResults') : t('dashboard.seeAnalysis')}
                </Text>
                <ArrowUpRight size={18} color="#0F1014" />
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <BalanceCards />
            <View className="px-6 mb-8">
              <GlassCard className="flex-row justify-between items-center py-4 px-6">
                <Text className="text-white font-semibold">{t('dashboard.detailedView')}</Text>
                <ArrowUpRight size={20} color="white" />
              </GlassCard>
            </View>
          </>
        )}

        {/* Mini Weekly Progress */}
        {engineOutput && weeklyTracking.effectiveBudget > 0 && (
          <Pressable onPress={() => router.push('/(tabs)/transactions')} style={miniStyles.wrapper}>
            <GlassCard variant="dark">
              <View style={miniStyles.row}>
                <View style={miniStyles.left}>
                  <Text style={miniStyles.label}>{t('dashboard.week')} {getWeekRangeLabel(currentWeek, currentYear)} · An{weeklyTracking.planYear} T{weeklyTracking.currentQuarter}</Text>
                  <Text style={miniStyles.amounts}>
                    <Text style={{ color: compensationInfo.hasActiveCompensations ? '#A78BFA' : weeklyTracking.isOnTrack ? '#4ADE80' : '#F87171', fontWeight: '800' }}>
                      {formatCurrency(weeklyTracking.weeklySpent)}
                    </Text>
                    <Text style={{ color: compensationInfo.hasActiveCompensations ? '#A78BFA' : '#52525B' }}> / {formatCurrency(weeklyTracking.effectiveBudget)}</Text>
                  </Text>
                </View>
                <View style={miniStyles.right}>
                  {weeklyTracking.weeklySpent > 0 && (
                    <View style={[miniStyles.gradeBadge, compensationInfo.hasActiveCompensations && { backgroundColor: 'rgba(167,139,250,0.1)' }]}>
                      <Text style={[miniStyles.gradeText, {
                        color: compensationInfo.hasActiveCompensations ? '#A78BFA' : weeklyTracking.savings.budgetRespecte ? '#4ADE80' : '#F87171'
                      }]}>
                        {weeklyTracking.savings.grade}
                      </Text>
                    </View>
                  )}
                  <Text style={[miniStyles.percent, { color: compensationInfo.hasActiveCompensations ? '#A78BFA' : weeklyTracking.isOnTrack ? '#4ADE80' : '#F87171' }]}>
                    {weeklyTracking.progressPercent}%
                  </Text>
                  <ArrowUpRight size={16} color="#A1A1AA" />
                </View>
              </View>
              <View style={miniStyles.barBg}>
                <View style={[miniStyles.barFill, {
                  width: `${Math.min(weeklyTracking.progressPercent, 100)}%`,
                  backgroundColor: compensationInfo.hasActiveCompensations ? '#A78BFA'
                    : weeklyTracking.progressPercent > 100 ? '#F87171'
                    : weeklyTracking.progressPercent > 80 ? '#FBBF24' : '#4ADE80',
                }]} />
              </View>
              {weeklyTracking.savings.economies > 0 && (
                <View style={miniStyles.savingsRow}>
                  <Award size={12} color={compensationInfo.hasActiveCompensations ? '#A78BFA' : '#4ADE80'} />
                  <Text style={[miniStyles.savingsText, compensationInfo.hasActiveCompensations && { color: '#A78BFA' }]}>
                    {formatCurrency(weeklyTracking.savings.economies)} {t('dashboard.saved')}
                    {weeklyTracking.savings.eprProvision >= weeklyTracking.savings.weeklyTarget
                      ? ` (${t('dashboard.eprReached')})`
                      : ` (EPR ${Math.round((weeklyTracking.savings.eprProvision / weeklyTracking.savings.weeklyTarget) * 100)}%)`
                    }
                  </Text>
                </View>
              )}
              {compensationInfo.hasActiveCompensations && (
                <View style={miniStyles.compensationRow}>
                  <Shield size={12} color="#A78BFA" />
                  <Text style={miniStyles.compensationText}>
                    {t('tracking:compensation.dashboardHint', { amount: formatCurrency(compensationInfo.totalWeeklyReduction) })}
                  </Text>
                </View>
              )}
              {goalsAgg.thisWeekContributions > 0 && (
                <View style={miniStyles.savingsRow}>
                  <Target size={12} color="#22D3EE" />
                  <Text style={[miniStyles.savingsText, { color: '#22D3EE' }]}>
                    {formatCurrency(goalsAgg.thisWeekContributions)} {t('dashboard.goalAllocated')}
                    {goalsAgg.thisWeekAutoContributions > 0
                      && ` (auto ${formatCurrency(goalsAgg.thisWeekAutoContributions)})`}
                  </Text>
                </View>
              )}
            </GlassCard>
          </Pressable>
        )}

        {/* Income vs Expense Card */}
        <IncomeVsExpenseCard />

        <RecentTransactions transactions={recentTransactions} />

        {/* Investment score card (expert + investor) */}
        {showSection(['expert', 'investor']) && <InvestmentCard />}

        {/* Investment summary card (investor only) */}
        {isInvestor && (
          <View style={{ paddingHorizontal: 0 }}>
            <InvestmentSummaryCard onPress={() => router.push('/(tabs)/transactions')} />
          </View>
        )}

        {/* Reset button for testing */}
        <View className="px-6 mt-4 mb-8">
          <Pressable onPress={handleResetAll}>
            <GlassCard className="flex-row justify-center items-center py-4 px-6" style={{ borderColor: '#F87171', borderWidth: 1 }}>
              <RotateCcw size={18} color="#F87171" />
              <Text style={{ color: '#F87171', fontWeight: '600', marginLeft: 8 }}>{t('dashboard.resetTitle')}</Text>
            </GlassCard>
          </Pressable>
        </View>

      </ScrollView>
    </View>
  );
}

const miniStyles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  left: {
    flex: 1,
    marginRight: 8,
  },
  label: {
    color: '#A1A1AA',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  amounts: {
    fontSize: 14,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  percent: {
    fontSize: 16,
    fontWeight: '800',
  },
  barBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
  gradeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginRight: 4,
  },
  gradeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  savingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  savingsText: {
    color: '#4ADE80',
    fontSize: 11,
    fontWeight: '600',
  },
  compensationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  compensationText: {
    color: '#A78BFA',
    fontSize: 11,
    fontWeight: '600',
  },
});
