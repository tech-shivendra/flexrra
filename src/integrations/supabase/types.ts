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
      admin_emails: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      check_ins: {
        Row: {
          check_in_time: string
          check_in_type: string | null
          gym_address: string | null
          gym_city: string | null
          gym_id: string
          gym_name: string | null
          id: string
          session_deducted: boolean | null
          status: string | null
          user_id: string
        }
        Insert: {
          check_in_time?: string
          check_in_type?: string | null
          gym_address?: string | null
          gym_city?: string | null
          gym_id: string
          gym_name?: string | null
          id?: string
          session_deducted?: boolean | null
          status?: string | null
          user_id: string
        }
        Update: {
          check_in_time?: string
          check_in_type?: string | null
          gym_address?: string | null
          gym_city?: string | null
          gym_id?: string
          gym_name?: string | null
          id?: string
          session_deducted?: boolean | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          discount_percent: number
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          discount_percent: number
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          discount_percent?: number
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      gym_images: {
        Row: {
          created_at: string
          gym_id: string
          id: string
          image_url: string
          is_primary: boolean
        }
        Insert: {
          created_at?: string
          gym_id: string
          id?: string
          image_url: string
          is_primary?: boolean
        }
        Update: {
          created_at?: string
          gym_id?: string
          id?: string
          image_url?: string
          is_primary?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "gym_images_gym_id_fkey"
            columns: ["gym_id"]
            isOneToOne: false
            referencedRelation: "gyms"
            referencedColumns: ["id"]
          },
        ]
      }
      gyms: {
        Row: {
          address: string
          amenities: string[] | null
          city: string
          close_time: string
          created_at: string
          facilities: string[] | null
          id: string
          name: string
          open_time: string
          phone: string | null
          pincode: string | null
          qr_code: string
          status: string
        }
        Insert: {
          address: string
          amenities?: string[] | null
          city: string
          close_time?: string
          created_at?: string
          facilities?: string[] | null
          id?: string
          name: string
          open_time?: string
          phone?: string | null
          pincode?: string | null
          qr_code?: string
          status?: string
        }
        Update: {
          address?: string
          amenities?: string[] | null
          city?: string
          close_time?: string
          created_at?: string
          facilities?: string[] | null
          id?: string
          name?: string
          open_time?: string
          phone?: string | null
          pincode?: string | null
          qr_code?: string
          status?: string
        }
        Relationships: []
      }
      phone_otps: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          otp: string
          phone: string
          verified: boolean
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          otp: string
          phone: string
          verified?: boolean
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          otp?: string
          phone?: string
          verified?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          created_at: string
          email: string
          gender: string | null
          home_area: string | null
          id: string
          name: string
          phone: string | null
          subscription_end_date: string | null
          subscription_start_date: string | null
          subscription_status: string | null
          updated_at: string
        }
        Insert: {
          age?: number | null
          created_at?: string
          email: string
          gender?: string | null
          home_area?: string | null
          id: string
          name: string
          phone?: string | null
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          updated_at?: string
        }
        Update: {
          age?: number | null
          created_at?: string
          email?: string
          gender?: string | null
          home_area?: string | null
          id?: string
          name?: string
          phone?: string | null
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string
          description: string | null
          duration_days: number
          id: string
          is_active: boolean
          name: string
          price: number
          sessions: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_days?: number
          id?: string
          is_active?: boolean
          name: string
          price: number
          sessions?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_days?: number
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          sessions?: number
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          coupon_code: string | null
          created_at: string
          discount_percent: number | null
          end_date: string
          id: string
          original_price: number | null
          pause_count: number
          paused_at: string | null
          plan: string
          price: number
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          remaining_sessions: number
          resumed_at: string | null
          start_date: string
          status: string
          total_sessions: number
          user_id: string
        }
        Insert: {
          coupon_code?: string | null
          created_at?: string
          discount_percent?: number | null
          end_date: string
          id?: string
          original_price?: number | null
          pause_count?: number
          paused_at?: string | null
          plan?: string
          price?: number
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          remaining_sessions?: number
          resumed_at?: string | null
          start_date?: string
          status?: string
          total_sessions?: number
          user_id: string
        }
        Update: {
          coupon_code?: string | null
          created_at?: string
          discount_percent?: number | null
          end_date?: string
          id?: string
          original_price?: number | null
          pause_count?: number
          paused_at?: string | null
          plan?: string
          price?: number
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          remaining_sessions?: number
          resumed_at?: string | null
          start_date?: string
          status?: string
          total_sessions?: number
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: { user_email: string }; Returns: boolean }
      pause_subscription: { Args: never; Returns: Json }
      resume_subscription: { Args: never; Returns: Json }
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
