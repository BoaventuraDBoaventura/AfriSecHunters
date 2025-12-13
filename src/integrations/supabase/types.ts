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
      messages: {
        Row: {
          attachment_type: string | null
          attachment_url: string | null
          content: string
          created_at: string | null
          id: string
          report_id: string
          sender_id: string
        }
        Insert: {
          attachment_type?: string | null
          attachment_url?: string | null
          content: string
          created_at?: string | null
          id?: string
          report_id: string
          sender_id: string
        }
        Update: {
          attachment_type?: string | null
          attachment_url?: string | null
          content?: string
          created_at?: string | null
          id?: string
          report_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_transactions: {
        Row: {
          company_id: string
          completed_at: string | null
          created_at: string
          gross_amount: number
          id: string
          net_amount: number
          pentester_id: string
          pentester_paid: boolean
          pentester_paid_at: string | null
          pentester_payment_notes: string | null
          pentester_payment_reference: string | null
          platform_fee: number
          report_id: string
          status: string
          stripe_payment_intent: string | null
          stripe_session_id: string | null
        }
        Insert: {
          company_id: string
          completed_at?: string | null
          created_at?: string
          gross_amount: number
          id?: string
          net_amount: number
          pentester_id: string
          pentester_paid?: boolean
          pentester_paid_at?: string | null
          pentester_payment_notes?: string | null
          pentester_payment_reference?: string | null
          platform_fee: number
          report_id: string
          status?: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          created_at?: string
          gross_amount?: number
          id?: string
          net_amount?: number
          pentester_id?: string
          pentester_paid?: boolean
          pentester_paid_at?: string | null
          pentester_payment_notes?: string | null
          pentester_payment_reference?: string | null
          platform_fee?: number
          report_id?: string
          status?: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_transactions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company_logo: string | null
          company_name: string | null
          company_website: string | null
          created_at: string | null
          display_name: string | null
          id: string
          is_verified: boolean | null
          payout_details: Json | null
          payout_method: Database["public"]["Enums"]["payout_method"] | null
          rank_title: string | null
          role: Database["public"]["Enums"]["user_role"]
          skills: string[] | null
          total_earnings: number | null
          total_points: number | null
          updated_at: string | null
          vulnerabilities_found: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          company_logo?: string | null
          company_name?: string | null
          company_website?: string | null
          created_at?: string | null
          display_name?: string | null
          id: string
          is_verified?: boolean | null
          payout_details?: Json | null
          payout_method?: Database["public"]["Enums"]["payout_method"] | null
          rank_title?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          skills?: string[] | null
          total_earnings?: number | null
          total_points?: number | null
          updated_at?: string | null
          vulnerabilities_found?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          company_logo?: string | null
          company_name?: string | null
          company_website?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          is_verified?: boolean | null
          payout_details?: Json | null
          payout_method?: Database["public"]["Enums"]["payout_method"] | null
          rank_title?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          skills?: string[] | null
          total_earnings?: number | null
          total_points?: number | null
          updated_at?: string | null
          vulnerabilities_found?: number | null
        }
        Relationships: []
      }
      programs: {
        Row: {
          company_id: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          out_of_scope: string[] | null
          reward_critical: number | null
          reward_high: number | null
          reward_low: number | null
          reward_medium: number | null
          rules: string | null
          scope: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          out_of_scope?: string[] | null
          reward_critical?: number | null
          reward_high?: number | null
          reward_low?: number | null
          reward_medium?: number | null
          rules?: string | null
          scope?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          out_of_scope?: string[] | null
          reward_critical?: number | null
          reward_high?: number | null
          reward_low?: number | null
          reward_medium?: number | null
          rules?: string | null
          scope?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "programs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string | null
          description: string
          id: string
          impact: string | null
          pentester_id: string
          program_id: string
          proof_of_concept: string | null
          recommendation: string | null
          reward_amount: number | null
          severity: Database["public"]["Enums"]["severity_level"]
          status: Database["public"]["Enums"]["report_status"] | null
          steps_to_reproduce: string | null
          title: string
          updated_at: string | null
          vulnerability_type: Database["public"]["Enums"]["vulnerability_type"]
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          impact?: string | null
          pentester_id: string
          program_id: string
          proof_of_concept?: string | null
          recommendation?: string | null
          reward_amount?: number | null
          severity: Database["public"]["Enums"]["severity_level"]
          status?: Database["public"]["Enums"]["report_status"] | null
          steps_to_reproduce?: string | null
          title: string
          updated_at?: string | null
          vulnerability_type: Database["public"]["Enums"]["vulnerability_type"]
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          impact?: string | null
          pentester_id?: string
          program_id?: string
          proof_of_concept?: string | null
          recommendation?: string | null
          reward_amount?: number | null
          severity?: Database["public"]["Enums"]["severity_level"]
          status?: Database["public"]["Enums"]["report_status"] | null
          steps_to_reproduce?: string | null
          title?: string
          updated_at?: string | null
          vulnerability_type?: Database["public"]["Enums"]["vulnerability_type"]
        }
        Relationships: [
          {
            foreignKeyName: "reports_pentester_id_fkey"
            columns: ["pentester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_platform_stats: { Args: never; Returns: Json }
      get_rank_title: { Args: { points: number }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      payout_method: "bank_transfer" | "mpesa" | "paypal"
      report_status: "pending" | "in_review" | "accepted" | "rejected" | "paid"
      severity_level: "low" | "medium" | "high" | "critical"
      user_role: "pentester" | "company" | "admin"
      vulnerability_type:
        | "xss"
        | "sql_injection"
        | "idor"
        | "ssrf"
        | "auth_bypass"
        | "rce"
        | "other"
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
      app_role: ["admin", "moderator", "user"],
      payout_method: ["bank_transfer", "mpesa", "paypal"],
      report_status: ["pending", "in_review", "accepted", "rejected", "paid"],
      severity_level: ["low", "medium", "high", "critical"],
      user_role: ["pentester", "company", "admin"],
      vulnerability_type: [
        "xss",
        "sql_injection",
        "idor",
        "ssrf",
        "auth_bypass",
        "rce",
        "other",
      ],
    },
  },
} as const
