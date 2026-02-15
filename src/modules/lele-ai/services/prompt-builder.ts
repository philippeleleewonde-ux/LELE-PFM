import type { UserRole } from '@/types/roles';
import type { AIPageContext, AIMessage } from '../types/lele-ai.types';
import { buildSystemPrompt } from '../config/prompts/system-prompts';
import { summarizeVisibleData } from './context-collector';

interface PromptParams {
  userMessage: string;
  conversationHistory: AIMessage[];
  role: UserRole | null;
  userName: string;
  language: string;
  pageContext: AIPageContext;
  companyName?: string;
}

interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

/**
 * Construit les messages formatés pour l'API Gemini.
 * Inclut : prompt système + historique conversation + message utilisateur.
 */
export function buildGeminiMessages(params: PromptParams): {
  systemInstruction: string;
  history: GeminiMessage[];
  userMessage: string;
} {
  const { userMessage, conversationHistory, role, userName, language, pageContext, companyName } = params;

  // Prompt système avec contexte complet
  const systemInstruction = buildSystemPrompt({
    role,
    userName,
    language,
    pageContext: {
      ...pageContext,
      visibleData: summarizeVisibleData(pageContext.visibleData),
    },
    companyName,
  });

  // Historique : garder les 10 derniers messages max (économie tokens)
  const recentHistory = conversationHistory.slice(-10);
  const history: GeminiMessage[] = recentHistory.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  return {
    systemInstruction,
    history,
    userMessage,
  };
}

/**
 * Estime le nombre de tokens d'un prompt (approximation).
 * Utilisé pour le tracking de consommation.
 */
export function estimateTokenCount(text: string): number {
  // Approximation : 1 token ≈ 4 caractères en français
  return Math.ceil(text.length / 4);
}
