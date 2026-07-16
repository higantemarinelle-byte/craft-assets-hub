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
      categories: {
        Row: {
          accent: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          accent?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          accent?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      craft_asset_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      craft_asset_folders: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "craft_asset_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "craft_asset_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      craft_asset_usages: {
        Row: {
          asset_id: string
          created_at: string
          field_path: string
          id: string
          metadata: Json
          source_id: string | null
          source_type: string
          updated_at: string
          usage_scope: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          field_path: string
          id?: string
          metadata?: Json
          source_id?: string | null
          source_type: string
          updated_at?: string
          usage_scope: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          field_path?: string
          id?: string
          metadata?: Json
          source_id?: string | null
          source_type?: string
          updated_at?: string
          usage_scope?: string
        }
        Relationships: [
          {
            foreignKeyName: "craft_asset_usages_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "craft_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      craft_assets: {
        Row: {
          alt_text: string | null
          bucket: string
          category_id: string | null
          created_at: string
          folder_id: string | null
          height: number | null
          id: string
          is_public: boolean
          mime_type: string
          name: string
          original_filename: string
          size_bytes: number | null
          status: string
          storage_path: string
          tags: string[]
          updated_at: string
          uploaded_by: string | null
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          bucket: string
          category_id?: string | null
          created_at?: string
          folder_id?: string | null
          height?: number | null
          id?: string
          is_public?: boolean
          mime_type: string
          name: string
          original_filename: string
          size_bytes?: number | null
          status?: string
          storage_path: string
          tags?: string[]
          updated_at?: string
          uploaded_by?: string | null
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          bucket?: string
          category_id?: string | null
          created_at?: string
          folder_id?: string | null
          height?: number | null
          id?: string
          is_public?: boolean
          mime_type?: string
          name?: string
          original_filename?: string
          size_bytes?: number | null
          status?: string
          storage_path?: string
          tags?: string[]
          updated_at?: string
          uploaded_by?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "craft_assets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "craft_asset_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "craft_assets_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "craft_asset_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_codes: {
        Row: {
          amount: number
          code: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          kind: Database["public"]["Enums"]["discount_kind"]
          max_uses: number | null
          uses: number
        }
        Insert: {
          amount: number
          code: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          kind: Database["public"]["Enums"]["discount_kind"]
          max_uses?: number | null
          uses?: number
        }
        Update: {
          amount?: number
          code?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["discount_kind"]
          max_uses?: number | null
          uses?: number
        }
        Relationships: []
      }
      gang_sheet_pricing_rules: {
        Row: {
          base_price: number
          code: string
          created_at: string
          created_by: string | null
          currency: string
          effective_from: string | null
          fill_adjustment_type: string
          fill_adjustment_value: number
          fill_threshold_percent: number | null
          height_inches: number | null
          id: string
          is_active: boolean
          minimum_total: number
          name: string
          per_design_fee: number
          sort_order: number
          updated_at: string
          updated_by: string | null
          width_inches: number | null
        }
        Insert: {
          base_price?: number
          code: string
          created_at?: string
          created_by?: string | null
          currency?: string
          effective_from?: string | null
          fill_adjustment_type?: string
          fill_adjustment_value?: number
          fill_threshold_percent?: number | null
          height_inches?: number | null
          id?: string
          is_active?: boolean
          minimum_total?: number
          name: string
          per_design_fee?: number
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
          width_inches?: number | null
        }
        Update: {
          base_price?: number
          code?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          effective_from?: string | null
          fill_adjustment_type?: string
          fill_adjustment_value?: number
          fill_threshold_percent?: number | null
          height_inches?: number | null
          id?: string
          is_active?: boolean
          minimum_total?: number
          name?: string
          per_design_fee?: number
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
          width_inches?: number | null
        }
        Relationships: []
      }
      gang_sheet_uploads: {
        Row: {
          created_at: string
          id: string
          layout: Json
          quoted_price: number | null
          sheet_size: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          layout?: Json
          quoted_price?: number | null
          sheet_size: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          layout?: Json
          quoted_price?: number | null
          sheet_size?: string
          user_id?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          line_total: number
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          unit_price: number
          variant_id: string | null
          variant_label: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          line_total: number
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          unit_price: number
          variant_id?: string | null
          variant_label?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          line_total?: number
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          unit_price?: number
          variant_id?: string | null
          variant_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          discount: number
          discount_code: string | null
          email: string
          full_name: string | null
          id: string
          internal_notes: string | null
          notes: string | null
          order_number: string
          project_reference: string | null
          project_status: Database["public"]["Enums"]["project_status"]
          shipping_address: Json | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          discount?: number
          discount_code?: string | null
          email: string
          full_name?: string | null
          id?: string
          internal_notes?: string | null
          notes?: string | null
          order_number?: string
          project_reference?: string | null
          project_status?: Database["public"]["Enums"]["project_status"]
          shipping_address?: Json | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          discount?: number
          discount_code?: string | null
          email?: string
          full_name?: string | null
          id?: string
          internal_notes?: string | null
          notes?: string | null
          order_number?: string
          project_reference?: string | null
          project_status?: Database["public"]["Enums"]["project_status"]
          shipping_address?: Json | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          created_at: string
          id: string
          label: string
          price: number
          product_id: string
          sort_order: number
          stock: number
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          price: number
          product_id: string
          sort_order?: number
          stock?: number
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          price?: number
          product_id?: string
          sort_order?: number
          stock?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          base_price: number
          care_instructions: string | null
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          images: string[]
          is_featured: boolean
          is_published: boolean
          name: string
          slug: string
          sort_order: number
          tags: string[]
          updated_at: string
        }
        Insert: {
          base_price?: number
          care_instructions?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string[]
          is_featured?: boolean
          is_published?: boolean
          name: string
          slug: string
          sort_order?: number
          tags?: string[]
          updated_at?: string
        }
        Update: {
          base_price?: number
          care_instructions?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string[]
          is_featured?: boolean
          is_published?: boolean
          name?: string
          slug?: string
          sort_order?: number
          tags?: string[]
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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          note: string | null
          order_id: string
          status: Database["public"]["Enums"]["project_status"]
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          note?: string | null
          order_id: string
          status: Database["public"]["Enums"]["project_status"]
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          note?: string | null
          order_id?: string
          status?: Database["public"]["Enums"]["project_status"]
        }
        Relationships: [
          {
            foreignKeyName: "project_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      theme_settings: {
        Row: {
          created_at: string
          draft: Json
          draft_updated_at: string
          id: string
          published: Json
          published_at: string | null
          singleton: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          draft?: Json
          draft_updated_at?: string
          id?: string
          published?: Json
          published_at?: string | null
          singleton?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          draft?: Json
          draft_updated_at?: string
          id?: string
          published?: Json
          published_at?: string | null
          singleton?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      theme_versions: {
        Row: {
          created_at: string
          id: string
          label: string | null
          published_by: string | null
          snapshot: Json
        }
        Insert: {
          created_at?: string
          id?: string
          label?: string | null
          published_by?: string | null
          snapshot: Json
        }
        Update: {
          created_at?: string
          id?: string
          label?: string | null
          published_by?: string | null
          snapshot?: Json
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "owner" | "employee" | "customer"
      discount_kind: "percent" | "fixed"
      order_status:
        | "pending"
        | "processing"
        | "printed"
        | "shipped"
        | "delivered"
        | "cancelled"
      project_status:
        | "submitted"
        | "craft_review"
        | "waiting_for_customer"
        | "quote_ready"
        | "approved"
        | "in_production"
        | "quality_check"
        | "ready_for_pickup"
        | "shipped"
        | "completed"
        | "archived"
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
      app_role: ["owner", "employee", "customer"],
      discount_kind: ["percent", "fixed"],
      order_status: [
        "pending",
        "processing",
        "printed",
        "shipped",
        "delivered",
        "cancelled",
      ],
      project_status: [
        "submitted",
        "craft_review",
        "waiting_for_customer",
        "quote_ready",
        "approved",
        "in_production",
        "quality_check",
        "ready_for_pickup",
        "shipped",
        "completed",
        "archived",
      ],
    },
  },
} as const
