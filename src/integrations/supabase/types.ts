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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      contest_bookmarks: {
        Row: {
          contest_id: number
          contest_name: string
          created_at: string
          start_time: string
          user_id: string
        }
        Insert: {
          contest_id: number
          contest_name: string
          created_at?: string
          start_time: string
          user_id: string
        }
        Update: {
          contest_id?: number
          contest_name?: string
          created_at?: string
          start_time?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_sheet_completions: {
        Row: {
          completed_at: string
          date: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          date: string
          user_id: string
        }
        Update: {
          completed_at?: string
          date?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          data: Json | null
          id: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          codeforces_handle: string | null
          created_at: string
          display_name: string | null
          id: string
          target_rating: number | null
          updated_at: string
        }
        Insert: {
          codeforces_handle?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          target_rating?: number | null
          updated_at?: string
        }
        Update: {
          codeforces_handle?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          target_rating?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      solved_problems: {
        Row: {
          platform: string
          problem_key: string
          solved_at: string
          user_id: string
        }
        Insert: {
          platform: string
          problem_key: string
          solved_at?: string
          user_id: string
        }
        Update: {
          platform?: string
          problem_key?: string
          solved_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_platforms: {
        Row: {
          contest_count: number
          created_at: string
          id: string
          is_manual: boolean
          last_synced_at: string | null
          max_rating: number | null
          platform: string
          problems_solved: number
          rank_label: string | null
          rating: number | null
          raw_data: Json | null
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          contest_count?: number
          created_at?: string
          id?: string
          is_manual?: boolean
          last_synced_at?: string | null
          max_rating?: number | null
          platform: string
          problems_solved?: number
          rank_label?: string | null
          rating?: number | null
          raw_data?: Json | null
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          contest_count?: number
          created_at?: string
          id?: string
          is_manual?: boolean
          last_synced_at?: string | null
          max_rating?: number | null
          platform?: string
          problems_solved?: number
          rank_label?: string | null
          rating?: number | null
          raw_data?: Json | null
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          language: string
          notif_achievement: boolean
          notif_contest_reg: boolean
          notif_contest_start: boolean
          notif_practice: boolean
          notif_weekly: boolean
          sound_enabled: boolean
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          language?: string
          notif_achievement?: boolean
          notif_contest_reg?: boolean
          notif_contest_start?: boolean
          notif_practice?: boolean
          notif_weekly?: boolean
          sound_enabled?: boolean
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          language?: string
          notif_achievement?: boolean
          notif_contest_reg?: boolean
          notif_contest_start?: boolean
          notif_practice?: boolean
          notif_weekly?: boolean
          sound_enabled?: boolean
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
