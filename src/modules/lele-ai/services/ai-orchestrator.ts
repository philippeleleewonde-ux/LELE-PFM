import type { UserRole } from '@/types/roles';
import type { AIPageContext, AIMessage, AIMorningBrief, AIContextInsight } from '../types/lele-ai.types';
import { buildGeminiMessages, estimateTokenCount } from './prompt-builder';
import { buildCacheKey, getCachedResponse, setCachedResponse } from './cache-manager';
import { buildMorningBriefPrompt } from '../config/prompts/morning-brief';
import { buildDataStorytellingPrompt } from '../config/prompts/data-storytelling';
import { supabase } from '@/integrations/supabase/client';

/**
 * Orchestrateur principal de LELE AI.
 * Gère le routage des requêtes, le cache et les appels à Gemini
 * via le backend Express (POST /api/lele-ai/chat).
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

async function callBackendChat(body: {
  systemInstruction: string;
  history: Array<{ role: string; parts: Array<{ text: string }> }>;
  userMessage: string;
}): Promise<{ response: string }> {
  const res = await fetch(`${BACKEND_URL}/api/lele-ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `Backend error ${res.status}`);
  }

  return res.json();
}

interface ChatParams {
  userMessage: string;
  conversationHistory: AIMessage[];
  role: UserRole | null;
  userName: string;
  language: string;
  pageContext: AIPageContext;
  companyName?: string;
}

interface ChatResult {
  message: string;
  cached: boolean;
  tokensUsed: number;
}

/**
 * Envoie un message au chat LELE AI.
 * Vérifie le cache d'abord, appelle Gemini en fallback.
 */
export async function sendChatMessage(params: ChatParams): Promise<ChatResult> {
  const { userMessage, role, pageContext, language } = params;

  // 1. Vérifier le cache
  const cacheKey = buildCacheKey({
    prompt: userMessage,
    role: role,
    moduleContext: pageContext.currentModule,
    companyId: pageContext.companyId,
    language,
  });

  const cached = await getCachedResponse(cacheKey);
  if (cached) {
    return { message: cached, cached: true, tokensUsed: 0 };
  }

  // 2. Construire les messages pour Gemini
  const { systemInstruction, history, userMessage: msg } = buildGeminiMessages(params);

  // 3. Appeler Gemini via le backend Express
  const data = await callBackendChat({
    systemInstruction,
    history,
    userMessage: msg,
  });

  const responseText = data?.response ?? 'Désolé, je n\'ai pas pu traiter votre demande.';
  const tokensUsed = estimateTokenCount(systemInstruction + msg + responseText);

  // 4. Mettre en cache (TTL 30min pour le chat)
  await setCachedResponse({
    cacheKey,
    response: responseText,
    companyId: pageContext.companyId,
    role,
    moduleContext: pageContext.currentModule,
    language,
    tokensUsed,
    ttlMinutes: 30,
  });

  return { message: responseText, cached: false, tokensUsed };
}

/**
 * Récupère le Morning Brief (pré-calculé ou temps réel en fallback).
 */
export async function fetchMorningBrief(params: {
  userId: string;
  role: UserRole;
  userName: string;
  language: string;
  companyId: string;
  companyName: string;
}): Promise<AIMorningBrief | null> {
  const { userId, role, userName, language, companyId, companyName } = params;

  // 1. Chercher un brief pré-calculé valide
  try {
    const { data: precomputed } = await supabase
      .from('ai_precomputed_insights')
      .select('content')
      .eq('user_id', userId)
      .eq('insight_type', 'morning_brief')
      .eq('is_read', false)
      .gt('valid_until', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (precomputed?.content) {
      // Marquer comme lu
      await supabase
        .from('ai_precomputed_insights')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('insight_type', 'morning_brief')
        .eq('is_read', false);

      return precomputed.content as unknown as AIMorningBrief;
    }
  } catch {
    // Fall through to real-time generation
  }

  // 2. Fallback : générer en temps réel
  try {
    const recentChanges = await collectRecentChanges(companyId, role);
    const daysSinceLastVisit = await getDaysSinceLastVisit(userId);

    const prompt = buildMorningBriefPrompt({
      role,
      userName,
      language,
      companyName,
      daysSinceLastVisit,
      recentChanges,
    });

    const data = await callBackendChat({
      systemInstruction: 'Tu es LELE AI. Génère le Morning Brief demandé en JSON pur.',
      history: [],
      userMessage: prompt,
    });

    const parsed = parseJsonResponse<AIMorningBrief>(data?.response);
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Récupère un insight contextuel pour un module (pré-calculé).
 */
export async function fetchContextInsight(params: {
  companyId: string;
  role: UserRole;
  moduleId: string;
  language: string;
}): Promise<AIContextInsight | null> {
  const { companyId, role, moduleId } = params;

  try {
    const { data } = await supabase
      .from('ai_precomputed_insights')
      .select('content')
      .eq('company_id', companyId)
      .eq('role', role)
      .eq('insight_type', `module_summary_${moduleId}`)
      .gt('valid_until', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data?.content) {
      return data.content as unknown as AIContextInsight;
    }
  } catch {
    // Non-critical
  }

  return null;
}

// ============================================
// Helpers internes
// ============================================

async function collectRecentChanges(
  companyId: string,
  role: UserRole
): Promise<Record<string, unknown>> {
  const changes: Record<string, unknown> = {};

  try {
    // Derniers indicateurs de performance modifiés
    const { data: indicators } = await supabase
      .from('performance_indicators')
      .select('indicator_name, value, updated_at')
      .eq('company_id', companyId)
      .order('updated_at', { ascending: false })
      .limit(5);

    if (indicators?.length) {
      changes.recentIndicators = indicators;
    }

    // Score bancaire récent (si CEO ou Consultant)
    if (role === 'CEO' || role === 'CONSULTANT' || role === 'BANQUIER') {
      const { data: scores } = await supabase
        .from('ai_banking_scores')
        .select('global_score, risk_level, created_at')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (scores) {
        changes.bankingScore = scores;
      }
    }
  } catch {
    // Non-critical — morning brief will just have less data
  }

  return changes;
}

async function getDaysSinceLastVisit(userId: string): Promise<number> {
  try {
    const { data } = await supabase
      .from('ai_user_preferences')
      .select('updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (data?.updated_at) {
      const lastVisit = new Date(data.updated_at);
      const now = new Date();
      return Math.max(1, Math.floor((now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24)));
    }
  } catch {
    // Default
  }
  return 1;
}

function parseJsonResponse<T>(response: string | undefined): T | null {
  if (!response) return null;
  try {
    // Extraire le JSON même s'il y a du texte autour
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as T;
    }
  } catch {
    // Parse failed
  }
  return null;
}
