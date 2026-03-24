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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          description: string | null
          footer_note_extra: string | null
          footer_note_flour: string | null
          footer_note_slices: string | null
          has_pizza_size_pricing: boolean
          id: number
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          footer_note_extra?: string | null
          footer_note_flour?: string | null
          footer_note_slices?: string | null
          has_pizza_size_pricing?: boolean
          id?: never
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          footer_note_extra?: string | null
          footer_note_flour?: string | null
          footer_note_slices?: string | null
          has_pizza_size_pricing?: boolean
          id?: never
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      custom_sections: {
        Row: {
          columns_per_row: number
          created_at: string
          has_paper_texture: boolean
          id: number
          is_active: boolean
          page_key: string
          section_key: string
          sort_order: number
          title: string | null
          updated_at: string
        }
        Insert: {
          columns_per_row?: number
          created_at?: string
          has_paper_texture?: boolean
          id?: never
          is_active?: boolean
          page_key?: string
          section_key: string
          sort_order?: number
          title?: string | null
          updated_at?: string
        }
        Update: {
          columns_per_row?: number
          created_at?: string
          has_paper_texture?: boolean
          id?: never
          is_active?: boolean
          page_key?: string
          section_key?: string
          sort_order?: number
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      gallery_images: {
        Row: {
          alt_text: string | null
          created_at: string
          id: number
          image_url: string
          is_active: boolean
          section_key: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: never
          image_url: string
          is_active?: boolean
          section_key: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: never
          image_url?: string
          is_active?: boolean
          section_key?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      nav_links: {
        Row: {
          column_key: string
          created_at: string
          id: number
          is_active: boolean
          label: string
          sort_order: number
          updated_at: string
          url: string
        }
        Insert: {
          column_key?: string
          created_at?: string
          id?: never
          is_active?: boolean
          label: string
          sort_order?: number
          updated_at?: string
          url: string
        }
        Update: {
          column_key?: string
          created_at?: string
          id?: never
          is_active?: boolean
          label?: string
          sort_order?: number
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      page_contents: {
        Row: {
          content: string | null
          created_at: string
          id: number
          image_url: string | null
          is_active: boolean
          page_key: string
          section_key: string
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: never
          image_url?: string | null
          is_active?: boolean
          page_key: string
          section_key: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: never
          image_url?: string | null
          is_active?: boolean
          page_key?: string
          section_key?: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category_id: number
          created_at: string
          description: string | null
          id: number
          image_url: string | null
          is_active: boolean
          is_featured: boolean
          is_house_wine: boolean
          name: string
          country_origin: string | null
          origin_country: string | null
          price: number
          price_glass: number | null
          price_half_carafe: number | null
          price_carafe: number | null
          price_half_pitcher: number | null
          price_pitcher: number | null
          short_description: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category_id: number
          created_at?: string
          description?: string | null
          id?: never
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          is_house_wine?: boolean
          name: string
          country_origin?: string | null
          origin_country?: string | null
          price: number
          price_glass?: number | null
          price_half_carafe?: number | null
          price_carafe?: number | null
          price_half_pitcher?: number | null
          price_pitcher?: number | null
          short_description?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category_id?: number
          created_at?: string
          description?: string | null
          id?: never
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          is_house_wine?: boolean
          name?: string
          country_origin?: string | null
          origin_country?: string | null
          price?: number
          price_glass?: number | null
          price_half_carafe?: number | null
          price_carafe?: number | null
          price_half_pitcher?: number | null
          price_pitcher?: number | null
          short_description?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      section_elements: {
        Row: {
          content: string | null
          created_at: string
          element_type: string
          id: number
          image_url: string | null
          is_active: boolean
          section_id: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          element_type?: string
          id?: never
          image_url?: string | null
          is_active?: boolean
          section_id: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          element_type?: string
          id?: never
          image_url?: string | null
          is_active?: boolean
          section_id?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "section_elements_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "custom_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      social_links: {
        Row: {
          created_at: string
          icon_name: string
          id: number
          is_active: boolean
          platform: string
          sort_order: number
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          icon_name?: string
          id?: never
          is_active?: boolean
          platform: string
          sort_order?: number
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          icon_name?: string
          id?: never
          is_active?: boolean
          platform?: string
          sort_order?: number
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          last_login_at: string | null
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          is_active?: boolean
          last_login_at?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: { _user_id: string }; Returns: boolean }
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
