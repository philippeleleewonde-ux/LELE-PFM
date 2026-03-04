import React, { useState, useMemo } from 'react';
import { View, Text, Modal, Pressable, TextInput, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import {
  X, TrendingUp, TrendingDown, BarChart3, Globe, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Minus, CheckCircle, RefreshCw,
} from 'lucide-react-native';
import { PF } from '@/components/performance/shared';
import {
  SelectedAsset,
  CheckInRecord,
  AssetSnapshot,
  MarketIndicators,
  MarketSentiment,
  MarketEventImpact,
  MarketEvent,
  StrategyRecommendationResult,
  InvestmentStrategy,
} from '@/types/investor-journey';
import { evaluateStrategyAdjustment } from '@/domain/calculators/strategy-generator';

// ─── Types ───

interface CheckInModalProps {
  visible: boolean;
  onClose: () => void;
  assets: SelectedAsset[];
  onSubmit: (checkIn: CheckInRecord) => void;
  chosenStrategy?: InvestmentStrategy | null;
  allStrategies?: InvestmentStrategy[];
  previousCheckIns?: CheckInRecord[];
  projectedValue?: number;
  durationMonths?: number;
}

interface AssetEntry {
  assetId: string;
  name: string;
  invested: string;
  currentValue: string;
}

type CheckInStep = 'portfolio' | 'market' | 'report';

// ─── Market Data Constants ───

const SENTIMENT_OPTIONS: { value: MarketSentiment; label: string; emoji: string; color: string }[] = [
  { value: 'very_bearish', label: 'Tres negatif', emoji: '📉', color: PF.red },
  { value: 'bearish', label: 'Negatif', emoji: '🔻', color: '#FB923C' },
  { value: 'neutral', label: 'Neutre', emoji: '➖', color: PF.textSecondary },
  { value: 'bullish', label: 'Positif', emoji: '🔺', color: '#86EFAC' },
  { value: 'very_bullish', label: 'Tres positif', emoji: '📈', color: PF.green },
];

const TREND_OPTIONS = [
  { value: 'rising', label: 'En hausse', icon: ArrowUpRight },
  { value: 'stable', label: 'Stable', icon: Minus },
  { value: 'falling', label: 'En baisse', icon: ArrowDownRight },
] as const;

const CURRENCY_OPTIONS = [
  { value: 'weakening', label: 'Affaiblissement' },
  { value: 'stable', label: 'Stable' },
  { value: 'strengthening', label: 'Renforcement' },
] as const;

const IMPACT_OPTIONS: { value: MarketEventImpact; label: string; color: string }[] = [
  { value: 'very_negative', label: 'Tres negatif', color: PF.red },
  { value: 'negative', label: 'Negatif', color: '#FB923C' },
  { value: 'neutral', label: 'Neutre', color: PF.textSecondary },
  { value: 'positive', label: 'Positif', color: '#86EFAC' },
  { value: 'very_positive', label: 'Tres positif', color: PF.green },
];

const STRATEGY_NAMES: Record<string, string> = {
  ultra_safe: 'Ultra-prudent',
  safe: 'Prudent',
  balanced: 'Equilibre',
  growth: 'Croissance',
  aggressive: 'Agressif',
};

// ─── Component ───

export function CheckInModal({
  visible,
  onClose,
  assets,
  onSubmit,
  chosenStrategy,
  allStrategies = [],
  previousCheckIns = [],
  projectedValue,
  durationMonths = 60,
}: CheckInModalProps) {
  const [step, setStep] = useState<CheckInStep>('portfolio');
  const [entries, setEntries] = useState<AssetEntry[]>(() =>
    assets.map((a) => ({
      assetId: a.id,
      name: a.name,
      invested: '',
      currentValue: '',
    })),
  );
  const [notes, setNotes] = useState('');
  const { width } = useWindowDimensions();
  const isNarrow = width < 500;

  // Market indicators state
  const [sentiment, setSentiment] = useState<MarketSentiment>('neutral');
  const [inflationTrend, setInflationTrend] = useState<'rising' | 'stable' | 'falling'>('stable');
  const [interestRateTrend, setInterestRateTrend] = useState<'rising' | 'stable' | 'falling'>('stable');
  const [currencyStrength, setCurrencyStrength] = useState<'weakening' | 'stable' | 'strengthening'>('stable');
  const [marketEvents, setMarketEvents] = useState<MarketEvent[]>([]);
  const [newEventDesc, setNewEventDesc] = useState('');
  const [newEventImpact, setNewEventImpact] = useState<MarketEventImpact>('neutral');

  // Strategy recommendation result
  const [recommendation, setRecommendation] = useState<StrategyRecommendationResult | null>(null);

  const updateEntry = (idx: number, field: 'invested' | 'currentValue', value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, '');
    setEntries((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: cleaned };
      return next;
    });
  };

  const computePerformance = (invested: string, current: string): number => {
    const inv = parseFloat(invested) || 0;
    const cur = parseFloat(current) || 0;
    if (inv <= 0) return 0;
    return ((cur - inv) / inv) * 100;
  };

  const totals = useMemo(() => {
    let totalInvested = 0;
    let totalValue = 0;
    for (const e of entries) {
      totalInvested += parseFloat(e.invested) || 0;
      totalValue += parseFloat(e.currentValue) || 0;
    }
    const perf = totalInvested > 0 ? ((totalValue - totalInvested) / totalInvested) * 100 : 0;
    return { totalInvested, totalValue, perf };
  }, [entries]);

  const isPortfolioValid = entries.some(
    (e) => (parseFloat(e.invested) || 0) > 0 && (parseFloat(e.currentValue) || 0) > 0,
  );

  const addMarketEvent = () => {
    if (!newEventDesc.trim()) return;
    setMarketEvents((prev) => [...prev, { description: newEventDesc.trim(), impact: newEventImpact }]);
    setNewEventDesc('');
    setNewEventImpact('neutral');
  };

  const removeMarketEvent = (idx: number) => {
    setMarketEvents((prev) => prev.filter((_, i) => i !== idx));
  };

  const buildMarketIndicators = (): MarketIndicators => ({
    sentiment,
    inflationTrend,
    interestRateTrend,
    currencyStrength,
    events: marketEvents,
  });

  const goToMarket = () => setStep('market');

  const goToReport = () => {
    // Run strategy re-evaluation
    if (chosenStrategy && allStrategies.length > 0) {
      const indicators = buildMarketIndicators();
      const result = evaluateStrategyAdjustment(
        chosenStrategy.id,
        allStrategies,
        indicators,
        previousCheckIns,
        durationMonths,
      );
      setRecommendation(result);
    }
    setStep('report');
  };

  const handleSubmit = () => {
    const snapshots: AssetSnapshot[] = entries.map((e) => {
      const inv = parseFloat(e.invested) || 0;
      const cur = parseFloat(e.currentValue) || 0;
      const asset = assets.find((a) => a.id === e.assetId);
      return {
        assetId: e.assetId,
        assetClass: asset?.assetClass ?? 'savings_account',
        name: e.name,
        currentValue: cur,
        amountInvested: inv,
        performance: inv > 0 ? Math.round(((cur - inv) / inv) * 10000) / 100 : 0,
      };
    });

    const checkIn: CheckInRecord = {
      id: `ci_${Date.now()}`,
      date: new Date().toISOString(),
      status: 'completed',
      assetSnapshots: snapshots,
      totalPortfolioValue: Math.round(totals.totalValue),
      totalInvested: Math.round(totals.totalInvested),
      overallPerformance: Math.round(totals.perf * 100) / 100,
      notes: notes.trim() || undefined,
      marketIndicators: buildMarketIndicators(),
      strategyRecommendation: recommendation ?? undefined,
    };

    onSubmit(checkIn);
    // Reset
    setEntries(assets.map((a) => ({ assetId: a.id, name: a.name, invested: '', currentValue: '' })));
    setNotes('');
    setSentiment('neutral');
    setInflationTrend('stable');
    setInterestRateTrend('stable');
    setCurrencyStrength('stable');
    setMarketEvents([]);
    setRecommendation(null);
    setStep('portfolio');
    onClose();
  };

  const stepTitles: Record<CheckInStep, string> = {
    portfolio: 'Bilan portefeuille',
    market: 'Donnees de marche',
    report: 'Rapport d\'execution',
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={[styles.modalContent, { padding: isNarrow ? 14 : 20 }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{stepTitles[step]}</Text>
            <View style={styles.headerRight}>
              {/* Step indicator */}
              <View style={styles.stepIndicator}>
                {(['portfolio', 'market', 'report'] as CheckInStep[]).map((s, i) => (
                  <View
                    key={s}
                    style={[
                      styles.stepDot,
                      step === s && styles.stepDotActive,
                      (['portfolio', 'market', 'report'] as CheckInStep[]).indexOf(step) > i && styles.stepDotDone,
                    ]}
                  />
                ))}
              </View>
              <Pressable onPress={onClose} hitSlop={8}>
                <X size={22} color={PF.textSecondary} />
              </Pressable>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
            {/* ──── Step 1: Portfolio Data ──── */}
            {step === 'portfolio' && (
              <>
                <Text style={styles.stepDesc}>
                  Saisissez les montants actuels de vos investissements
                </Text>

                {entries.map((entry, idx) => {
                  const perf = computePerformance(entry.invested, entry.currentValue);
                  const isPositive = perf >= 0;
                  return (
                    <View key={entry.assetId} style={styles.assetCard}>
                      <Text style={styles.assetName}>{entry.name}</Text>
                      <View style={[styles.inputRow, { flexDirection: isNarrow ? 'column' : 'row' }]}>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Montant investi</Text>
                          <TextInput
                            style={styles.input}
                            value={entry.invested}
                            onChangeText={(v) => updateEntry(idx, 'invested', v)}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor={PF.textMuted}
                          />
                        </View>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Valeur actuelle</Text>
                          <TextInput
                            style={styles.input}
                            value={entry.currentValue}
                            onChangeText={(v) => updateEntry(idx, 'currentValue', v)}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor={PF.textMuted}
                          />
                        </View>
                      </View>
                      {(parseFloat(entry.invested) || 0) > 0 && (
                        <View style={styles.perfRow}>
                          {isPositive ? <TrendingUp size={14} color={PF.green} /> : <TrendingDown size={14} color={PF.red} />}
                          <Text style={[styles.perfText, { color: isPositive ? PF.green : PF.red }]}>
                            {isPositive ? '+' : ''}{perf.toFixed(2)}%
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}

                {/* Total */}
                <View style={styles.totalCard}>
                  <Text style={styles.totalLabel}>Valeur totale du portefeuille</Text>
                  <Text style={styles.totalValue}>{totals.totalValue.toLocaleString()} FCFA</Text>
                  <View style={styles.perfRow}>
                    <Text style={styles.totalSubLabel}>Investi : {totals.totalInvested.toLocaleString()} FCFA</Text>
                    <Text style={[styles.totalPerf, { color: totals.perf >= 0 ? PF.green : PF.red }]}>
                      {totals.perf >= 0 ? '+' : ''}{totals.perf.toFixed(2)}%
                    </Text>
                  </View>
                  {projectedValue != null && projectedValue > 0 && (
                    <View style={styles.vsProjectionRow}>
                      <Text style={styles.vsProjectionLabel}>vs Projection</Text>
                      <Text style={[styles.vsProjectionValue, {
                        color: totals.totalValue >= projectedValue ? PF.green : PF.red,
                      }]}>
                        {totals.totalValue >= projectedValue ? '+' : ''}
                        {projectedValue > 0 ? (((totals.totalValue - projectedValue) / projectedValue) * 100).toFixed(1) : '0'}%
                      </Text>
                    </View>
                  )}
                </View>

                {/* Notes */}
                <View style={styles.notesContainer}>
                  <Text style={styles.inputLabel}>Notes (optionnel)</Text>
                  <TextInput
                    style={styles.notesInput}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Remarques, observations..."
                    placeholderTextColor={PF.textMuted}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </>
            )}

            {/* ──── Step 2: Market Data ──── */}
            {step === 'market' && (
              <>
                <Text style={styles.stepDesc}>
                  Partagez votre perception du marche pour affiner vos recommandations
                </Text>

                {/* Sentiment */}
                <View style={styles.marketSection}>
                  <View style={styles.marketSectionHeader}>
                    <Globe size={16} color={PF.blue} />
                    <Text style={styles.marketSectionTitle}>Sentiment general du marche</Text>
                  </View>
                  <View style={styles.optionsRow}>
                    {SENTIMENT_OPTIONS.map((opt) => (
                      <Pressable
                        key={opt.value}
                        onPress={() => setSentiment(opt.value)}
                        style={[
                          styles.optionChip,
                          sentiment === opt.value && { backgroundColor: opt.color + '20', borderColor: opt.color + '50' },
                        ]}
                      >
                        <Text style={[styles.optionChipText, sentiment === opt.value && { color: opt.color }]}>
                          {opt.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Inflation trend */}
                <View style={styles.marketSection}>
                  <Text style={styles.marketSectionTitle}>Tendance inflation</Text>
                  <View style={styles.optionsRow}>
                    {TREND_OPTIONS.map((opt) => (
                      <Pressable
                        key={opt.value}
                        onPress={() => setInflationTrend(opt.value)}
                        style={[
                          styles.optionChip,
                          inflationTrend === opt.value && styles.optionChipActive,
                        ]}
                      >
                        <Text style={[styles.optionChipText, inflationTrend === opt.value && styles.optionChipTextActive]}>
                          {opt.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Interest rate trend */}
                <View style={styles.marketSection}>
                  <Text style={styles.marketSectionTitle}>Tendance taux d'interet</Text>
                  <View style={styles.optionsRow}>
                    {TREND_OPTIONS.map((opt) => (
                      <Pressable
                        key={opt.value}
                        onPress={() => setInterestRateTrend(opt.value)}
                        style={[
                          styles.optionChip,
                          interestRateTrend === opt.value && styles.optionChipActive,
                        ]}
                      >
                        <Text style={[styles.optionChipText, interestRateTrend === opt.value && styles.optionChipTextActive]}>
                          {opt.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Currency strength */}
                <View style={styles.marketSection}>
                  <Text style={styles.marketSectionTitle}>Force de la devise</Text>
                  <View style={styles.optionsRow}>
                    {CURRENCY_OPTIONS.map((opt) => (
                      <Pressable
                        key={opt.value}
                        onPress={() => setCurrencyStrength(opt.value)}
                        style={[
                          styles.optionChip,
                          currencyStrength === opt.value && styles.optionChipActive,
                        ]}
                      >
                        <Text style={[styles.optionChipText, currencyStrength === opt.value && styles.optionChipTextActive]}>
                          {opt.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Market Events */}
                <View style={styles.marketSection}>
                  <View style={styles.marketSectionHeader}>
                    <AlertTriangle size={16} color={PF.orange} />
                    <Text style={styles.marketSectionTitle}>Evenements de marche</Text>
                  </View>

                  {marketEvents.map((event, idx) => {
                    const impactOpt = IMPACT_OPTIONS.find((o) => o.value === event.impact);
                    return (
                      <View key={idx} style={styles.eventItem}>
                        <View style={styles.eventContent}>
                          <Text style={styles.eventDesc}>{event.description}</Text>
                          <Text style={[styles.eventImpact, { color: impactOpt?.color }]}>
                            {impactOpt?.label}
                          </Text>
                        </View>
                        <Pressable onPress={() => removeMarketEvent(idx)} hitSlop={8}>
                          <X size={16} color={PF.textMuted} />
                        </Pressable>
                      </View>
                    );
                  })}

                  {/* Add event */}
                  <TextInput
                    style={styles.input}
                    value={newEventDesc}
                    onChangeText={setNewEventDesc}
                    placeholder="Ex: Hausse du prix du petrole..."
                    placeholderTextColor={PF.textMuted}
                  />
                  <View style={styles.eventAddRow}>
                    <View style={styles.impactPicker}>
                      {IMPACT_OPTIONS.map((opt) => (
                        <Pressable
                          key={opt.value}
                          onPress={() => setNewEventImpact(opt.value)}
                          style={[
                            styles.impactDot,
                            { backgroundColor: opt.color + '20', borderColor: opt.color + '40' },
                            newEventImpact === opt.value && { backgroundColor: opt.color + '50', borderColor: opt.color },
                          ]}
                        >
                          <Text style={[styles.impactDotText, { color: opt.color }]}>
                            {opt.label.charAt(0)}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                    <Pressable onPress={addMarketEvent} style={styles.addEventBtn}>
                      <Text style={styles.addEventBtnText}>Ajouter</Text>
                    </Pressable>
                  </View>
                </View>
              </>
            )}

            {/* ──── Step 3: Execution Report ──── */}
            {step === 'report' && (
              <>
                <Text style={styles.stepDesc}>
                  Rapport d'execution base sur vos donnees et les conditions de marche
                </Text>

                {/* Portfolio Summary */}
                <View style={styles.reportCard}>
                  <View style={styles.reportCardHeader}>
                    <BarChart3 size={16} color={PF.accent} />
                    <Text style={styles.reportCardTitle}>Resume portefeuille</Text>
                  </View>
                  <View style={styles.reportGrid}>
                    <View style={styles.reportGridItem}>
                      <Text style={styles.reportGridLabel}>Investi</Text>
                      <Text style={styles.reportGridValue}>{totals.totalInvested.toLocaleString()}</Text>
                    </View>
                    <View style={styles.reportGridItem}>
                      <Text style={styles.reportGridLabel}>Valeur actuelle</Text>
                      <Text style={[styles.reportGridValue, { color: PF.accent }]}>
                        {totals.totalValue.toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.reportGridItem}>
                      <Text style={styles.reportGridLabel}>Performance</Text>
                      <Text style={[styles.reportGridValue, { color: totals.perf >= 0 ? PF.green : PF.red }]}>
                        {totals.perf >= 0 ? '+' : ''}{totals.perf.toFixed(2)}%
                      </Text>
                    </View>
                    {projectedValue != null && projectedValue > 0 && (
                      <View style={styles.reportGridItem}>
                        <Text style={styles.reportGridLabel}>vs Projection</Text>
                        <Text style={[styles.reportGridValue, {
                          color: totals.totalValue >= projectedValue ? PF.green : PF.red,
                        }]}>
                          {totals.totalValue >= projectedValue ? 'Au-dessus' : 'En-dessous'}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Market Summary */}
                <View style={styles.reportCard}>
                  <View style={styles.reportCardHeader}>
                    <Globe size={16} color={PF.blue} />
                    <Text style={styles.reportCardTitle}>Conditions de marche</Text>
                  </View>
                  <View style={styles.reportMarketRow}>
                    <Text style={styles.reportMarketLabel}>Sentiment</Text>
                    <Text style={[styles.reportMarketValue, {
                      color: SENTIMENT_OPTIONS.find((o) => o.value === sentiment)?.color,
                    }]}>
                      {SENTIMENT_OPTIONS.find((o) => o.value === sentiment)?.label}
                    </Text>
                  </View>
                  <View style={styles.reportMarketRow}>
                    <Text style={styles.reportMarketLabel}>Inflation</Text>
                    <Text style={styles.reportMarketValue}>
                      {TREND_OPTIONS.find((o) => o.value === inflationTrend)?.label}
                    </Text>
                  </View>
                  <View style={styles.reportMarketRow}>
                    <Text style={styles.reportMarketLabel}>Taux d'interet</Text>
                    <Text style={styles.reportMarketValue}>
                      {TREND_OPTIONS.find((o) => o.value === interestRateTrend)?.label}
                    </Text>
                  </View>
                  <View style={styles.reportMarketRow}>
                    <Text style={styles.reportMarketLabel}>Devise</Text>
                    <Text style={styles.reportMarketValue}>
                      {CURRENCY_OPTIONS.find((o) => o.value === currencyStrength)?.label}
                    </Text>
                  </View>
                  {marketEvents.length > 0 && (
                    <Text style={styles.reportEventsCount}>
                      {marketEvents.length} evenement{marketEvents.length > 1 ? 's' : ''} signale{marketEvents.length > 1 ? 's' : ''}
                    </Text>
                  )}
                </View>

                {/* Strategy Recommendation */}
                {recommendation && (
                  <View style={[
                    styles.reportCard,
                    recommendation.shouldRebalance
                      ? { borderColor: PF.orange + '40' }
                      : { borderColor: PF.green + '40' },
                  ]}>
                    <View style={styles.reportCardHeader}>
                      {recommendation.shouldRebalance ? (
                        <RefreshCw size={16} color={PF.orange} />
                      ) : (
                        <CheckCircle size={16} color={PF.green} />
                      )}
                      <Text style={styles.reportCardTitle}>
                        {recommendation.shouldRebalance
                          ? 'Ajustement recommande'
                          : 'Strategie validee'
                        }
                      </Text>
                    </View>

                    {recommendation.shouldRebalance && recommendation.suggestedStrategyId && (
                      <View style={styles.suggestedStrategy}>
                        <Text style={styles.suggestedLabel}>Nouvelle strategie suggeree :</Text>
                        <Text style={styles.suggestedName}>
                          {STRATEGY_NAMES[recommendation.suggestedStrategyId] ?? recommendation.suggestedStrategyId}
                        </Text>
                      </View>
                    )}

                    {/* Risk gauge */}
                    <View style={styles.riskGauge}>
                      <Text style={styles.riskGaugeLabel}>Niveau de risque detecte</Text>
                      <View style={styles.riskBar}>
                        <View style={[
                          styles.riskBarFill,
                          {
                            width: `${recommendation.riskScore}%`,
                            backgroundColor: recommendation.riskScore > 70 ? PF.red
                              : recommendation.riskScore > 40 ? PF.orange
                              : PF.green,
                          },
                        ]} />
                      </View>
                      <Text style={styles.riskScoreText}>{recommendation.riskScore}/100</Text>
                    </View>

                    {/* Projected impact */}
                    <View style={styles.impactGrid}>
                      <View style={styles.impactItem}>
                        <Text style={[styles.impactLabel, { color: PF.red }]}>Pessimiste</Text>
                        <Text style={[styles.impactValue, { color: PF.red }]}>
                          {recommendation.projectedImpact.pessimistic.toFixed(1)}%
                        </Text>
                      </View>
                      <View style={styles.impactItem}>
                        <Text style={[styles.impactLabel, { color: PF.accent }]}>Attendu</Text>
                        <Text style={[styles.impactValue, { color: PF.accent }]}>
                          {recommendation.projectedImpact.expected.toFixed(1)}%
                        </Text>
                      </View>
                      <View style={styles.impactItem}>
                        <Text style={[styles.impactLabel, { color: PF.green }]}>Optimiste</Text>
                        <Text style={[styles.impactValue, { color: PF.green }]}>
                          {recommendation.projectedImpact.optimistic.toFixed(1)}%
                        </Text>
                      </View>
                    </View>

                    {/* Reasons */}
                    {recommendation.adjustmentReasons.length > 0 && (
                      <View style={styles.reasonsList}>
                        <Text style={styles.reasonsTitle}>Analyse :</Text>
                        {recommendation.adjustmentReasons.map((reason, idx) => (
                          <View key={idx} style={styles.reasonItem}>
                            <Text style={styles.reasonBullet}>•</Text>
                            <Text style={styles.reasonText}>{reason}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </>
            )}
          </ScrollView>

          {/* Navigation buttons */}
          <View style={styles.navRow}>
            {step !== 'portfolio' && (
              <Pressable
                onPress={() => setStep(step === 'report' ? 'market' : 'portfolio')}
                style={styles.backBtn}
              >
                <Text style={styles.backBtnText}>Retour</Text>
              </Pressable>
            )}
            <Pressable
              onPress={step === 'portfolio' ? goToMarket : step === 'market' ? goToReport : handleSubmit}
              disabled={step === 'portfolio' && !isPortfolioValid}
              style={[
                styles.submitBtn,
                step === 'portfolio' && !isPortfolioValid && styles.submitBtnDisabled,
                step !== 'portfolio' && { flex: 1 },
              ]}
            >
              <Text style={styles.submitText}>
                {step === 'portfolio' ? 'Suivant : Donnees marche' :
                 step === 'market' ? 'Voir le rapport' :
                 'Enregistrer le bilan'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#1A1C23', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '90%', maxWidth: 600, alignSelf: 'center', width: '100%',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerTitle: { color: PF.textPrimary, fontSize: 18, fontWeight: '700' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepIndicator: { flexDirection: 'row', gap: 6 },
  stepDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  stepDotActive: { backgroundColor: PF.accent, width: 20 },
  stepDotDone: { backgroundColor: PF.green },
  scroll: { marginBottom: 12 },
  stepDesc: { color: PF.textSecondary, fontSize: 12, lineHeight: 18, marginBottom: 14 },

  // Portfolio step
  assetCard: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 12,
    marginBottom: 10, borderWidth: 1, borderColor: PF.border,
  },
  assetName: { color: PF.textPrimary, fontSize: 14, fontWeight: '600', marginBottom: 10 },
  inputRow: { gap: 10 },
  inputGroup: { flex: 1, gap: 4 },
  inputLabel: { color: PF.textSecondary, fontSize: 11, fontWeight: '500' },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    color: PF.textPrimary, fontSize: 14, fontWeight: '600',
    borderWidth: 1, borderColor: PF.border,
  },
  perfRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  perfText: { fontSize: 13, fontWeight: '700' },
  totalCard: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 16,
    marginTop: 4, marginBottom: 12, borderWidth: 1, borderColor: PF.accent + '30',
  },
  totalLabel: { color: PF.textSecondary, fontSize: 12, fontWeight: '500' },
  totalValue: { color: PF.accent, fontSize: 22, fontWeight: '800', marginTop: 4 },
  totalSubLabel: { color: PF.textMuted, fontSize: 12, flex: 1 },
  totalPerf: { fontSize: 14, fontWeight: '700' },
  vsProjectionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
  },
  vsProjectionLabel: { color: PF.textMuted, fontSize: 11 },
  vsProjectionValue: { fontSize: 13, fontWeight: '700' },
  notesContainer: { marginBottom: 8, gap: 4 },
  notesInput: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    color: PF.textPrimary, fontSize: 13, borderWidth: 1, borderColor: PF.border,
    minHeight: 60, textAlignVertical: 'top',
  },

  // Market step
  marketSection: { marginBottom: 16 },
  marketSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  marketSectionTitle: { color: PF.textPrimary, fontSize: 13, fontWeight: '600', marginBottom: 6 },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  optionChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: PF.border,
  },
  optionChipActive: { backgroundColor: PF.accent + '20', borderColor: PF.accent + '50' },
  optionChipText: { color: PF.textSecondary, fontSize: 12, fontWeight: '500' },
  optionChipTextActive: { color: PF.accent },
  eventItem: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 8,
    padding: 10, marginBottom: 6,
  },
  eventContent: { flex: 1 },
  eventDesc: { color: PF.textPrimary, fontSize: 12 },
  eventImpact: { fontSize: 10, fontWeight: '600', marginTop: 2 },
  eventAddRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  impactPicker: { flexDirection: 'row', gap: 4, flex: 1 },
  impactDot: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
  },
  impactDotText: { fontSize: 10, fontWeight: '700' },
  addEventBtn: {
    backgroundColor: PF.accent + '20', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8,
  },
  addEventBtnText: { color: PF.accent, fontSize: 12, fontWeight: '600' },

  // Report step
  reportCard: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 14,
    marginBottom: 12, borderWidth: 1, borderColor: PF.border,
  },
  reportCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  reportCardTitle: { color: PF.textPrimary, fontSize: 14, fontWeight: '700' },
  reportGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  reportGridItem: {
    width: '46%', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 10,
  },
  reportGridLabel: { color: PF.textMuted, fontSize: 10, fontWeight: '500', textTransform: 'uppercase' },
  reportGridValue: { color: PF.textPrimary, fontSize: 15, fontWeight: '700', marginTop: 4 },
  reportMarketRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  reportMarketLabel: { color: PF.textSecondary, fontSize: 12 },
  reportMarketValue: { color: PF.textPrimary, fontSize: 12, fontWeight: '600' },
  reportEventsCount: { color: PF.orange, fontSize: 11, fontWeight: '600', marginTop: 8 },
  suggestedStrategy: {
    backgroundColor: PF.orange + '15', borderRadius: 10, padding: 12, marginBottom: 12,
  },
  suggestedLabel: { color: PF.textSecondary, fontSize: 11 },
  suggestedName: { color: PF.orange, fontSize: 16, fontWeight: '800', marginTop: 4 },
  riskGauge: { marginBottom: 12 },
  riskGaugeLabel: { color: PF.textSecondary, fontSize: 11, marginBottom: 6 },
  riskBar: {
    height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden',
  },
  riskBarFill: { height: '100%', borderRadius: 3 },
  riskScoreText: { color: PF.textMuted, fontSize: 10, marginTop: 4, textAlign: 'right' },
  impactGrid: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  impactItem: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 8,
    padding: 10, alignItems: 'center', gap: 4,
  },
  impactLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  impactValue: { fontSize: 15, fontWeight: '800' },
  reasonsList: { gap: 4 },
  reasonsTitle: { color: PF.textPrimary, fontSize: 12, fontWeight: '600', marginBottom: 4 },
  reasonItem: { flexDirection: 'row', gap: 6 },
  reasonBullet: { color: PF.textMuted, fontSize: 12 },
  reasonText: { color: PF.textSecondary, fontSize: 12, flex: 1, lineHeight: 18 },

  // Navigation
  navRow: { flexDirection: 'row', gap: 10 },
  backBtn: {
    borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20,
    borderWidth: 1, borderColor: PF.border, alignItems: 'center',
  },
  backBtnText: { color: PF.textSecondary, fontSize: 14, fontWeight: '600' },
  submitBtn: { flex: 2, backgroundColor: PF.accent, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.4 },
  submitText: { color: '#0F1014', fontSize: 14, fontWeight: '700' },
});
