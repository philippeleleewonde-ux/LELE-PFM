// ============================================================================
// MODULE 2 — ACCESS KEY SERVICE
// Generates and validates unique single-use access keys for survey employees
// Keys: 6 alphanumeric uppercase characters
// ============================================================================

import { supabase } from '@/integrations/supabase/client';

const KEY_LENGTH = 6;
const KEY_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I/O/0/1 to avoid confusion

export class AccessKeyService {
  /** Generates a single unique key (6 chars alphanumeric uppercase) */
  static generateKey(): string {
    let key = '';
    for (let i = 0; i < KEY_LENGTH; i++) {
      key += KEY_CHARS[Math.floor(Math.random() * KEY_CHARS.length)];
    }
    return key;
  }

  /** Creates N keys for a survey (1 per employee). Returns the array of keys. */
  static async createKeysForSurvey(surveyId: string, count: number): Promise<string[]> {
    const keys: string[] = [];
    const usedKeys = new Set<string>();

    // Generate unique keys
    while (keys.length < count) {
      const key = this.generateKey();
      if (!usedKeys.has(key)) {
        usedKeys.add(key);
        keys.push(key);
      }
    }

    // Batch insert into survey_access_keys
    const rows = keys.map(key => ({
      survey_id: surveyId,
      access_key: key,
      is_used: false,
    }));

    const { error } = await supabase
      .from('survey_access_keys' as any)
      .insert(rows as any);

    if (error) {
      console.error('Error creating access keys:', error);
      throw new Error(`Impossible de créer les clés d'accès : ${error.message}`);
    }

    return keys;
  }

  /** Validates a key: returns {valid, error?}. If valid, marks as used. */
  static async validateAndConsume(
    surveyId: string,
    key: string
  ): Promise<{ valid: boolean; error?: string }> {
    const upperKey = key.toUpperCase().trim();

    // Find the key
    const { data, error } = await supabase
      .from('survey_access_keys' as any)
      .select('id, is_used')
      .eq('survey_id', surveyId)
      .eq('access_key', upperKey)
      .maybeSingle() as any;

    if (error) {
      return { valid: false, error: 'Erreur de validation. Veuillez réessayer.' };
    }

    if (!data) {
      return { valid: false, error: "Clé d'accès invalide" };
    }

    if (data.is_used) {
      return { valid: false, error: 'Vous avez déjà répondu à ce questionnaire' };
    }

    // Mark as used
    const { error: updateError } = await supabase
      .from('survey_access_keys' as any)
      .update({ is_used: true, used_at: new Date().toISOString() } as any)
      .eq('id', data.id) as any;

    if (updateError) {
      return { valid: false, error: 'Erreur lors de la validation. Veuillez réessayer.' };
    }

    return { valid: true };
  }

  /** Stats: how many keys used/total for a survey */
  static async getUsageStats(
    surveyId: string
  ): Promise<{ total: number; used: number; remaining: number }> {
    const { data, error } = await supabase
      .from('survey_access_keys' as any)
      .select('is_used')
      .eq('survey_id', surveyId) as any;

    if (error || !data) {
      return { total: 0, used: 0, remaining: 0 };
    }

    const total = data.length;
    const used = data.filter((k: any) => k.is_used).length;
    return { total, used, remaining: total - used };
  }
}
