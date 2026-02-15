// ============================================================================
// MODULE 2 — SCORING ENGINE TYPES
// Source: 9-M2-Centredecalcul-MMS.xls
// ============================================================================

/** Niveaux d'alerte satisfaction (1=Satisfait, 2=Moyen, 3=Insatisfait) */
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

export interface ThemeScore {
  themeId: string;
  themeName: string;
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

export interface DCScore {
  dcId: string;
  dcName: string;
  avgScore: number;
  satisfactionLabel: AlertLabel;
}

export interface AdhesionResult {
  dcId: string;
  dcName: string;
  m1Score: number;
  mssScore: number;
  moyenne: number;
  priority: PriorityLevel;
  importanceLabel: string;
  satisfactionLabel: AlertLabel;
}

export interface ActionRecommendation {
  questionCode: string;
  actionLabel: string;
  avgScore: number;
  dcId: string;
  urgency: 'urgent' | 'to-improve' | 'ok';
}

export interface LineActionPlan {
  lineName: string;
  dcPriorities: AdhesionResult[];
  recommendations: ActionRecommendation[];
  recommendationsByDC: Record<string, ActionRecommendation[]>;
}

export interface ScoringResult {
  participation: {
    global: LineParticipation;
    byLine: LineParticipation[];
  };
  globalSatisfaction: ThemeScore;
  themes: ThemeScore[];
  lineThemes: Record<string, ThemeScore[]>;
  globalDC: DCScore[];
  lineDC: Record<string, DCScore[]>;
  adhesion: {
    global: AdhesionResult[];
    byLine: Record<string, AdhesionResult[]>;
  };
  actionPlans: LineActionPlan[];
  responseCount: number;
  surveyId: string;
}
