/**
 * FinancialScoreReport — Rapport detaille des 5 leviers du score dynamique
 *
 * Chaque levier affiche ses VRAIS CHIFFRES :
 * - REG : "6 semaines sur 8 avec epargne"
 * - PRE : "Taux d'execution moyen 82%"
 * - SEC : "45 000 FCFA cumules sur 120 000 FCFA d'objectif"
 * - EFF : "85 000 FCFA recus vs 100 000 FCFA prevus"
 * - LIT : "Score EKH 73/100"
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Repeat,
  Target,
  ShieldCheck,
  TrendingUp,
  GraduationCap,
  LucideIcon,
} from 'lucide-react-native';
import { useFinancialScore, LeverScore, LeverDetails } from '@/hooks/useFinancialScore';
import { formatCurrency } from '@/services/format-helpers';
import { PF } from './shared';

// ─── Lever icons ───

const LEVER_ICONS: Record<string, LucideIcon> = {
  REG: Repeat,
  PRE: Target,
  SEC: ShieldCheck,
  EFF: TrendingUp,
  LIT: GraduationCap,
};

const LEVER_NAMES: Record<string, string> = {
  REG: 'Regularite d\'Epargne',
  PRE: 'Precision Budgetaire',
  SEC: 'Securite Financiere',
  EFF: 'Efficience des Revenus',
  LIT: 'Litteratie Financiere',
};

// ─── Data-driven key figures builder ───

function buildKeyFigures(code: string, d: LeverDetails): { label: string; value: string; color: string }[] {
  switch (code) {
    case 'REG': {
      const ewma = d.regEwmaFrequency ?? 0;
      const intensity = d.regSavingsIntensity ?? 0;
      const streak = d.regCurrentStreak ?? 0;
      const streakSc = d.regStreakScore ?? 0;
      const items: { label: string; value: string; color: string }[] = [
        { label: 'Frequence EWMA', value: `${ewma}/100`, color: ewma >= 70 ? '#4ADE80' : ewma >= 40 ? '#FBBF24' : '#F87171' },
        { label: 'Intensite (note moy.)', value: `${d.regAvgNote ?? 0}/10 → ${intensity}/100`, color: intensity >= 70 ? '#4ADE80' : intensity >= 40 ? '#FBBF24' : '#F87171' },
        { label: 'Serie en cours', value: `${streak} sem. → ${streakSc}/100`, color: streak >= 4 ? '#4ADE80' : streak >= 2 ? '#FBBF24' : '#F87171' },
        { label: 'Semaines avec epargne', value: `${d.regWeeksWithSavings ?? 0} / ${d.regTotalWeeks ?? 0}`, color: '#A1A1AA' },
      ];
      if (d.regHasBeginnerBonus) {
        items.push({ label: 'Bonus debutant', value: '+15 pts', color: '#60A5FA' });
      }
      return items;
    }
    case 'PRE': {
      const avg = d.preAvgExecution ?? 0;
      const items: { label: string; value: string; color: string }[] = [];
      if (d.preHasBudget && (d.preScoreIncomp !== undefined || d.preScoreSemi !== undefined || d.preScoreDisc !== undefined)) {
        const incompExec = d.preRealizationIncomp !== undefined ? Math.round(d.preRealizationIncomp * 100) : 0;
        const semiExec = d.preRealizationSemi !== undefined ? Math.round(d.preRealizationSemi * 100) : 0;
        const discExec = d.preRealizationDisc !== undefined ? Math.round(d.preRealizationDisc * 100) : 0;
        const sI = d.preScoreIncomp ?? 0;
        const sS = d.preScoreSemi ?? 0;
        const sD = d.preScoreDisc ?? 0;
        items.push(
          { label: `Incompressible (${Math.round((d.preWeightIncomp ?? 0) * 100)}%)`, value: `${sI}/100 · ${incompExec}%`, color: sI >= 80 ? '#4ADE80' : sI >= 50 ? '#FBBF24' : '#F87171' },
          { label: `Semi-essentiel (${Math.round((d.preWeightSemi ?? 0) * 100)}%)`, value: `${sS}/100 · ${semiExec}%`, color: sS >= 80 ? '#4ADE80' : sS >= 50 ? '#FBBF24' : '#F87171' },
          { label: `Discretionnaire (${Math.round((d.preWeightDisc ?? 0) * 100)}%)`, value: `${sD}/100 · ${discExec}%`, color: sD >= 80 ? '#4ADE80' : sD >= 50 ? '#FBBF24' : '#F87171' },
          { label: 'Realisation globale', value: `${avg}%`, color: avg <= 100 && avg >= 80 ? '#4ADE80' : '#FB923C' },
        );
        // Volatilite — afficher seulement si penalite active (< 1.0)
        const hasPenalty = (d.prePenaltyIncomp ?? 1) < 0.99 || (d.prePenaltySemi ?? 1) < 0.99 || (d.prePenaltyDisc ?? 1) < 0.99;
        if (hasPenalty) {
          const worstCV = Math.max(d.preCvIncomp ?? 0, d.preCvSemi ?? 0, d.preCvDisc ?? 0);
          const worstPenalty = Math.min(d.prePenaltyIncomp ?? 1, d.prePenaltySemi ?? 1, d.prePenaltyDisc ?? 1);
          items.push({ label: 'Volatilite max (CV)', value: `${Math.round(worstCV * 100)}%`, color: worstCV > 0.20 ? '#F87171' : worstCV > 0.10 ? '#FBBF24' : '#4ADE80' });
          items.push({ label: 'Penalite stabilite', value: `×${worstPenalty.toFixed(2)}`, color: worstPenalty < 0.90 ? '#F87171' : '#FBBF24' });
        }
      } else {
        items.push({ label: 'Plan budgetaire', value: 'Non configure', color: '#F87171' });
      }
      if (d.preHasBeginnerBonus) {
        items.push({ label: 'Bonus debutant', value: '+15 pts', color: '#60A5FA' });
      }
      return items;
    }
    case 'SEC': {
      const objectif = d.secObjectifAnnuel ?? 0;
      if (objectif <= 0) {
        return [
          { label: 'Objectif EPR', value: 'Non defini', color: '#71717A' },
          { label: 'Score par defaut', value: '40/100 (risque)', color: '#FB923C' },
        ];
      }
      const cumul = d.secCumulEconomies ?? 0;
      const prorated = d.secProratedTarget ?? 0;
      const coveragePct = Math.round((d.secCoverageRatio ?? 0) * 100);
      const items: { label: string; value: string; color: string }[] = [
        { label: 'Epargne nette cumulee', value: formatCurrency(cumul), color: '#4ADE80' },
        { label: `Objectif prorte An${d.secPlanYear ?? 1} T${d.secQuarter ?? 1}`, value: formatCurrency(prorated), color: '#60A5FA' },
        { label: 'Ratio de couverture', value: `${coveragePct}%`, color: coveragePct >= 100 ? '#4ADE80' : coveragePct >= 70 ? '#FBBF24' : '#F87171' },
        { label: `Objectif annuel An${d.secPlanYear ?? 1}`, value: formatCurrency(objectif), color: '#A1A1AA' },
        { label: 'Avancement', value: `S${d.secWeeksElapsed ?? 0} / 48`, color: '#A1A1AA' },
      ];
      if (d.secHasBeginnerBonus) {
        items.push({ label: 'Bonus debutant', value: '+15 pts', color: '#60A5FA' });
      }
      return items;
    }
    case 'EFF': {
      if (!d.effHasTargets) {
        const hasIncome = (d.effTotalActual8w ?? 0) > 0;
        return [
          { label: 'Objectifs revenus', value: 'Non configures', color: '#71717A' },
          { label: 'Score par defaut', value: hasIncome ? '60/100 (suivi actif)' : '50/100 (neutre)', color: '#A78BFA' },
          { label: 'Fenetre d\'analyse', value: `${d.effNbWeeks ?? 0} semaines`, color: '#A1A1AA' },
        ];
      }
      const actual8w = d.effTotalActual8w ?? 0;
      const expected8w = d.effTotalExpected8w ?? 0;
      const globalPct = expected8w > 0 ? Math.round((actual8w / expected8w) * 100) : 0;
      const items: { label: string; value: string; color: string }[] = [
        { label: `Revenus reels (${d.effNbWeeks ?? 0} sem.)`, value: formatCurrency(actual8w), color: '#4ADE80' },
        { label: `Revenus prevus (${d.effNbWeeks ?? 0} sem.)`, value: formatCurrency(expected8w), color: '#60A5FA' },
        { label: 'Realisation globale', value: `${globalPct}%`, color: globalPct >= 80 ? '#4ADE80' : globalPct >= 50 ? '#FBBF24' : '#F87171' },
      ];
      // Show Fixe/Variable decomposition if both exist
      if (d.effScoreFixe !== undefined && d.effScoreVariable !== undefined) {
        const rFixePct = Math.round((d.effRealizationFixe ?? 0) * 100);
        const rVarPct = Math.round((d.effRealizationVariable ?? 0) * 100);
        items.push(
          { label: `Revenus Fixes (${Math.round((d.effWeightFixe ?? 0) * 100)}%)`, value: `${rFixePct}% → ${d.effScoreFixe}/100`, color: rFixePct >= 90 ? '#4ADE80' : rFixePct >= 70 ? '#FBBF24' : '#F87171' },
          { label: `Revenus Variables (${Math.round((d.effWeightVariable ?? 0) * 100)}%)`, value: `${rVarPct}% → ${d.effScoreVariable}/100`, color: rVarPct >= 80 ? '#4ADE80' : rVarPct >= 50 ? '#FBBF24' : '#F87171' },
        );
      }
      if (d.effHasBeginnerBonus) {
        items.push({ label: 'Bonus debutant', value: '+15 pts', color: '#60A5FA' });
      }
      return items;
    }
    case 'LIT': {
      const know = d.litKnowledgeScore ?? 0;
      const engage = d.litEngagementScore ?? 0;
      const prog = d.litProgressionScore ?? 0;
      const completed = d.litCompletedCount ?? 0;
      const total = d.litTotalChallenges ?? 48;
      const items: { label: string; value: string; color: string }[] = [
        { label: 'Connaissances EKH (60%)', value: `${d.litEkhNorm ?? 0}/100`, color: know >= 60 ? '#4ADE80' : know >= 40 ? '#FBBF24' : '#F87171' },
        { label: 'Engagement defis (25%)', value: `${engage}/100`, color: engage >= 60 ? '#4ADE80' : engage >= 30 ? '#FBBF24' : '#F87171' },
        { label: 'Progression curriculum (15%)', value: `${completed}/${total} → ${prog}/100`, color: prog >= 50 ? '#4ADE80' : prog >= 25 ? '#FBBF24' : '#F87171' },
      ];
      if (d.litFloorActive) {
        items.push({ label: 'Plancher expert actif', value: `MIN = ${d.litKnowledgeFloor ?? 0}`, color: '#60A5FA' });
      }
      return items;
    }
    default:
      return [];
  }
}

// ─── Data-driven comment builder ───

function buildComment(code: string, score: number, d: LeverDetails): string {
  switch (code) {
    case 'REG': {
      const t = d.regTotalWeeks ?? 0;
      if (t === 0) return 'Aucune donnee pour l\'instant. Commence a saisir tes depenses pour activer ce levier.';
      const ewma = d.regEwmaFrequency ?? 0;
      const streak = d.regCurrentStreak ?? 0;
      const avgN = d.regAvgNote ?? 0;
      if (ewma >= 80 && streak >= 4 && avgN >= 7)
        return `Excellent : frequence ${ewma}/100, serie de ${streak} semaines, note moyenne ${avgN}/10. Regularite exemplaire — continue ainsi !`;
      if (ewma >= 60)
        return `Bonne frequence (${ewma}/100) mais ${streak < 3 ? 'ta serie est trop courte (' + streak + ' sem.)' : 'l\'intensite peut progresser (note moy. ' + avgN + '/10)'}. Vise la constance.`;
      if (ewma >= 30)
        return `Frequence moderee (${ewma}/100). Tu epargnes de facon irreguliere. Meme un petit montant chaque semaine fait la difference.`;
      return `Frequence faible (${ewma}/100). La regularite est le levier le plus important — vise au moins 4 semaines consecutives.`;
    }
    case 'PRE': {
      if (!d.preHasBudget) return 'Aucun budget configure. Sans plan budgetaire, ce levier reste a 0. Configure tes budgets dans le wizard pour activer la precision budgetaire.';
      const sI = d.preScoreIncomp ?? 0;
      const sS = d.preScoreSemi ?? 0;
      const sD = d.preScoreDisc ?? 0;
      const rI = d.preRealizationIncomp !== undefined ? Math.round(d.preRealizationIncomp * 100) : 0;
      const rS = d.preRealizationSemi !== undefined ? Math.round(d.preRealizationSemi * 100) : 0;
      const rD = d.preRealizationDisc !== undefined ? Math.round(d.preRealizationDisc * 100) : 0;
      // Identify weakest tier
      const tiers = [
        { name: 'Incompressible', s: sI, r: rI },
        { name: 'Semi-essentiel', s: sS, r: rS },
        { name: 'Discretionnaire', s: sD, r: rD },
      ];
      const allGood = tiers.every((t) => t.s >= 80);
      const weakest = tiers.reduce((a, b) => a.s < b.s ? a : b);
      // Volatility suffix
      const worstPenalty = Math.min(d.prePenaltyIncomp ?? 1, d.prePenaltySemi ?? 1, d.prePenaltyDisc ?? 1);
      const volSuffix = worstPenalty < 0.95 ? ` Penalite de volatilite active (×${worstPenalty.toFixed(2)}) — tes depenses varient trop d'une semaine a l'autre.` : '';
      if (allGood) return `Excellente maitrise budgetaire sur les 3 niveaux. Incompressible ${rI}% (${sI}/100), Semi-essentiel ${rS}% (${sS}/100), Discretionnaire ${rD}% (${sD}/100).${volSuffix}`;
      if (weakest.name === 'Incompressible') return `Attention aux depenses vitales (${rI}% → ${sI}/100) — alimentation, logement et sante depassent le budget. Ces postes sont penalises severement car incompressibles.${volSuffix}`;
      if (weakest.name === 'Semi-essentiel') return `Les depenses semi-essentielles sont le maillon faible (${rS}% → ${sS}/100) — transport, telecom ou education a revoir. Incompressible OK a ${sI}/100.${volSuffix}`;
      return `Les depenses discretionnaires plombent ton score (${rD}% → ${sD}/100). Vetements et loisirs : chaque euro economise remonte le score. Incompressible ${sI}/100, Semi-essentiel ${sS}/100.${volSuffix}`;
    }
    case 'SEC': {
      const obj = d.secObjectifAnnuel ?? 0;
      if (obj <= 0) return 'Objectif EPR non defini. L\'absence de plan d\'epargne est un facteur de risque — configure tes objectifs dans le wizard (score : 40/100).';
      const cumul = d.secCumulEconomies ?? 0;
      const prorated = d.secProratedTarget ?? 0;
      const coveragePct = Math.round((d.secCoverageRatio ?? 0) * 100);
      const weeks = d.secWeeksElapsed ?? 0;
      const ecart = Math.max(0, prorated - cumul);
      if (coveragePct >= 120) return `${formatCurrency(cumul)} cumules pour ${formatCurrency(prorated)} attendus a S${weeks} (${coveragePct}%). Nettement en avance — securite financiere solide.`;
      if (coveragePct >= 100) return `${formatCurrency(cumul)} cumules pour ${formatCurrency(prorated)} attendus a S${weeks} (${coveragePct}%). En avance sur ton plan d'epargne An${d.secPlanYear ?? 1}.`;
      if (coveragePct >= 70) return `${formatCurrency(cumul)} sur ${formatCurrency(prorated)} attendus a S${weeks} (${coveragePct}%). Retard modere — il manque ${formatCurrency(ecart)} pour etre en ligne.`;
      if (coveragePct >= 40) return `${formatCurrency(cumul)} sur ${formatCurrency(prorated)} attendus a S${weeks} (${coveragePct}%). En retard significatif — accelere l'epargne pour rattraper ${formatCurrency(ecart)}.`;
      return `Seulement ${formatCurrency(cumul)} sur ${formatCurrency(prorated)} attendus a S${weeks} (${coveragePct}%). Situation critique — ton matelas de securite est tres insuffisant.`;
    }
    case 'EFF': {
      if (!d.effHasTargets) {
        const hasIncome = (d.effTotalActual8w ?? 0) > 0;
        if (hasIncome) return 'Aucun objectif de revenus configure, mais tu enregistres des rentrees. Configure tes sources dans le wizard pour activer le scoring complet (score actuel : 60/100).';
        return 'Aucun objectif de revenus configure et aucune rentree enregistree. Ajoute tes sources dans le wizard pour activer ce levier (score neutre : 50/100).';
      }
      const nbW = d.effNbWeeks ?? 0;
      const actual8w = d.effTotalActual8w ?? 0;
      const expected8w = d.effTotalExpected8w ?? 0;
      const pct = expected8w > 0 ? Math.round((actual8w / expected8w) * 100) : 0;
      const ecart = Math.abs(actual8w - expected8w);
      // Build Fixe/Variable context
      let typeContext = '';
      if (d.effScoreFixe !== undefined && d.effScoreVariable !== undefined) {
        const rF = Math.round((d.effRealizationFixe ?? 0) * 100);
        const rV = Math.round((d.effRealizationVariable ?? 0) * 100);
        if (rF < 90 && rV >= 80) typeContext = ' Tes revenus fixes sont en retard — verifie salaire et pensions.';
        else if (rV < 60 && rF >= 90) typeContext = ' Tes revenus variables sont faibles — primes ou freelance en attente ?';
        else if (rF < 90 && rV < 60) typeContext = ' Les deux types de revenus sont sous les previsions.';
      }
      if (pct >= 100) return `Sur ${nbW} semaines, ${formatCurrency(actual8w)} recus pour ${formatCurrency(expected8w)} prevus (${pct}%). Tes revenus depassent les previsions !${typeContext}`;
      if (pct >= 80) return `Sur ${nbW} semaines, ${formatCurrency(actual8w)} recus sur ${formatCurrency(expected8w)} prevus (${pct}%). Quasi dans les clous — il manque ${formatCurrency(ecart)}.${typeContext}`;
      if (pct >= 50) return `Sur ${nbW} semaines, ${formatCurrency(actual8w)} sur ${formatCurrency(expected8w)} attendus (${pct}%). Ecart de ${formatCurrency(ecart)} a combler.${typeContext}`;
      return `Sur ${nbW} semaines, seulement ${formatCurrency(actual8w)} sur ${formatCurrency(expected8w)} prevus (${pct}%). Gros ecart de ${formatCurrency(ecart)}.${typeContext}`;
    }
    case 'LIT': {
      const know = d.litKnowledgeScore ?? 0;
      const engage = d.litEngagementScore ?? 0;
      const completed = d.litCompletedCount ?? 0;
      const total = d.litTotalChallenges ?? 48;
      if (d.litFloorActive)
        return `Ton expertise (EKH ${d.litEkhNorm ?? 0}/100) garantit un score plancher. Complete tes defis hebdomadaires (${completed}/${total}) pour depasser ce minimum.`;
      if (know >= 70 && engage >= 60)
        return `Bonnes connaissances (${know}/100) et engagement actif (${engage}/100). ${completed}/${total} defis completes — continue a progresser dans le curriculum.`;
      if (know >= 50)
        return `Connaissances correctes (${know}/100) mais l'engagement est faible (${engage}/100). Fais tes defis chaque semaine pour booster ce levier.`;
      return `Connaissances limitees (${know}/100). La litteratie impacte TOUS les autres leviers. Refais le wizard et complete tes defis (${completed}/${total}).`;
    }
    default:
      return '';
  }
}

// ─── Score level ───

function getScoreLevel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Excellent', color: '#4ADE80' };
  if (score >= 60) return { label: 'Bien', color: '#60A5FA' };
  if (score >= 40) return { label: 'Moyen', color: '#FBBF24' };
  if (score >= 20) return { label: 'Faible', color: '#FB923C' };
  return { label: 'Critique', color: '#F87171' };
}

// ─── Component ───

export function FinancialScoreReport() {
  const { globalScore, grade, levers } = useFinancialScore();
  const globalLevel = getScoreLevel(globalScore);

  return (
    <View style={styles.container}>
      {/* Global summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Score global</Text>
          <Text style={[styles.summaryScore, { color: globalLevel.color }]}>
            {globalScore}/100
          </Text>
        </View>
        <View style={styles.summaryBarBg}>
          <View style={[styles.summaryBarFill, { width: `${globalScore}%`, backgroundColor: globalLevel.color }]} />
        </View>
        <Text style={[styles.summaryLevel, { color: globalLevel.color }]}>
          {grade} — {globalLevel.label}
        </Text>
      </View>

      {/* Lever rows */}
      {levers.map((lever) => {
        const Icon = LEVER_ICONS[lever.code];
        const fullName = LEVER_NAMES[lever.code];
        if (!Icon) return null;

        const keyFigures = buildKeyFigures(lever.code, lever.details);
        const comment = buildComment(lever.code, lever.score, lever.details);

        return (
          <View key={lever.code} style={styles.leverCard}>
            {/* Header: icon + name + weight + score */}
            <View style={styles.leverHeader}>
              <View style={[styles.leverIconBox, { backgroundColor: lever.color + '20' }]}>
                <Icon size={16} color={lever.color} />
              </View>
              <View style={styles.leverTitleCol}>
                <Text style={styles.leverName}>{fullName}</Text>
                <Text style={styles.leverWeight}>{lever.code} · {Math.round(lever.weight * 100)}%</Text>
              </View>
              <View style={styles.leverScoreCol}>
                <Text style={[styles.leverScoreValue, { color: lever.color }]}>
                  {lever.score}
                </Text>
                <Text style={styles.leverScoreMax}>/100</Text>
              </View>
            </View>

            {/* Progress bar */}
            <View style={styles.leverBarBg}>
              <View
                style={[
                  styles.leverBarFill,
                  { width: `${Math.min(lever.score, 100)}%`, backgroundColor: lever.color },
                ]}
              />
            </View>

            {/* Key figures — data-driven */}
            <View style={styles.figuresGrid}>
              {keyFigures.map((fig, i) => (
                <View key={i} style={styles.figureRow}>
                  <Text style={styles.figureLabel}>{fig.label}</Text>
                  <Text style={[styles.figureValue, { color: fig.color }]}>{fig.value}</Text>
                </View>
              ))}
            </View>

            {/* Personalized comment with real numbers */}
            <View style={[styles.commentBox, { borderLeftColor: lever.color }]}>
              <Text style={styles.commentText}>{comment}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ─── Styles ───

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },

  // Global summary
  summaryCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: PF.border,
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    color: PF.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryScore: {
    fontSize: 22,
    fontWeight: '900',
  },
  summaryBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  summaryBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  summaryLevel: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },

  // Lever card
  leverCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: PF.border,
  },
  leverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  leverIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leverTitleCol: {
    flex: 1,
  },
  leverName: {
    color: PF.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  leverWeight: {
    color: PF.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  leverScoreCol: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  leverScoreValue: {
    fontSize: 24,
    fontWeight: '900',
  },
  leverScoreMax: {
    color: PF.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },

  // Bar
  leverBarBg: {
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  leverBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Key figures
  figuresGrid: {
    gap: 6,
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    padding: 10,
  },
  figureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  figureLabel: {
    color: PF.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  figureValue: {
    fontSize: 13,
    fontWeight: '800',
  },

  // Comment
  commentBox: {
    borderLeftWidth: 3,
    paddingLeft: 10,
    paddingVertical: 4,
  },
  commentText: {
    color: PF.textPrimary,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
  },
});
