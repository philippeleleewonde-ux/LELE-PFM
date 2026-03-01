/**
 * Investment Advisor — LELE PFM
 *
 * Rule-based advisory engine. Generates coaching messages
 * after each check-in based on portfolio state and progress.
 * Zero API, zero AI — pure deterministic rules.
 */

import {
  AdvisoryMessage,
  AdvisoryType,
  AdvisorySeverity,
  CheckInRecord,
  SelectedAsset,
  InvestmentStrategy,
  InvestmentDuration,
  ProcedureProgress,
} from '@/types/investor-journey';
import { InvestmentPillar } from '@/types/investment';
import { ASSET_TO_PILLAR } from '@/constants/pillar-mapping';

// ─── Advisory Rules ───

interface AdvisoryContext {
  checkIns: CheckInRecord[];
  selectedAssets: SelectedAsset[];
  chosenStrategy: InvestmentStrategy | null;
  duration: InvestmentDuration | null;
  procedureProgress: Record<string, ProcedureProgress>;
  weeklySurplus?: number;
  journeyStartedAt: string | null;
}

/**
 * Generate advisory messages based on current portfolio state.
 */
export function generateAdvisories(ctx: AdvisoryContext): AdvisoryMessage[] {
  const messages: AdvisoryMessage[] = [];
  const now = new Date();

  // Run all rule checks
  messages.push(...checkPillarDrift(ctx));
  messages.push(...checkPerformanceAlerts(ctx));
  messages.push(...checkMilestones(ctx));
  messages.push(...checkSavingsOpportunity(ctx));
  messages.push(...checkMissedCheckIns(ctx));
  messages.push(...checkDurationMilestones(ctx, now));
  messages.push(...checkProcedureNudges(ctx, now));

  return messages;
}

// ─── Rule: Pillar Drift > 10% ───

function checkPillarDrift(ctx: AdvisoryContext): AdvisoryMessage[] {
  const messages: AdvisoryMessage[] = [];
  const latestCheckIn = ctx.checkIns[ctx.checkIns.length - 1];
  if (!latestCheckIn || latestCheckIn.assetSnapshots.length === 0) return messages;
  if (!ctx.chosenStrategy) return messages;

  // Compute actual pillar weights from latest check-in
  const totalValue = latestCheckIn.totalPortfolioValue;
  if (totalValue <= 0) return messages;

  const actualWeights: Record<InvestmentPillar, number> = {
    croissance: 0, amortisseur: 0, refuge: 0, base_arriere: 0,
  };

  for (const snap of latestCheckIn.assetSnapshots) {
    const asset = ctx.selectedAssets.find((a) => a.id === snap.assetId);
    if (!asset) continue;
    const pillar = asset.pillar || ASSET_TO_PILLAR[asset.assetClass];
    if (pillar) {
      actualWeights[pillar] += snap.currentValue / totalValue * 100;
    }
  }

  // Compare with strategy target weights
  for (const pw of ctx.chosenStrategy.pillarWeights) {
    const actual = actualWeights[pw.pillar];
    const drift = Math.abs(actual - pw.weight);
    if (drift > 10) {
      messages.push(makeAdvisory(
        'rebalance',
        'warning',
        'Reequilibrage necessaire',
        `Le pilier ${pw.pillar} derive de ${Math.round(drift)}% (${Math.round(actual)}% vs ${pw.weight}% cible). Ajustez vos allocations.`,
        { pillar: pw.pillar, drift: Math.round(drift), actual: Math.round(actual), target: pw.weight },
      ));
    }
  }

  return messages;
}

// ─── Rule: Performance Alert ───

function checkPerformanceAlerts(ctx: AdvisoryContext): AdvisoryMessage[] {
  const messages: AdvisoryMessage[] = [];
  const latestCheckIn = ctx.checkIns[ctx.checkIns.length - 1];
  if (!latestCheckIn || !ctx.chosenStrategy) return messages;

  const monthsElapsed = ctx.checkIns.length;
  const expectedProjection = ctx.chosenStrategy.projections.find((p) => p.month === monthsElapsed);
  if (!expectedProjection) return messages;

  const actualValue = latestCheckIn.totalPortfolioValue;
  const expectedValue = expectedProjection.value;

  if (expectedValue <= 0) return messages;

  const ratio = actualValue / expectedValue;

  // Under-performing (below pessimistic scenario ~80%)
  if (ratio < 0.8) {
    messages.push(makeAdvisory(
      'performance_alert',
      'warning',
      'Sous-performance detectee',
      `Votre portefeuille (${Math.round(actualValue).toLocaleString()} FCFA) est en dessous de la projection (${Math.round(expectedValue).toLocaleString()} FCFA). Evaluez les alternatives.`,
      { actual: Math.round(actualValue), expected: Math.round(expectedValue), ratio: Math.round(ratio * 100) },
    ));
  }

  // Over-performing (above optimistic scenario ~120%)
  if (ratio > 1.2) {
    messages.push(makeAdvisory(
      'milestone',
      'success',
      'Surperformance!',
      `Bravo! Votre portefeuille (${Math.round(actualValue).toLocaleString()} FCFA) depasse la projection favorable (${Math.round(expectedValue).toLocaleString()} FCFA).`,
      { actual: Math.round(actualValue), expected: Math.round(expectedValue), ratio: Math.round(ratio * 100) },
    ));
  }

  return messages;
}

