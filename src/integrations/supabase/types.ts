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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          care_circle_id: string | null
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          resource_id: string | null
          resource_type: string
          user_email: string | null
          user_id: string
        }
        Insert: {
          action: string
          care_circle_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type: string
          user_email?: string | null
          user_id: string
        }
        Update: {
          action?: string
          care_circle_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string
          user_email?: string | null
          user_id?: string
        }
        Relationships: []
      }
      care_circle_members: {
        Row: {
          care_circle_id: string
          created_at: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["circle_role"]
          user_id: string
        }
        Insert: {
          care_circle_id: string
          created_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["circle_role"]
          user_id: string
        }
        Update: {
          care_circle_id?: string
          created_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["circle_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_circle_members_care_circle_id_fkey"
            columns: ["care_circle_id"]
            isOneToOne: false
            referencedRelation: "care_circles"
            referencedColumns: ["id"]
          },
        ]
      }
      care_circles: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      care_recipients: {
        Row: {
          allergies: Json | null
          care_circle_id: string
          created_at: string
          date_of_birth: string | null
          id: string
          insurance_carrier: string | null
          insurance_group_number: string | null
          insurance_policy_number: string | null
          medical_conditions: string[] | null
          name: string
          photo_url: string | null
          preferred_hospital: string | null
          preferred_pharmacy: string | null
          primary_care_doctor: string | null
          standing_instructions: string[] | null
          updated_at: string
        }
        Insert: {
          allergies?: Json | null
          care_circle_id: string
          created_at?: string
          date_of_birth?: string | null
          id?: string
          insurance_carrier?: string | null
          insurance_group_number?: string | null
          insurance_policy_number?: string | null
          medical_conditions?: string[] | null
          name: string
          photo_url?: string | null
          preferred_hospital?: string | null
          preferred_pharmacy?: string | null
          primary_care_doctor?: string | null
          standing_instructions?: string[] | null
          updated_at?: string
        }
        Update: {
          allergies?: Json | null
          care_circle_id?: string
          created_at?: string
          date_of_birth?: string | null
          id?: string
          insurance_carrier?: string | null
          insurance_group_number?: string | null
          insurance_policy_number?: string | null
          medical_conditions?: string[] | null
          name?: string
          photo_url?: string | null
          preferred_hospital?: string | null
          preferred_pharmacy?: string | null
          primary_care_doctor?: string | null
          standing_instructions?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_recipients_care_circle_id_fkey"
            columns: ["care_circle_id"]
            isOneToOne: false
            referencedRelation: "care_circles"
            referencedColumns: ["id"]
          },
        ]
      }
      health_alerts: {
        Row: {
          acknowledged_by: string[] | null
          action_needed: string | null
          care_circle_id: string
          complexity: string
          correlations: Json | null
          created_at: string
          estimated_cost: number | null
          id: string
          input_tokens: number | null
          message: string
          model_used: string
          output_tokens: number | null
          reading_id: string | null
          response_time_ms: number | null
          severity: string
          title: string
        }
        Insert: {
          acknowledged_by?: string[] | null
          action_needed?: string | null
          care_circle_id: string
          complexity?: string
          correlations?: Json | null
          created_at?: string
          estimated_cost?: number | null
          id?: string
          input_tokens?: number | null
          message: string
          model_used?: string
          output_tokens?: number | null
          reading_id?: string | null
          response_time_ms?: number | null
          severity: string
          title: string
        }
        Update: {
          acknowledged_by?: string[] | null
          action_needed?: string | null
          care_circle_id?: string
          complexity?: string
          correlations?: Json | null
          created_at?: string
          estimated_cost?: number | null
          id?: string
          input_tokens?: number | null
          message?: string
          model_used?: string
          output_tokens?: number | null
          reading_id?: string | null
          response_time_ms?: number | null
          severity?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_alerts_care_circle_id_fkey"
            columns: ["care_circle_id"]
            isOneToOne: false
            referencedRelation: "care_circles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_alerts_reading_id_fkey"
            columns: ["reading_id"]
            isOneToOne: false
            referencedRelation: "health_readings"
            referencedColumns: ["id"]
          },
        ]
      }
      health_readings: {
        Row: {
          care_circle_id: string
          care_recipient_id: string
          created_at: string
          id: string
          logged_by: string
          logged_by_name: string
          metadata: Json | null
          notes: string | null
          source: string
          type: string
          unit: string
          value_primary: number
          value_secondary: number | null
          value_tertiary: number | null
        }
        Insert: {
          care_circle_id: string
          care_recipient_id: string
          created_at?: string
          id?: string
          logged_by: string
          logged_by_name: string
          metadata?: Json | null
          notes?: string | null
          source?: string
          type: string
          unit: string
          value_primary: number
          value_secondary?: number | null
          value_tertiary?: number | null
        }
        Update: {
          care_circle_id?: string
          care_recipient_id?: string
          created_at?: string
          id?: string
          logged_by?: string
          logged_by_name?: string
          metadata?: Json | null
          notes?: string | null
          source?: string
          type?: string
          unit?: string
          value_primary?: number
          value_secondary?: number | null
          value_tertiary?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "health_readings_care_circle_id_fkey"
            columns: ["care_circle_id"]
            isOneToOne: false
            referencedRelation: "care_circles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
        }
        Relationships: []
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
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_app_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_circle_admin: { Args: { _circle_id: string }; Returns: boolean }
      is_circle_member: { Args: { _circle_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "super_admin"
      circle_role: "admin" | "caregiver" | "view-only"
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
      app_role: ["super_admin"],
      circle_role: ["admin", "caregiver", "view-only"],
    },
  },
} as const
