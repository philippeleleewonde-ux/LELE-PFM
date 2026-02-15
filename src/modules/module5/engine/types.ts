// ============================================================================
// MODULE 5 — RPS SCORING ENGINE TYPES
// Source: M5-Psychosocial_risks_V_2021.html
// ============================================================================

/** Niveaux d'alerte (1=Satisfait, 2=Moyen, 3=Insatisfait) */
export type AlertLevel = 1 | 2 | 3;

export type AlertLabel =
  | 'Satisfait Pleinement'
  | 'Satisfait'
  | 'Satisfait moyennement'
  | 'Satisfait insuffisamment'
  | 'Pas satisfait du tout';

export type ParticipationLabel =
  | 'Excellente'
  | 'Importante'
  | 'Moyenne'
  | 'Faible'
  | 'Trop faible';

export type PriorityLevel = 'PRIORITE FORTE' | 'PRIORITE MOYENNE' | 'PRIORITE FAIBLE';

export interface AxisScore {
  axisId: string;
  axisName: string;
  avgScore: number;
  satisfiedCount: number;
  dissatisfiedCount: number;
  satisfactionRate: number;
  alertLevel: AlertLevel;
  alertLabel: AlertLabel;
}

export interface LineParticipation {
  lineName: string;
  participants: number;
  totalWorkforce: number;
  rate: number;
  alertLevel: AlertLevel;
  label: ParticipationLabel;
}

export interface DRScore {
  drId: string;
  drName: string;
  avgScore: number;
  satisfactionLabel: AlertLabel;
}

export interface DRPriority {
  drId: string;
  drName: string;
  avgScore: number;
  priority: PriorityLevel;
  satisfactionLabel: AlertLabel;
}

export interface ActionRecommendation {
  questionCode: string;
  actionLabel: string;
  avgScore: number;
  drId: string;
  urgency: 'urgent' | 'to-improve' | 'ok';
}

export interface LineActionPlan {
  lineName: string;
  drPriorities: DRPriority[];
  recommendations: ActionRecommendation[];
  recommendationsByDR: Record<string, ActionRecommendation[]>;
}

export interface RiskScoringResult {
  participation: {
    global: LineParticipation;
    byLine: LineParticipation[];
  };
  globalScore: AxisScore;
  axes: AxisScore[];
  lineAxes: Record<string, AxisScore[]>;
  globalDR: DRScore[];
  lineDR: Record<string, DRScore[]>;
  drPriorities: {
    global: DRPriority[];
    byLine: Record<string, DRPriority[]>;
  };
  actionPlans: LineActionPlan[];
  responseCount: number;
  surveyId: string;
}
