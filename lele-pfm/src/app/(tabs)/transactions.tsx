import React, { useState, useCallback, useRef } from 'react';
import { View, ScrollView, Text, Pressable, Animated, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Plus, X, ArrowUpRight, ArrowDownLeft, Wand2, Shield, Target, Mic } from 'lucide-react-native';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useEngineStore } from '@/stores/engine-store';
import { useTransactionStore } from '@/stores/transaction-store';
import { useWeeklyTracking, CategoryTracking } from '@/hooks/useWeeklyTracking';
import { useWeeklyIncome, IncomeSourceTracking } from '@/hooks/useWeeklyIncome';
import { getCurrentWeek } from '@/utils/week-helpers';
import { COICOPCode } from '@/types';
import { IncomeCode } from '@/constants/income-categories';
import { generateDemoTransactions } from '@/services/demo-transactions-generator';
import { useSavingsGoalStore, type SavingsGoal } from '@/stores/savings-goal-store';

import { WeekNavigator } from '@/components/tracking/WeekNavigator';
import { WeeklyProgressCard } from '@/components/tracking/WeeklyProgressCard';
import { CategoryProgressRow } from '@/components/tracking/CategoryProgressRow';
import { CategoryDetailSheet } from '@/components/tracking/CategoryDetailSheet';
import { AddTransactionModal } from '@/components/tracking/AddTransactionModal';
import { WeeklySummaryCard } from '@/components/tracking/WeeklySummaryCard';
import { SavingsWalletCard } from '@/components/tracking/SavingsWalletCard';
import { InvestmentWalletCard } from '@/components/tracking/InvestmentWalletCard';
import { WeeklyIncomeCard } from '@/components/tracking/WeeklyIncomeCard';
import { IncomeProgressRow } from '@/components/tracking/IncomeProgressRow';
import { IncomeDetailSheet } from '@/components/tracking/IncomeDetailSheet';
import { AddIncomeModal } from '@/components/tracking/AddIncomeModal';
import { GlassCard } from '@/components/ui/GlassCard';
import { ImpulseCheckModal } from '@/components/impulse/ImpulseCheckModal';
import { useViewMode } from '@/hooks/useViewMode';
import { SavingsGoalsSection } from '@/components/tracking/SavingsGoalsSection';
import { GoalExpensesSection } from '@/components/tracking/GoalExpensesSection';
import { CreateGoalModal } from '@/components/tracking/CreateGoalModal';
import { ContributeGoalModal } from '@/components/tracking/ContributeGoalModal';
import { GoalDetailSheet } from '@/components/tracking/GoalDetailSheet';
import { GoalMaturityModal } from '@/components/tracking/GoalMaturityModal';
import { WeeklyChallengeCard } from '@/components/tracking/WeeklyChallengeCard';
import { ActiveCompensationCard } from '@/components/tracking/ActiveCompensationCard';
import { VoiceExpenseModal } from '@/components/tracking/VoiceExpenseModal';
import { usePlanProvisioning } from '@/hooks/usePlanProvisioning';

