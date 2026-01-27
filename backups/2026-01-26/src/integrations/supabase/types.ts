export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_banking_scores: {
        Row: {
          ai_analysis: Json | null
          benchmark_position: string | null
          company_id: string
          confidence_level: number | null
          created_at: string | null
          factors: Json | null
          global_score: number | null
          id: string
          module_scores: Json | null
          recommended_rate: number | null
          risk_level: string | null
          score_date: string | null
          updated_at: string | null
        }
        Insert: {
          ai_analysis?: Json | null
          benchmark_position?: string | null
          company_id: string
          confidence_level?: number | null
          created_at?: string | null
          factors?: Json | null
          global_score?: number | null
          id?: string
          module_scores?: Json | null
          recommended_rate?: number | null
          risk_level?: string | null
          score_date?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_analysis?: Json | null
          benchmark_position?: string | null
          company_id?: string
          confidence_level?: number | null
          created_at?: string | null
          factors?: Json | null
          global_score?: number | null
          id?: string
          module_scores?: Json | null
          recommended_rate?: number | null
          risk_level?: string | null
          score_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_banking_scores_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      banker_access_grants: {
        Row: {
          access_type: string
          banker_user_id: string
          company_id: string
          created_at: string | null
          expires_at: string | null
          granted_at: string | null
          granted_by_user_id: string
          id: string
          is_active: boolean | null
          module_number: number
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          access_type?: string
          banker_user_id: string
          company_id: string
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          granted_by_user_id: string
          id?: string
          is_active?: boolean | null
          module_number: number
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          access_type?: string
          banker_user_id?: string
          company_id?: string
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          granted_by_user_id?: string
          id?: string
          is_active?: boolean | null
          module_number?: number
          notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "banker_access_grants_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          Row: {
            created_at: string | null
            employees_count: number | null
            id: string
            industry: string | null
            invitation_code: string | null
            name: string
            owner_user_id: string
            schema_name: string
            slug: string
            updated_at: string | null
          }
          Insert: {
            created_at?: string | null
            employees_count?: number | null
            id?: string
            industry?: string | null
            invitation_code?: string | null
            name: string
            owner_user_id: string
            schema_name: string
            slug: string
            updated_at?: string | null
          }
          Update: {
            created_at?: string | null
            employees_count?: number | null
            id?: string
            industry?: string | null
            invitation_code?: string | null
            name?: string
            owner_user_id?: string
            schema_name?: string
            slug?: string
            updated_at?: string | null
          }
          Relationships: []
        }
        company_performance_scores: {
          Row: {
            calculation_date: string | null
            company_id: string
            created_at: string | null
            factors: Json | null
            id: string
            module_number: number
            recommended_rate: number | null
            risk_level: string
            score_value: number
          }
          Insert: {
            calculation_date?: string | null
            company_id: string
            created_at?: string | null
            factors?: Json | null
            id?: string
            module_number: number
            recommended_rate?: number | null
            risk_level: string
            score_value: number
          }
          Update: {
            calculation_date?: string | null
            company_id?: string
            created_at?: string | null
            factors?: Json | null
            id?: string
            module_number?: number
            recommended_rate?: number | null
            risk_level?: string
            score_value?: number
          }
          Relationships: [
            {
              foreignKeyName: "company_performance_scores_company_id_fkey"
              columns: ["company_id"]
              isOneToOne: false
              referencedRelation: "companies"
              referencedColumns: ["id"]
            },
          ]
        }
        modules: {
          Row: {
            created_at: string
            description: string | null
            icon: string | null
            id: string
            is_active: boolean
            name: string
            order_index: number
            route: string
          }
          Insert: {
            created_at?: string
            description?: string | null
            icon?: string | null
            id?: string
            is_active?: boolean
            name: string
            order_index?: number
            route: string
          }
          Update: {
            created_at?: string
            description?: string | null
            icon?: string | null
            id?: string
            is_active?: boolean
            name?: string
            order_index?: number
            route?: string
          }
          Relationships: []
        }
        performance_cards: {
          Row: {
            achievements: Json | null
            company_id: string
            created_at: string | null
            department: string | null
            id: string
            period_end: string
            period_start: string
            period_type: string
            ranking_position: number | null
            scores: Json
            team_name: string | null
            total_points: number | null
            updated_at: string | null
            user_id: string
          }
          Insert: {
            achievements?: Json | null
            company_id: string
            created_at?: string | null
            department?: string | null
            id?: string
            period_end: string
            period_start: string
            period_type: string
            ranking_position?: number | null
            scores?: Json
            team_name?: string | null
            total_points?: number | null
            updated_at?: string | null
            user_id: string
          }
          Update: {
            achievements?: Json | null
            company_id?: string
            created_at?: string | null
            department?: string | null
            id?: string
            period_end?: string
            period_start?: string
            period_type?: string
            ranking_position?: number | null
            scores?: Json
            team_name?: string | null
            total_points?: number | null
            updated_at?: string | null
            user_id?: string
          }
          Relationships: [
            {
              foreignKeyName: "performance_cards_company_id_fkey"
              columns: ["company_id"]
              isOneToOne: false
              referencedRelation: "companies"
              referencedColumns: ["id"]
            },
          ]
        }
        performance_indicators: {
          Row: {
            actual_value: number | null
            company_id: string
            cost_impact: number | null
            created_at: string | null
            created_by: string | null
            id: string
            indicator_type: string
            notes: string | null
            target_value: number | null
            updated_at: string | null
            week_number: number
            year: number
          }
          Insert: {
            actual_value?: number | null
            company_id: string
            cost_impact?: number | null
            created_at?: string | null
            created_by?: string | null
            id?: string
            indicator_type: string
            notes?: string | null
            target_value?: number | null
            updated_at?: string | null
            week_number: number
            year: number
          }
          Update: {
            actual_value?: number | null
            company_id?: string
            cost_impact?: number | null
            created_at?: string | null
            created_by?: string | null
            id?: string
            indicator_type?: string
            notes?: string | null
            target_value?: number | null
            updated_at?: string | null
            week_number?: number
            year?: number
          }
          Relationships: [
            {
              foreignKeyName: "performance_indicators_company_id_fkey"
              columns: ["company_id"]
              isOneToOne: false
              referencedRelation: "companies"
              referencedColumns: ["id"]
            },
          ]
        }
        profiles: {
          Row: {
            avatar_url: string | null
            bank_name: string | null
            company_id: string | null
            company_name: string | null
            consulting_firm: string | null
            created_at: string
            department: string | null
            email: string
            employee_id: string | null
            first_name: string | null
            full_name: string | null
            id: string
            last_name: string | null
            license_number: string | null
            phone: string | null
            position: string | null
            team_name: string | null
            updated_at: string
          }
          Insert: {
            avatar_url?: string | null
            bank_name?: string | null
            company_id?: string | null
            company_name?: string | null
            consulting_firm?: string | null
            created_at?: string
            department?: string | null
            email: string
            employee_id?: string | null
            first_name?: string | null
            full_name?: string | null
            id: string
            last_name?: string | null
            license_number?: string | null
            phone?: string | null
            position?: string | null
            team_name?: string | null
            updated_at?: string
          }
          Update: {
            avatar_url?: string | null
            bank_name?: string | null
            company_id?: string | null
            company_name?: string | null
            consulting_firm?: string | null
            created_at?: string
            department?: string | null
            email?: string
            employee_id?: string | null
            first_name?: string | null
            full_name?: string | null
            id?: string
            last_name?: string | null
            license_number?: string | null
            phone?: string | null
            position?: string | null
            team_name?: string | null
            updated_at?: string
          }
          Relationships: [
            {
              foreignKeyName: "profiles_company_id_fkey"
              columns: ["company_id"]
              isOneToOne: false
              referencedRelation: "companies"
              referencedColumns: ["id"]
            },
          ]
        }
        subscription_ai_limits: {
          Row: {
            advanced_analytics: boolean | null
            ai_calls_per_month: number | null
            ai_enabled: boolean | null
            banking_score: boolean | null
            created_at: string | null
            custom_prompts: boolean | null
            features: Json | null
            id: string
            plan_type: string
            predictive_ai: boolean | null
          }
          Insert: {
            advanced_analytics?: boolean | null
            ai_calls_per_month?: number | null
            ai_enabled?: boolean | null
            banking_score?: boolean | null
            created_at?: string | null
            custom_prompts?: boolean | null
            features?: Json | null
            id?: string
            plan_type: string
            predictive_ai?: boolean | null
          }
          Update: {
            advanced_analytics?: boolean | null
            ai_calls_per_month?: number | null
            ai_enabled?: boolean | null
            banking_score?: boolean | null
            created_at?: string | null
            custom_prompts?: boolean | null
            features?: Json | null
            id?: string
            plan_type?: string
            predictive_ai?: boolean | null
          }
          Relationships: []
        }
        survey_responses: {
          Row: {
            id: string
            ip_address: unknown
            responses: Json
            submitted_at: string | null
            survey_id: string
            user_agent: string | null
          }
          Insert: {
            id?: string
            ip_address?: unknown
            responses?: Json
            submitted_at?: string | null
            survey_id: string
            user_agent?: string | null
          }
          Update: {
            id?: string
            ip_address?: unknown
            responses?: Json
            submitted_at?: string | null
            survey_id?: string
            user_agent?: string | null
          }
          Relationships: [
            {
              foreignKeyName: "survey_responses_survey_id_fkey"
              columns: ["survey_id"]
              isOneToOne: false
              referencedRelation: "surveys"
              referencedColumns: ["id"]
            },
          ]
        }
        surveys: {
          Row: {
            access_code: string
            company_id: string
            created_at: string | null
            created_by: string | null
            description: string | null
            end_date: string | null
            id: string
            is_active: boolean | null
            is_anonymous: boolean | null
            questions: Json
            start_date: string | null
            title: string
            updated_at: string | null
          }
          Insert: {
            access_code: string
            company_id: string
            created_at?: string | null
            created_by?: string | null
            description?: string | null
            end_date?: string | null
            id?: string
            is_active?: boolean | null
            is_anonymous?: boolean | null
            questions?: Json
            start_date?: string | null
            title: string
            updated_at?: string | null
          }
          Update: {
            access_code?: string
            company_id?: string
            created_at?: string | null
            created_by?: string | null
            description?: string | null
            end_date?: string | null
            id?: string
            is_active?: boolean | null
            is_anonymous?: boolean | null
            questions?: Json
            start_date?: string | null
            title?: string
            updated_at?: string | null
          }
          Relationships: [
            {
              foreignKeyName: "surveys_company_id_fkey"
              columns: ["company_id"]
              isOneToOne: false
              referencedRelation: "companies"
              referencedColumns: ["id"]
            },
          ]
        }
        team_performance: {
          Row: {
            company_id: string
            cost_savings: number | null
            created_at: string | null
            id: string
            notes: string | null
            performance_metrics: Json
            team_leader_id: string
            team_name: string
            updated_at: string | null
            validated_at: string | null
            validated_by: string | null
            week_number: number
            year: number
          }
          Insert: {
            company_id: string
            cost_savings?: number | null
            created_at?: string | null
            id?: string
            notes?: string | null
            performance_metrics?: Json
            team_leader_id: string
            team_name: string
            updated_at?: string | null
            validated_at?: string | null
            validated_by?: string | null
            week_number: number
            year: number
          }
          Update: {
            company_id?: string
            cost_savings?: number | null
            created_at?: string | null
            id?: string
            notes?: string | null
            performance_metrics?: Json
            team_leader_id?: string
            team_name?: string
            updated_at?: string | null
            validated_at?: string | null
            validated_by?: string | null
            week_number?: number
            year?: number
          }
          Relationships: [
            {
              foreignKeyName: "team_performance_company_id_fkey"
              columns: ["company_id"]
              isOneToOne: false
              referencedRelation: "companies"
              referencedColumns: ["id"]
            },
          ]
        }
        user_roles: {
          Row: {
            created_at: string
            id: string
            role: Database["public"]["Enums"]["app_role"]
            user_id: string
          }
          Insert: {
            created_at?: string
            id?: string
            role: Database["public"]["Enums"]["app_role"]
            user_id: string
          }
          Update: {
            created_at?: string
            id?: string
            role?: Database["public"]["Enums"]["app_role"]
            user_id?: string
          }
          Relationships: [
            {
              foreignKeyName: "user_roles_user_id_fkey"
              columns: ["user_id"]
              isOneToOne: false
              referencedRelation: "profiles"
              referencedColumns: ["id"]
            },
          ]
        }
        user_subscriptions: {
          Row: {
            created_at: string
            credits_remaining: number
            current_period_end: string | null
            current_period_start: string | null
            id: string
            plan_type: string
            status: string
            stripe_customer_id: string | null
            stripe_subscription_id: string | null
            updated_at: string
            user_id: string
          }
          Insert: {
            created_at?: string
            credits_remaining?: number
            current_period_end?: string | null
            current_period_start?: string | null
            id?: string
            plan_type?: string
            status?: string
            stripe_customer_id?: string | null
            stripe_subscription_id?: string | null
            updated_at?: string
            user_id: string
          }
          Update: {
            created_at?: string
            credits_remaining?: number
            current_period_end?: string | null
            current_period_start?: string | null
            id?: string
            plan_type?: string
            status?: string
            stripe_customer_id?: string | null
            stripe_subscription_id?: string | null
            updated_at?: string
            user_id?: string
          }
          Relationships: [
            {
              foreignKeyName: "user_subscriptions_user_id_fkey"
              columns: ["user_id"]
              isOneToOne: false
              referencedRelation: "profiles"
              referencedColumns: ["id"]
            },
          ]
        }
      }
      Views: {
        [_ in never]: never
      }
      Functions: {
        generate_invitation_code: { Args: never; Returns: string }
        get_company_invitation_code: {
          Args: { company_uuid: string }
          Returns: string
        }
        has_role: {
          Args: {
            _role: Database["public"]["Enums"]["app_role"]
            _user_id: string
          }
          Returns: boolean
        }
        update_user_role: {
          Args: {
            new_role: Database["public"]["Enums"]["app_role"]
            target_user_id: string
          }
          Returns: undefined
        }
        verify_invitation_code: { Args: { code: string }; Returns: string }
      }
      Enums: {
        app_role:
        | "admin"
        | "user"
        | "manager"
        | "CEO"
        | "CONSULTANT"
        | "RH_MANAGER"
        | "EMPLOYEE"
        | "TEAM_LEADER"
        | "BANQUIER"
      }
      CompositeTypes: {
        [_ in never]: never
      }
    }
  }

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "user",
        "manager",
        "CEO",
        "CONSULTANT",
        "RH_MANAGER",
        "EMPLOYEE",
        "TEAM_LEADER",
        "BANQUIER",
      ],
    },
  },
} as const
