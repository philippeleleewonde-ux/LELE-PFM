// ============================================
// BUSINESS LINES TYPES
// Shared between Module 1 and Module 3
// ============================================

/**
 * Business Line - Ligne d'activité d'une entreprise
 * Utilisé par:
 * - Module 1: HCM Performance Plan (configuration)
 * - Module 3: HCM Cost Savings (sélection + teams)
 */
export interface BusinessLine {
  id: string; // UUID
  user_id: string; // UUID - Créateur de la ligne
  company_id?: string; // ID entreprise (manuel, non UUID)

  // Business Info
  activity_name: string; // Nom de la ligne d'activité
  staff_count: number; // Nombre d'employés total
  team_count: number; // Nombre d'équipes
  budget: number; // Budget en milliers (k€, k$, etc.)

  // Calculated fields (optional)
  budget_rate?: number; // Pourcentage du budget total (0-100)
  staff_rate?: number; // Pourcentage du staff total (0-100)

  // Display
  display_order?: number; // Ordre d'affichage (1, 2, 3...)

  // Metadata
  source: 'manual' | 'datascanner' | 'import'; // Origine de la donnée
  is_active: boolean; // Active/Inactive

  // Timestamps
  created_at: string; // ISO date
  updated_at: string; // ISO date
}

/**
 * Business Line Insert - Pour création en DB
 */
export interface BusinessLineInsert {
  user_id: string;
  company_id?: string;
  activity_name: string;
  staff_count: number;
  team_count: number;
  budget: number;
  budget_rate?: number;
  staff_rate?: number;
  display_order?: number;
  source?: 'manual' | 'datascanner' | 'import';
  is_active?: boolean;
}

/**
 * Business Line Update - Pour mise à jour
 */
export interface BusinessLineUpdate {
  activity_name?: string;
  staff_count?: number;
  team_count?: number;
  budget?: number;
  budget_rate?: number;
  staff_rate?: number;
  display_order?: number;
  is_active?: boolean;
}

/**
 * Business Lines Stats - Vue agrégée
 * Calculée automatiquement par la view `business_lines_stats`
 */
export interface BusinessLinesStats {
  user_id: string;
  company_id?: string;
  total_lines: number; // Nombre total de lignes
  total_staff: number; // Total employés
  total_teams: number; // Total équipes
  total_budget: number; // Budget total
  avg_budget: number; // Budget moyen
  last_created_at: string; // Dernière création
}

/**
 * Business Line with Teams (Module 3)
 * Extension avec les équipes associées
 */
export interface BusinessLineWithTeams extends BusinessLine {
  teams?: Team[]; // Équipes de cette ligne d'activité
}

/**
 * Team - Équipe dans une ligne d'activité (Module 3)
 */
export interface Team {
  id: string; // UUID
  business_line_id: string; // UUID - Référence à la ligne d'activité
  team_name: string; // Nom de l'équipe
  team_leader: string; // Nom du chef d'équipe
  team_mission: string; // Mission principale de l'équipe
  employee_count: number; // Nombre d'employés dans l'équipe (max 100)

  // Metadata
  created_by: string; // UUID user_id
  created_at: string;
  updated_at: string;
}

/**
 * Filters for querying business lines
 */
export interface BusinessLineFilters {
  user_id?: string;
  company_id?: string;
  is_active?: boolean;
  source?: 'manual' | 'datascanner' | 'import';
}

/**
 * Sort options
 */
export type BusinessLineSortBy =
  | 'activity_name'
  | 'staff_count'
  | 'budget'
  | 'created_at'
  | 'display_order';

export type SortOrder = 'asc' | 'desc';
