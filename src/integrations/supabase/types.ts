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
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "glasses_products"
            referencedColumns: ["id"]
          },
        ]
      }
      glasses_products: {
        Row: {
          additional_images: string[] | null
          brand: string
          bridge_width: number | null
          created_at: string | null
          description: string | null
          frame_color: string
          frame_material: Database["public"]["Enums"]["frame_material"]
          frame_style: Database["public"]["Enums"]["frame_style"]
          gender: Database["public"]["Enums"]["gender_type"]
          id: string
          image_url: string | null
          in_stock: boolean | null
          lens_width: number | null
          name: string
          price: number
          suitable_face_shapes:
            | Database["public"]["Enums"]["face_shape"][]
            | null
          temple_length: number | null
        }
        Insert: {
          additional_images?: string[] | null
          brand: string
          bridge_width?: number | null
          created_at?: string | null
          description?: string | null
          frame_color: string
          frame_material: Database["public"]["Enums"]["frame_material"]
          frame_style: Database["public"]["Enums"]["frame_style"]
          gender: Database["public"]["Enums"]["gender_type"]
          id?: string
          image_url?: string | null
          in_stock?: boolean | null
          lens_width?: number | null
          name: string
          price: number
          suitable_face_shapes?:
            | Database["public"]["Enums"]["face_shape"][]
            | null
          temple_length?: number | null
        }
        Update: {
          additional_images?: string[] | null
          brand?: string
          bridge_width?: number | null
          created_at?: string | null
          description?: string | null
          frame_color?: string
          frame_material?: Database["public"]["Enums"]["frame_material"]
          frame_style?: Database["public"]["Enums"]["frame_style"]
          gender?: Database["public"]["Enums"]["gender_type"]
          id?: string
          image_url?: string | null
          in_stock?: boolean | null
          lens_width?: number | null
          name?: string
          price?: number
          suitable_face_shapes?:
            | Database["public"]["Enums"]["face_shape"][]
            | null
          temple_length?: number | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          price: number
          product_id: string
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          price: number
          product_id: string
          quantity: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          price?: number
          product_id?: string
          quantity?: number
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
            referencedRelation: "glasses_products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          id: string
          shipping_address: string | null
          status: string
          total_amount: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          shipping_address?: string | null
          status?: string
          total_amount: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          shipping_address?: string | null
          status?: string
          total_amount?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          face_shape: Database["public"]["Enums"]["face_shape"] | null
          full_name: string | null
          gender: Database["public"]["Enums"]["gender_type"] | null
          id: string
          onboarding_completed: boolean | null
          preferred_colors: string[] | null
          preferred_styles: Database["public"]["Enums"]["frame_style"][] | null
          updated_at: string | null
          user_id: string
          vision_prescription: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          face_shape?: Database["public"]["Enums"]["face_shape"] | null
          full_name?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          onboarding_completed?: boolean | null
          preferred_colors?: string[] | null
          preferred_styles?: Database["public"]["Enums"]["frame_style"][] | null
          updated_at?: string | null
          user_id: string
          vision_prescription?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          face_shape?: Database["public"]["Enums"]["face_shape"] | null
          full_name?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          onboarding_completed?: boolean | null
          preferred_colors?: string[] | null
          preferred_styles?: Database["public"]["Enums"]["frame_style"][] | null
          updated_at?: string | null
          user_id?: string
          vision_prescription?: string | null
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "glasses_products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      face_shape: "oval" | "round" | "square" | "heart" | "diamond" | "oblong"
      frame_material:
        | "metal"
        | "plastic"
        | "acetate"
        | "titanium"
        | "wood"
        | "mixed"
      frame_style:
        | "aviator"
        | "wayfarer"
        | "cat_eye"
        | "round"
        | "rectangular"
        | "oversized"
        | "geometric"
      gender_type: "male" | "female" | "unisex"
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
      face_shape: ["oval", "round", "square", "heart", "diamond", "oblong"],
      frame_material: [
        "metal",
        "plastic",
        "acetate",
        "titanium",
        "wood",
        "mixed",
      ],
      frame_style: [
        "aviator",
        "wayfarer",
        "cat_eye",
        "round",
        "rectangular",
        "oversized",
        "geometric",
      ],
      gender_type: ["male", "female", "unisex"],
    },
  },
} as const