function TransactionsScreenInner() {
  const { t } = useTranslation('app');
  const engineOutput = useEngineStore((s) => s.engineOutput);
  const currency = useEngineStore((s) => s.currency);
  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const { currentWeek, currentYear, setCurrentWeek } = useTransactionStore();
  const { week: nowWeek, year: nowYear } = getCurrentWeek();
  const { isInvestor } = useViewMode();

  const tracking = useWeeklyTracking(currentWeek, currentYear);
  const incomeData = useWeeklyIncome(currentWeek, currentYear);

  // Sinking Fund / Standing Order / DCA — always runs regardless of expenses
  const { catchUpBanner } = usePlanProvisioning(currentWeek, currentYear, tracking.effectiveBudget);

  // Expense modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [detailCategory, setDetailCategory] = useState<CategoryTracking | null>(null);
  const [defaultCategory, setDefaultCategory] = useState<COICOPCode | undefined>(undefined);

  // Income modals
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [detailIncome, setDetailIncome] = useState<IncomeSourceTracking | null>(null);
  const [defaultSource, setDefaultSource] = useState<IncomeCode | undefined>(undefined);

  // Impulse check modal
  const [showImpulseCheck, setShowImpulseCheck] = useState(false);

  // Voice expense modal
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  // Goal modals
  const [showCreateGoal, setShowCreateGoal] = useState(false);
  const [contributeGoal, setContributeGoal] = useState<SavingsGoal | null>(null);
  const [detailGoalId, setDetailGoalId] = useState<string | null>(null);
  const [maturityGoal, setMaturityGoal] = useState<SavingsGoal | null>(null);

  // Expandable FAB
  const [fabExpanded, setFabExpanded] = useState(false);
  const fabAnim = useRef(new Animated.Value(0)).current;

  const toggleFab = useCallback(() => {
    const toValue = fabExpanded ? 0 : 1;
    Animated.spring(fabAnim, {
      toValue,
      friction: 6,
      tension: 80,
      useNativeDriver: false,
    }).start();
    setFabExpanded(!fabExpanded);
  }, [fabExpanded, fabAnim]);

  const handlePrevWeek = useCallback(() => {
    if (currentWeek <= 1) {
      setCurrentWeek(52, currentYear - 1);
    } else {
      setCurrentWeek(currentWeek - 1, currentYear);
    }
  }, [currentWeek, currentYear, setCurrentWeek]);

  const handleNextWeek = useCallback(() => {
    if (currentWeek >= 52) {
      setCurrentWeek(1, currentYear + 1);
    } else {
      setCurrentWeek(currentWeek + 1, currentYear);
    }
  }, [currentWeek, currentYear, setCurrentWeek]);

  const handleCategoryPress = useCallback((cat: CategoryTracking) => {
    setDetailCategory(cat);
  }, []);

  const handleAddFromCategory = useCallback(() => {
    if (detailCategory) {
      setDefaultCategory(detailCategory.code);
    }
    setDetailCategory(null);
    setShowAddModal(true);
  }, [detailCategory]);

  const handleIncomeSourcePress = useCallback((src: IncomeSourceTracking) => {
    setDetailIncome(src);
  }, []);

  const handleAddFromIncome = useCallback(() => {
    if (detailIncome) {
      setDefaultSource(detailIncome.code);
    }
    setDetailIncome(null);
    setShowAddIncome(true);
  }, [detailIncome]);

  const handleOpenAddExpense = useCallback(() => {
    setDefaultCategory(undefined);
    setShowAddModal(true);
    if (fabExpanded) toggleFab();
  }, [fabExpanded, toggleFab]);

  const handleOpenAddIncome = useCallback(() => {
    setDefaultSource(undefined);
    setShowAddIncome(true);
    if (fabExpanded) toggleFab();
  }, [fabExpanded, toggleFab]);

  const handleOpenImpulseCheck = useCallback(() => {
    setShowImpulseCheck(true);
    if (fabExpanded) toggleFab();
  }, [fabExpanded, toggleFab]);

  const handleOpenVoiceExpense = useCallback(() => {
    setShowVoiceModal(true);
    if (fabExpanded) toggleFab();
  }, [fabExpanded, toggleFab]);

  const handleOpenCreateGoal = useCallback(() => {
    setShowCreateGoal(true);
    if (fabExpanded) toggleFab();
  }, [fabExpanded, toggleFab]);

  const handleGoalPress = useCallback((goal: SavingsGoal) => {
    setDetailGoalId(goal.id);
  }, []);

  const handleGoalContribute = useCallback((goal: SavingsGoal) => {
    setContributeGoal(goal);
  }, []);

  const handleContributeFromDetail = useCallback(() => {
    if (detailGoalId) {
      const goal = useSavingsGoalStore.getState().goals.find((g) => g.id === detailGoalId);
      if (goal) {
        setDetailGoalId(null);
        setContributeGoal(goal);
      }
    }
  }, [detailGoalId]);

  const handleValidateExpenseFromDetail = useCallback(() => {
    if (detailGoalId) {
      const goal = useSavingsGoalStore.getState().goals.find((g) => g.id === detailGoalId);
      if (goal) {
        setDetailGoalId(null);
        // Small delay to let the detail sheet close before opening maturity modal
        setTimeout(() => setMaturityGoal(goal), 200);
      }
    }
  }, [detailGoalId]);

  const handleGenerateDemo = useCallback(() => {
    if (!engineOutput) return;
    const demoTxs = generateDemoTransactions(engineOutput, currency, currentWeek, currentYear);
    for (const tx of demoTxs) {
      addTransaction(tx);
    }
  }, [engineOutput, currency, currentWeek, currentYear, addTransaction]);

  // Sort categories by progressPercent descending
  const sortedCategories = [...tracking.byCategory].sort(
    (a, b) => b.progressPercent - a.progressPercent
  );

  // No engine output → CTA
  if (!engineOutput) {
    return (
      <View style={styles.container}>
        <View style={styles.ctaContainer}>
          <GlassCard variant="neon" style={styles.ctaCard}>
            <Text style={styles.ctaTitle}>{t('transactions.title')}</Text>
            <Text style={styles.ctaText}>
              {t('transactions.completeWizard')}
            </Text>
          </GlassCard>
        </View>
      </View>
    );
  }

  // FAB animation values
  const expenseTranslateY = fabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -70],
  });
  const incomeTranslateY = fabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -130],
  });
  const impulseTranslateY = fabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -190],
  });
  const goalTranslateY = fabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -250],
  });
  const voiceTranslateY = fabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -310],
  });
  const miniFabOpacity = fabAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.5, 1],
  });
  const miniFabScale = fabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });
  const fabRotation = fabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <View style={styles.container}>
      {/* Background */}
      <View style={styles.bgSpot1} />
      <View style={styles.bgSpot2} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Week Navigator */}
        <WeekNavigator
          week={currentWeek}
          year={currentYear}
          isCurrentWeek={currentWeek === nowWeek && currentYear === nowYear}
          onPrev={handlePrevWeek}
          onNext={handleNextWeek}
        />

        {/* Weekly Challenge */}
        <WeeklyChallengeCard week={currentWeek} year={currentYear} />

        {/* Weekly Progress Card — expenses (effective budget = post-compensation - plan) */}
        <WeeklyProgressCard
          weeklyBudget={tracking.effectiveBudget + tracking.totalPlanCommitment}
          weeklyTarget={tracking.weeklyTarget}
          weeklySpent={tracking.weeklySpent}
          weeklyRemaining={tracking.weeklyRemaining}
          progressPercent={tracking.progressPercent}
          projectedWeekTotal={tracking.projectedWeekTotal}
          isOnTrack={tracking.isOnTrack}
          planYear={tracking.planYear}
          currentQuarter={tracking.currentQuarter}
          hasActiveCompensation={tracking.totalCompensation > 0}
          planCommitment={tracking.totalPlanCommitment}
          effectiveBudget={tracking.effectiveBudget}
        />

        {/* Active Compensation Card */}
        <ActiveCompensationCard week={currentWeek} year={currentYear} />

        {/* Weekly Savings Summary */}
        {tracking.weeklySpent > 0 && (
          <WeeklySummaryCard
            week={currentWeek}
            year={currentYear}
            weeklyBudget={tracking.effectiveBudget}
            weeklyTarget={tracking.weeklyTarget}
            weeklySpent={tracking.weeklySpent}
            savings={tracking.savings}
            planYear={tracking.planYear}
            currentQuarter={tracking.currentQuarter}
            catchUpBanner={catchUpBanner}
            planCommitment={tracking.totalPlanCommitment}
          />
        )}

        {/* Savings Wallet (Tirelire) */}
        <SavingsWalletCard />

        {/* Savings Goals (Objectifs) */}
        <SavingsGoalsSection
          onGoalPress={handleGoalPress}
          onContribute={handleGoalContribute}
        />

        {/* Goal Expenses (validated goal maturity expenses) */}
        <GoalExpensesSection />

        {/* Investment Wallet (investor only) */}
        {isInvestor && <InvestmentWalletCard />}

        {/* Expenses Section */}
        <Text style={styles.sectionTitle}>{t('transactions.expensesTab')}</Text>

        <GlassCard variant="dark" style={styles.categoriesCard}>
          {sortedCategories.map((cat, idx) => (
            <React.Fragment key={cat.code}>
              <CategoryProgressRow
                category={cat}
                onPress={() => handleCategoryPress(cat)}
              />
              {idx < sortedCategories.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </GlassCard>

        {/* Income Section */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>{t('transactions.incomeTab')}</Text>

        <WeeklyIncomeCard
          totalActual={incomeData.totalActualWeekly}
          totalExpected={incomeData.totalExpectedWeekly}
          progressPercent={incomeData.progressPercent}
          isOnTrack={incomeData.isOnTrack}
        />

        {incomeData.bySource.length > 0 && (
          <GlassCard variant="dark" style={styles.categoriesCard}>
            {incomeData.bySource.map((src, idx) => (
              <React.Fragment key={src.code}>
                <IncomeProgressRow
                  source={src}
                  onPress={() => handleIncomeSourcePress(src)}
                />
                {idx < incomeData.bySource.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </GlassCard>
        )}
      </ScrollView>

      {/* Demo FAB */}
      <Pressable onPress={handleGenerateDemo} style={styles.fabDemo}>
        <Wand2 size={20} color="#D9A11B" />
        <Text style={styles.fabDemoText}>{t('transactions.fabDemo')}</Text>
      </Pressable>

      {/* Expandable FAB — mini buttons */}
      {/* Voice mini FAB (orange, mic) */}
      <Animated.View
        style={[
          styles.miniFab,
          {
            transform: [{ translateY: voiceTranslateY }, { scale: miniFabScale }],
            opacity: miniFabOpacity,
          },
        ]}
        pointerEvents={fabExpanded ? 'auto' : 'none'}
      >
        <Pressable onPress={handleOpenVoiceExpense} style={[styles.miniFabBtn, { backgroundColor: '#F97316' }]}>
          <Mic size={20} color="#FFFFFF" />
        </Pressable>
        <Text style={[styles.miniFabLabel, { color: '#F97316' }]}>{t('transactions.fabVoice')}</Text>
      </Animated.View>

      {/* Goal mini FAB (cyan, target) */}
      <Animated.View
        style={[
          styles.miniFab,
          {
            transform: [{ translateY: goalTranslateY }, { scale: miniFabScale }],
            opacity: miniFabOpacity,
          },
        ]}
        pointerEvents={fabExpanded ? 'auto' : 'none'}
      >
        <Pressable onPress={handleOpenCreateGoal} style={[styles.miniFabBtn, { backgroundColor: '#22D3EE' }]}>
          <Target size={20} color="#0F1014" />
        </Pressable>
        <Text style={[styles.miniFabLabel, { color: '#22D3EE' }]}>{t('transactions.fabGoal')}</Text>
      </Animated.View>

      {/* Impulse check mini FAB (violet, shield) */}
      <Animated.View
        style={[
          styles.miniFab,
          {
            transform: [{ translateY: impulseTranslateY }, { scale: miniFabScale }],
            opacity: miniFabOpacity,
          },
        ]}
        pointerEvents={fabExpanded ? 'auto' : 'none'}
      >
        <Pressable onPress={handleOpenImpulseCheck} style={[styles.miniFabBtn, { backgroundColor: '#A78BFA' }]}>
          <Shield size={20} color="#0F1014" />
        </Pressable>
        <Text style={[styles.miniFabLabel, { color: '#A78BFA' }]}>{t('transactions.fabImpulse')}</Text>
      </Animated.View>

      {/* Income mini FAB (green, arrow down-left) */}
      <Animated.View
        style={[
          styles.miniFab,
          {
            transform: [{ translateY: incomeTranslateY }, { scale: miniFabScale }],
            opacity: miniFabOpacity,
          },
        ]}
        pointerEvents={fabExpanded ? 'auto' : 'none'}
      >
        <Pressable onPress={handleOpenAddIncome} style={[styles.miniFabBtn, { backgroundColor: '#4ADE80' }]}>
          <ArrowDownLeft size={20} color="#0F1014" />
        </Pressable>
        <Text style={[styles.miniFabLabel, { color: '#4ADE80' }]}>{t('transactions.fabIncome')}</Text>
      </Animated.View>

      {/* Expense mini FAB (gold, arrow up-right) */}
      <Animated.View
        style={[
          styles.miniFab,
          {
            transform: [{ translateY: expenseTranslateY }, { scale: miniFabScale }],
            opacity: miniFabOpacity,
          },
        ]}
        pointerEvents={fabExpanded ? 'auto' : 'none'}
      >
        <Pressable onPress={handleOpenAddExpense} style={[styles.miniFabBtn, { backgroundColor: '#FBBF24' }]}>
          <ArrowUpRight size={20} color="#0F1014" />
        </Pressable>
        <Text style={[styles.miniFabLabel, { color: '#FBBF24' }]}>{t('transactions.fabExpense')}</Text>
      </Animated.View>

      {/* Main FAB */}
      <Pressable onPress={toggleFab} style={styles.fab}>
        <Animated.View style={{ transform: [{ rotate: fabRotation }] }}>
          <Plus size={28} color="#0F1014" />
        </Animated.View>
      </Pressable>

      {/* Expense Modals */}
      <AddTransactionModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        defaultCategory={defaultCategory}
      />
      <CategoryDetailSheet
        visible={detailCategory !== null}
        category={detailCategory}
        onClose={() => setDetailCategory(null)}
        onAddTransaction={handleAddFromCategory}
      />

      {/* Income Modals */}
      <AddIncomeModal
        visible={showAddIncome}
        onClose={() => setShowAddIncome(false)}
        defaultSource={defaultSource}
      />
      <IncomeDetailSheet
        visible={detailIncome !== null}
        source={detailIncome}
        onClose={() => setDetailIncome(null)}
        onAddIncome={handleAddFromIncome}
      />

      {/* Impulse Check Modal */}
      <ImpulseCheckModal
        visible={showImpulseCheck}
        onClose={() => setShowImpulseCheck(false)}
      />

      {/* Goal Modals */}
      <CreateGoalModal
        visible={showCreateGoal}
        onClose={() => setShowCreateGoal(false)}
      />
      <ContributeGoalModal
        visible={contributeGoal !== null}
        goalId={contributeGoal?.id ?? null}
        goalName={contributeGoal?.name ?? ''}
        remaining={
          contributeGoal
            ? Math.max(0, contributeGoal.targetAmount - contributeGoal.contributions.reduce((s, c) => s + c.amount, 0))
            : 0
        }
        onClose={() => setContributeGoal(null)}
      />
      <GoalDetailSheet
        visible={detailGoalId !== null}
        goalId={detailGoalId}
        onClose={() => setDetailGoalId(null)}
        onContribute={handleContributeFromDetail}
        onValidateExpense={handleValidateExpenseFromDetail}
      />

      {/* Goal Maturity Modal — top level (NOT nested inside another Modal) */}
      {maturityGoal && (
        <GoalMaturityModal
          visible={maturityGoal !== null}
          goal={maturityGoal}
          onClose={() => setMaturityGoal(null)}
        />
      )}

      {/* Voice Expense Modal */}
      <VoiceExpenseModal
        visible={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
      />
    </View>
  );
}

export default function TransactionsScreen() {
  return (
    <ErrorBoundary>
      <TransactionsScreenInner />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1014',
  },
  bgSpot1: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(251,189,35,0.08)',
  },
  bgSpot2: {
    position: 'absolute',
    bottom: 50,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(217,161,27,0.06)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 100,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  sectionTitle: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 24,
    marginBottom: 8,
    marginTop: 4,
  },
  categoriesCard: {
    marginHorizontal: 16,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 16,
  },
  fabDemo: {
    position: 'absolute',
    bottom: 156,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(217,161,27,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(217,161,27,0.3)',
  },
  fabDemoText: {
    color: '#D9A11B',
    fontSize: 12,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FBBF24',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FBBF24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 10,
  },
  miniFab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 9,
  },
  miniFabBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  miniFabLabel: {
    position: 'absolute',
    right: 54,
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: 'rgba(15,16,20,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ctaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  ctaCard: {
    alignItems: 'center',
    padding: 32,
  },
  ctaTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  ctaText: {
    color: '#A1A1AA',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});
