import { useCallback } from 'react';
import { useAILimits } from '@/hooks/useAILimits';
import { sendChatMessage } from '../services/ai-orchestrator';
import type { AIMessage, AIPageContext, LeLeAIAction } from '../types/lele-ai.types';
import type { UserRole } from '@/types/roles';

interface UseAIChatParams {
  messages: AIMessage[];
  dispatch: React.Dispatch<LeLeAIAction>;
  role: UserRole | null;
  userName: string;
  language: string;
  pageContext: AIPageContext;
  companyName?: string;
}

/**
 * Hook pour gérer l'envoi de messages au chat LELE AI.
 * Gère : crédits, historique, loading, erreurs.
 */
export function useAIChat(params: UseAIChatParams) {
  const { messages, dispatch, role, userName, language, pageContext, companyName } = params;
  const { canMakeCall, trackCall, creditsRemaining } = useAILimits();

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // Ajouter le message utilisateur
    const userMessage: AIMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
      moduleContext: pageContext.currentModule ?? undefined,
    };
    dispatch({ type: 'ADD_MESSAGE', payload: userMessage });
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      // Vérifier les crédits
      if (!canMakeCall) {
        const noCreditsMessage: AIMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: language === 'fr'
            ? 'Vous avez épuisé vos crédits IA pour ce mois. Passez à un plan supérieur pour continuer à utiliser LELE AI.'
            : 'You have used all your AI credits for this month. Upgrade your plan to continue using LELE AI.',
          timestamp: new Date(),
        };
        dispatch({ type: 'ADD_MESSAGE', payload: noCreditsMessage });
        return;
      }

      // Appeler l'orchestrateur
      const result = await sendChatMessage({
        userMessage: content.trim(),
        conversationHistory: messages,
        role,
        userName,
        language,
        pageContext,
        companyName,
      });

      // Tracker l'appel (seulement si pas caché)
      if (!result.cached) {
        await trackCall();
      }

      // Ajouter la réponse
      const assistantMessage: AIMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: result.message,
        timestamp: new Date(),
        moduleContext: pageContext.currentModule ?? undefined,
      };
      dispatch({ type: 'ADD_MESSAGE', payload: assistantMessage });
    } catch (error) {
      const errorMessage: AIMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: language === 'fr'
          ? 'Désolé, une erreur est survenue. Veuillez réessayer.'
          : 'Sorry, an error occurred. Please try again.',
        timestamp: new Date(),
      };
      dispatch({ type: 'ADD_MESSAGE', payload: errorMessage });
      console.error('[LELE AI] Chat error:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [messages, dispatch, role, userName, language, pageContext, companyName, canMakeCall, trackCall]);

  return { sendMessage, canMakeCall, creditsRemaining };
}
