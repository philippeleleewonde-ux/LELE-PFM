import type { UserRole } from '@/types/roles';

// ============================================
// LELE AI - Types principaux
// ============================================

/** Message dans le chat */
export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  moduleContext?: string;
  isStreaming?: boolean;
}

/** Contexte de la page active */
export interface AIPageContext {
  currentPage: string;
  currentModule: string | null;
  visibleData: Record<string, unknown> | null;
  companyId: string | null;
}

/** Persona IA par rôle */
export interface AIPersona {
  tone: string;
  focus: string[];
  greeting: (name: string) => string;
  dataAccess: 'all_company' | 'hr_data' | 'team_data' | 'personal_data' | 'client_companies' | 'granted_companies';
  suggestedQuestions: string[];
}

/** Morning Brief */
export interface AIMorningBrief {
  greeting: string;
  sinceLast: string;
  highlights: AIMorningHighlight[];
  recommendation: string | null;
}

export interface AIMorningHighlight {
  type: 'alert' | 'positive' | 'pending' | 'info';
  text: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  action?: string;
  actionRoute?: string;
}

/** Nudge prédictif */
export interface AINudge {
  id: string;
  type: 'alert' | 'positive' | 'suggestion' | 'reminder';
  title: string;
  message: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  actionLabel?: string;
  actionRoute?: string;
  isRead: boolean;
}

/** Préférences utilisateur IA */
export interface AIUserPreferences {
  preferredLanguage: string;
  nudgesEnabled: boolean;
  morningBriefEnabled: boolean;
  aiTone: 'professional' | 'friendly' | 'concise';
}

/** Insight contextuel par module */
export interface AIContextInsight {
  moduleId: string;
  summary: string;
  keyMetrics: AIKeyMetric[];
  trend: 'up' | 'down' | 'stable';
}

export interface AIKeyMetric {
  label: string;
  value: string;
  change?: string;
  direction?: 'up' | 'down' | 'stable';
}

/** État global du provider LELE AI */
export interface LeLeAIState {
  isOpen: boolean;
  messages: AIMessage[];
  isLoading: boolean;
  morningBrief: AIMorningBrief | null;
  morningBriefDismissed: boolean;
  contextInsight: AIContextInsight | null;
  nudges: AINudge[];
  preferences: AIUserPreferences;
  language: string;
}

/** Actions du provider */
export type LeLeAIAction =
  | { type: 'OPEN_CHAT' }
  | { type: 'CLOSE_CHAT' }
  | { type: 'TOGGLE_CHAT' }
  | { type: 'ADD_MESSAGE'; payload: AIMessage }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UPDATE_STREAMING_MESSAGE'; payload: { id: string; content: string } }
  | { type: 'SET_MORNING_BRIEF'; payload: AIMorningBrief | null }
  | { type: 'DISMISS_MORNING_BRIEF' }
  | { type: 'SET_CONTEXT_INSIGHT'; payload: AIContextInsight | null }
  | { type: 'SET_NUDGES'; payload: AINudge[] }
  | { type: 'DISMISS_NUDGE'; payload: string }
  | { type: 'SET_PREFERENCES'; payload: Partial<AIUserPreferences> }
  | { type: 'SET_LANGUAGE'; payload: string }
  | { type: 'CLEAR_MESSAGES' };

/** Contexte du provider */
export interface LeLeAIContextType {
  state: LeLeAIState;
  dispatch: React.Dispatch<LeLeAIAction>;
  sendMessage: (content: string) => Promise<void>;
  pageContext: AIPageContext;
  userRole: UserRole | null;
  userName: string;
}

/** Réponse API du chat */
export interface AIChatResponse {
  message: string;
  cached: boolean;
  tokensUsed?: number;
}

/** Réponse API du morning brief */
export interface AIMorningBriefResponse {
  brief: AIMorningBrief;
  precomputed: boolean;
}

/** Réponse API des insights contextuels */
export interface AIContextInsightResponse {
  insight: AIContextInsight;
  cached: boolean;
}

/** Configuration d'une langue supportée */
export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
}

/** Entrée de cache */
export interface AICacheEntry {
  cacheKey: string;
  response: string;
  companyId: string | null;
  role: string | null;
  moduleContext: string | null;
  language: string;
  tokensUsed: number;
  expiresAt: Date;
}
