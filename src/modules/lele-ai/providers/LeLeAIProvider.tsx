import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import type {
  LeLeAIState,
  LeLeAIAction,
  LeLeAIContextType,
  AIUserPreferences,
} from '../types/lele-ai.types';
import { useAIContext } from '../hooks/useAIContext';
import { useAIChat } from '../hooks/useAIChat';
import { useAILanguage } from '../hooks/useAILanguage';
import { fetchMorningBrief } from '../services/ai-orchestrator';
import { useAuth } from '@/hooks/useAuth';

// ============================================
// State initial
// ============================================

const DEFAULT_PREFERENCES: AIUserPreferences = {
  preferredLanguage: 'fr',
  nudgesEnabled: true,
  morningBriefEnabled: true,
  aiTone: 'professional',
};

const initialState: LeLeAIState = {
  isOpen: false,
  messages: [],
  isLoading: false,
  morningBrief: null,
  morningBriefDismissed: false,
  contextInsight: null,
  nudges: [],
  preferences: DEFAULT_PREFERENCES,
  language: 'fr',
};

// ============================================
// Reducer
// ============================================

function leLeAIReducer(state: LeLeAIState, action: LeLeAIAction): LeLeAIState {
  switch (action.type) {
    case 'OPEN_CHAT':
      return { ...state, isOpen: true };
    case 'CLOSE_CHAT':
      return { ...state, isOpen: false };
    case 'TOGGLE_CHAT':
      return { ...state, isOpen: !state.isOpen };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'UPDATE_STREAMING_MESSAGE':
      return {
        ...state,
        messages: state.messages.map((msg) =>
          msg.id === action.payload.id
            ? { ...msg, content: action.payload.content }
            : msg
        ),
      };
    case 'SET_MORNING_BRIEF':
      return { ...state, morningBrief: action.payload };
    case 'DISMISS_MORNING_BRIEF':
      return { ...state, morningBriefDismissed: true };
    case 'SET_CONTEXT_INSIGHT':
      return { ...state, contextInsight: action.payload };
    case 'SET_NUDGES':
      return { ...state, nudges: action.payload };
    case 'DISMISS_NUDGE':
      return {
        ...state,
        nudges: state.nudges.filter((n) => n.id !== action.payload),
      };
    case 'SET_PREFERENCES':
      return {
        ...state,
        preferences: { ...state.preferences, ...action.payload },
      };
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload };
    case 'CLEAR_MESSAGES':
      return { ...state, messages: [] };
    default:
      return state;
  }
}

// ============================================
// Context
// ============================================

const LeLeAIContext = createContext<LeLeAIContextType | undefined>(undefined);

// ============================================
// Provider
// ============================================

export function LeLeAIProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(leLeAIReducer, initialState);
  const { user } = useAuth();
  const { pageContext, userRole, userName, userId, companyId, companyName } = useAIContext();
  const { language } = useAILanguage();

  // Synchroniser la langue détectée
  useEffect(() => {
    dispatch({ type: 'SET_LANGUAGE', payload: language });
  }, [language]);

  // Charger le Morning Brief à la connexion
  useEffect(() => {
    if (!userId || !userRole || !companyId || state.morningBriefDismissed) return;

    let cancelled = false;

    async function loadMorningBrief() {
      const brief = await fetchMorningBrief({
        userId: userId!,
        role: userRole!,
        userName,
        language: state.language,
        companyId: companyId!,
        companyName: companyName ?? '',
      });
      if (!cancelled && brief) {
        dispatch({ type: 'SET_MORNING_BRIEF', payload: brief });
      }
    }

    loadMorningBrief();
    return () => { cancelled = true; };
  }, [userId, userRole, companyId]); // Intentionally limited deps — load once per session

  // Hook du chat
  const { sendMessage, canMakeCall, creditsRemaining } = useAIChat({
    messages: state.messages,
    dispatch,
    role: userRole,
    userName,
    language: state.language,
    pageContext,
    companyName: companyName ?? undefined,
  });

  const contextValue: LeLeAIContextType = {
    state,
    dispatch,
    sendMessage,
    pageContext,
    userRole,
    userName,
  };

  return (
    <LeLeAIContext.Provider value={contextValue}>
      {children}
    </LeLeAIContext.Provider>
  );
}

// ============================================
// Hook principal
// ============================================

export function useLeLeAI(): LeLeAIContextType {
  const context = useContext(LeLeAIContext);
  if (context === undefined) {
    throw new Error('useLeLeAI must be used within a LeLeAIProvider');
  }
  return context;
}