// ─── Rule: Milestones ───

function checkMilestones(ctx: AdvisoryContext): AdvisoryMessage[] {
  const messages: AdvisoryMessage[] = [];
  const latestCheckIn = ctx.checkIns[ctx.checkIns.length - 1];
  if (!latestCheckIn || !ctx.chosenStrategy) return messages;

  const totalInvested = latestCheckIn.totalInvested;
  const actualValue = latestCheckIn.totalPortfolioValue;
  const returns = actualValue - totalInvested;

  // First positive returns
  if (ctx.checkIns.length === 1 && returns > 0) {
    messages.push(makeAdvisory(
      'milestone',
      'success',
      'Premiers rendements!',
      `Felicitations! Vos premiers gains sont de +${Math.round(returns).toLocaleString()} FCFA. Continuez sur cette lancee.`,
      { returns: Math.round(returns) },
    ));
  }

  return messages;
}

// ─── Rule: Savings Opportunity ───

function checkSavingsOpportunity(ctx: AdvisoryContext): AdvisoryMessage[] {
  const messages: AdvisoryMessage[] = [];

  if (ctx.weeklySurplus && ctx.weeklySurplus > 0) {
    messages.push(makeAdvisory(
      'savings_opportunity',
      'info',
      'Surplus disponible',
      `Vous avez un surplus de ${Math.round(ctx.weeklySurplus).toLocaleString()} FCFA cette semaine. Pensez a renforcer votre portefeuille.`,
      { surplus: Math.round(ctx.weeklySurplus) },
    ));
  }

  return messages;
}

// ─── Rule: Missed Check-ins ───

function checkMissedCheckIns(ctx: AdvisoryContext): AdvisoryMessage[] {
  const messages: AdvisoryMessage[] = [];

  const missed = ctx.checkIns.filter((c) => c.status === 'missed');
  const recentMissed = missed.slice(-3);

  if (recentMissed.length >= 2) {
    messages.push(makeAdvisory(
      'risk_warning',
      'urgent',
      'Bilans manques',
      `Vous avez manque ${recentMissed.length} bilans recemment. Le suivi regulier est la cle du succes.`,
      { count: recentMissed.length },
    ));
  }

  return messages;
}

// ─── Rule: Duration Milestones ───

function checkDurationMilestones(ctx: AdvisoryContext, now: Date): AdvisoryMessage[] {
  const messages: AdvisoryMessage[] = [];
  if (!ctx.duration || !ctx.journeyStartedAt) return messages;

  const startDate = new Date(ctx.journeyStartedAt);
  const elapsed = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
  const totalMonths = ctx.duration.months;

  const milestones = [0.25, 0.5, 0.75, 1.0];
  for (const m of milestones) {
    const threshold = totalMonths * m;
    if (Math.abs(elapsed - threshold) < 15) { // Within 15 days of milestone
      const latestCheckIn = ctx.checkIns[ctx.checkIns.length - 1];
      const performance = latestCheckIn?.overallPerformance ?? 0;

      messages.push(makeAdvisory(
        'milestone',
        'info',
        `${Math.round(m * 100)}% du parcours atteint`,
        `Vous avez parcouru ${Math.round(m * 100)}% de votre horizon d'investissement. Performance globale: ${Math.round(performance)}%.`,
        { percent: Math.round(m * 100), performance: Math.round(performance) },
      ));
      break; // Only one milestone at a time
    }
  }

  return messages;
}

// ─── Rule: Procedure Nudges ───

function checkProcedureNudges(ctx: AdvisoryContext, now: Date): AdvisoryMessage[] {
  const messages: AdvisoryMessage[] = [];

  for (const [assetId, progress] of Object.entries(ctx.procedureProgress)) {
    const lastUpdate = new Date(progress.lastUpdatedAt);
    const daysSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceUpdate > 30) {
      const asset = ctx.selectedAssets.find((a) => a.id === assetId);
      messages.push(makeAdvisory(
        'procedure_nudge',
        'info',
        'Procedure en attente',
        `L'etape pour ${asset?.name ?? assetId} n'a pas progresse depuis ${Math.round(daysSinceUpdate)} jours. Relancez la demarche.`,
        { assetName: asset?.name ?? assetId, days: Math.round(daysSinceUpdate) },
      ));
    }
  }

  return messages;
}

// ─── Advisory Factory ───

let advisoryIdCounter = 0;

function makeAdvisory(
  type: AdvisoryType,
  severity: AdvisorySeverity,
  titleKey: string,
  messageKey: string,
  messageParams?: Record<string, string | number>,
): AdvisoryMessage {
  return {
    id: `adv_${Date.now()}_${++advisoryIdCounter}`,
    type,
    severity,
    titleKey,
    messageKey,
    messageParams,
    createdAt: new Date().toISOString(),
    dismissed: false,
  };
}
