export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      cast_members: {
        Row: {
          created_at: string | null
          id: string
          name: string
          profile_image_url: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          profile_image_url?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          profile_image_url?: string | null
        }
        Relationships: []
      }
      content: {
        Row: {
          content_type: Database["public"]["Enums"]["content_type"]
          created_at: string | null
          description: string | null
          id: string
          is_admin_approved: boolean | null
          poster_url: string | null
          release_year: number | null
          thumbnail_url: string | null
          title: string
          tmdb_id: number | null
          trailer_url: string | null
          updated_at: string | null
        }
        Insert: {
          content_type: Database["public"]["Enums"]["content_type"]
          created_at?: string | null
          description?: string | null
          id?: string
          is_admin_approved?: boolean | null
          poster_url?: string | null
          release_year?: number | null
          thumbnail_url?: string | null
          title: string
          tmdb_id?: number | null
          trailer_url?: string | null
          updated_at?: string | null
        }
        Update: {
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string | null
          description?: string | null
          id?: string
          is_admin_approved?: boolean | null
          poster_url?: string | null
          release_year?: number | null
          thumbnail_url?: string | null
          title?: string
          tmdb_id?: number | null
          trailer_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      content_cast: {
        Row: {
          cast_member_id: string | null
          character_name: string | null
          content_id: string | null
          id: string
          role: string | null
        }
        Insert: {
          cast_member_id?: string | null
          character_name?: string | null
          content_id?: string | null
          id?: string
          role?: string | null
        }
        Update: {
          cast_member_id?: string | null
          character_name?: string | null
          content_id?: string | null
          id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_cast_cast_member_id_fkey"
            columns: ["cast_member_id"]
            isOneToOne: false
            referencedRelation: "cast_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_cast_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
        ]
      }
      content_genres: {
        Row: {
          content_id: string | null
          genre_id: string | null
          id: string
        }
        Insert: {
          content_id?: string | null
          genre_id?: string | null
          id?: string
        }
        Update: {
          content_id?: string | null
          genre_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_genres_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_genres_genre_id_fkey"
            columns: ["genre_id"]
            isOneToOne: false
            referencedRelation: "genres"
            referencedColumns: ["id"]
          },
        ]
      }
      episodes: {
        Row: {
          air_date: string | null
          content_id: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          episode_number: number
          id: string
          season_number: number
          title: string | null
        }
        Insert: {
          air_date?: string | null
          content_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          episode_number: number
          id?: string
          season_number: number
          title?: string | null
        }
        Update: {
          air_date?: string | null
          content_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          episode_number?: number
          id?: string
          season_number?: number
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "episodes_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
        ]
      }
      genres: {
        Row: {
          id: string
          name: string
          tmdb_id: number | null
        }
        Insert: {
          id?: string
          name: string
          tmdb_id?: number | null
        }
        Update: {
          id?: string
          name?: string
          tmdb_id?: number | null
        }
        Relationships: []
      }
      movie_links: {
        Row: {
          created_at: string
          download_url: string
          id: string
          movie_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          download_url: string
          id?: string
          movie_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          download_url?: string
          id?: string
          movie_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "movie_links_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
        ]
      }
      movies: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          image: string | null
          is_released: boolean | null
          rating: number | null
          release_date: string | null
          title: string
          tmdb_id: number | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image?: string | null
          is_released?: boolean | null
          rating?: number | null
          release_date?: string | null
          title: string
          tmdb_id?: number | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image?: string | null
          is_released?: boolean | null
          rating?: number | null
          release_date?: string | null
          title?: string
          tmdb_id?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      streaming_links: {
        Row: {
          content_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          platform_name: string | null
          url: string
        }
        Insert: {
          content_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          platform_name?: string | null
          url: string
        }
        Update: {
          content_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          platform_name?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "streaming_links_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
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
      content_type: "movie" | "series"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      content_type: ["movie", "series"],
    },
  },
} as const
