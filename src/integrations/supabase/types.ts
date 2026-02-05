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
          created_at: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      cars: {
        Row: {
          capacity: number
          created_at: string
          id: string
          is_active: boolean
          name: string
          plate_number: string
          region: string
          updated_at: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          plate_number: string
          region: string
          updated_at?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          plate_number?: string
          region?: string
          updated_at?: string
        }
        Relationships: []
      }
      driver_positions: {
        Row: {
          accuracy_m: number | null
          id: number
          lat: number
          lng: number
          sent_at: string | null
          session_id: string
          speed_m_s: number | null
        }
        Insert: {
          accuracy_m?: number | null
          id?: number
          lat: number
          lng: number
          sent_at?: string | null
          session_id: string
          speed_m_s?: number | null
        }
        Update: {
          accuracy_m?: number | null
          id?: number
          lat?: number
          lng?: number
          sent_at?: string | null
          session_id?: string
          speed_m_s?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_positions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "driver_tracking_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          is_approved: boolean
          license_image_url: string | null
          rating: number | null
          total_trips: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          license_image_url?: string | null
          rating?: number | null
          total_trips?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          license_image_url?: string | null
          rating?: number | null
          total_trips?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      driver_tracking_sessions: {
        Row: {
          allows_background: boolean | null
          consent_at: string
          created_at: string | null
          driver_id: string
          ended_at: string | null
          id: string
          started_at: string
          status: string
          trip_id: string
        }
        Insert: {
          allows_background?: boolean | null
          consent_at: string
          created_at?: string | null
          driver_id: string
          ended_at?: string | null
          id?: string
          started_at: string
          status?: string
          trip_id: string
        }
        Update: {
          allows_background?: boolean | null
          consent_at?: string
          created_at?: string | null
          driver_id?: string
          ended_at?: string | null
          id?: string
          started_at?: string
          status?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_tracking_sessions_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_tracking_sessions_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      passenger_ratings: {
        Row: {
          created_at: string
          driver_id: string
          id: string
          passenger_id: string
          rating: number
          reservation_id: string
        }
        Insert: {
          created_at?: string
          driver_id: string
          id?: string
          passenger_id: string
          rating: number
          reservation_id: string
        }
        Update: {
          created_at?: string
          driver_id?: string
          id?: string
          passenger_id?: string
          rating?: number
          reservation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "passenger_ratings_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: true
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          phone: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          is_active?: boolean
          name: string
          phone: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          created_at: string
          id: string
          payment_proof_url: string | null
          payment_status: string
          payment_transaction_id: string | null
          queue_position: number
          seats_count: number
          status: string
          trip_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          payment_proof_url?: string | null
          payment_status?: string
          payment_transaction_id?: string | null
          queue_position: number
          seats_count?: number
          status?: string
          trip_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          payment_proof_url?: string | null
          payment_status?: string
          payment_transaction_id?: string | null
          queue_position?: number
          seats_count?: number
          status?: string
          trip_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message: string
          recipient_phone: string
          status: string
          test_mode: boolean
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message: string
          recipient_phone: string
          status?: string
          test_mode?: boolean
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message?: string
          recipient_phone?: string
          status?: string
          test_mode?: boolean
        }
        Relationships: []
      }
      trips: {
        Row: {
          available_seats: number
          car_id: string
          created_at: string
          departure_time: string
          destination: string
          driver_id: string | null
          id: string
          is_full: boolean
          origin: string
          price: number
          status: string
          trip_date: string
          updated_at: string
        }
        Insert: {
          available_seats: number
          car_id: string
          created_at?: string
          departure_time: string
          destination: string
          driver_id?: string | null
          id?: string
          is_full?: boolean
          origin: string
          price: number
          status?: string
          trip_date: string
          updated_at?: string
        }
        Update: {
          available_seats?: number
          car_id?: string
          created_at?: string
          departure_time?: string
          destination?: string
          driver_id?: string | null
          id?: string
          is_full?: boolean
          origin?: string
          price?: number
          status?: string
          trip_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
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
          role?: Database["public"]["Enums"]["app_role"]
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
      votes: {
        Row: {
          created_at: string
          id: string
          trip_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          trip_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_set_role: {
        Args: {
          p_role: Database["public"]["Enums"]["app_role"]
          p_user_id: string
        }
        Returns: boolean
      }
      allocate_seats_atomic: {
        Args: {
          p_payment_proof_url?: string
          p_payment_transaction_id?: string
          p_seats_count: number
          p_trip_id: string
          p_user_id: string
        }
        Returns: {
          error_code: string
          error_message: string
          queue_position: number
          reservation_id: string
          success: boolean
        }[]
      }
      driver_view_for_trip: {
        Args: { p_trip_id: string }
        Returns: {
          order_number: number
          phone: string
          reservation_id: string
          seats: number
          status: string
        }[]
      }
      get_driver_trip_passengers: {
        Args: { trip_uuid: string }
        Returns: {
          passenger_name: string
          passenger_phone: string
          payment_status: string
          queue_position: number
          reservation_id: string
          seats_count: number
          status: string
        }[]
      }
      get_passenger_name: { Args: { passenger_id: string }; Returns: string }
      get_tracking_positions_secure: {
        Args: { p_limit?: number; p_session_id: string }
        Returns: {
          accuracy_m: number
          lat: number
          lng: number
          sent_at: string
          speed_m_s: number
        }[]
      }
      get_trip_queue: {
        Args: { trip_uuid: string }
        Returns: {
          passenger_name: string
          queue_position: number
          seats_count: number
          status: string
        }[]
      }
      get_trip_vote_count: { Args: { trip_uuid: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_action: {
        Args: {
          p_action: string
          p_new_data?: Json
          p_old_data?: Json
          p_record_id?: string
          p_table_name: string
        }
        Returns: string
      }
      passenger_queue_view: {
        Args: { p_trip_id: string }
        Returns: {
          avatar_url: string
          order_number: number
          passenger_name: string
          reservation_id: string
          seats: number
          status: string
        }[]
      }
      purge_old_tracking_positions: {
        Args: { retention_days?: number }
        Returns: number
      }
    }
    Enums: {
      app_role: "passenger" | "driver" | "admin"
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
      app_role: ["passenger", "driver", "admin"],
    },
  },
} as const
