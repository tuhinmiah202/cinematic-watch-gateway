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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          related_id: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          related_id?: string | null
          title: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          related_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notifications_related_id_fkey"
            columns: ["related_id"]
            isOneToOne: false
            referencedRelation: "pending_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
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
      friends: {
        Row: {
          created_at: string | null
          friend_id: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          friend_id: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          friend_id?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      game_players: {
        Row: {
          bet_placed: number
          id: string
          is_winner: boolean | null
          joined_at: string | null
          player_id: string
          player_number: number
          position_data: Json | null
          room_id: string | null
        }
        Insert: {
          bet_placed: number
          id?: string
          is_winner?: boolean | null
          joined_at?: string | null
          player_id: string
          player_number: number
          position_data?: Json | null
          room_id?: string | null
        }
        Update: {
          bet_placed?: number
          id?: string
          is_winner?: boolean | null
          joined_at?: string | null
          player_id?: string
          player_number?: number
          position_data?: Json | null
          room_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_players_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "game_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      game_rooms: {
        Row: {
          bet_amount: number
          completed_at: string | null
          created_at: string | null
          created_by: string
          current_players: number | null
          game_type: string
          id: string
          max_players: number | null
          room_code: string
          started_at: string | null
          status: string | null
          winner_id: string | null
        }
        Insert: {
          bet_amount: number
          completed_at?: string | null
          created_at?: string | null
          created_by: string
          current_players?: number | null
          game_type?: string
          id?: string
          max_players?: number | null
          room_code: string
          started_at?: string | null
          status?: string | null
          winner_id?: string | null
        }
        Update: {
          bet_amount?: number
          completed_at?: string | null
          created_at?: string | null
          created_by?: string
          current_players?: number | null
          game_type?: string
          id?: string
          max_players?: number | null
          room_code?: string
          started_at?: string | null
          status?: string | null
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_rooms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_rooms_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_sessions: {
        Row: {
          current_turn: number | null
          ended_at: string | null
          game_state: Json | null
          id: string
          moves_history: Json | null
          room_id: string | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          current_turn?: number | null
          ended_at?: string | null
          game_state?: Json | null
          id?: string
          moves_history?: Json | null
          room_id?: string | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          current_turn?: number | null
          ended_at?: string | null
          game_state?: Json | null
          id?: string
          moves_history?: Json | null
          room_id?: string | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_sessions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "game_rooms"
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
      leaderboards: {
        Row: {
          game_type: string
          games_played: number | null
          games_won: number | null
          id: string
          period: string
          score: number | null
          tokens_won: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          game_type: string
          games_played?: number | null
          games_won?: number | null
          id?: string
          period: string
          score?: number | null
          tokens_won?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          game_type?: string
          games_played?: number | null
          games_won?: number | null
          id?: string
          period?: string
          score?: number | null
          tokens_won?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message_text: string
          receiver_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message_text: string
          receiver_id: string
          sender_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message_text?: string
          receiver_id?: string
          sender_id?: string
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
      pending_submissions: {
        Row: {
          content_type: Database["public"]["Enums"]["content_type"]
          description: string | null
          id: string
          poster_url: string | null
          release_year: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string
          title: string
          tmdb_id: number
          vote_average: number | null
        }
        Insert: {
          content_type: Database["public"]["Enums"]["content_type"]
          description?: string | null
          id?: string
          poster_url?: string | null
          release_year?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          title: string
          tmdb_id: number
          vote_average?: number | null
        }
        Update: {
          content_type?: Database["public"]["Enums"]["content_type"]
          description?: string | null
          id?: string
          poster_url?: string | null
          release_year?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          title?: string
          tmdb_id?: number
          vote_average?: number | null
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          comment_text: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          comment_text: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          comment_text?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_comment_post"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_user_comment"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_post"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_user_likes"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          caption: string | null
          comments_count: number | null
          created_at: string
          id: string
          likes_count: number | null
          media_url: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          comments_count?: number | null
          created_at?: string
          id?: string
          likes_count?: number | null
          media_url: string
          user_id: string
        }
        Update: {
          caption?: string | null
          comments_count?: number | null
          created_at?: string
          id?: string
          likes_count?: number | null
          media_url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_posts"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          balance: number | null
          created_at: string | null
          id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          balance?: number | null
          created_at?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          balance?: number | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      saved_posts: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_saved_post"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_user_saved"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          caption: string | null
          created_at: string
          expires_at: string
          id: string
          media_type: string
          media_url: string
          user_id: string
          view_count: number | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          media_type?: string
          media_url: string
          user_id: string
          view_count?: number | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          media_type?: string
          media_url?: string
          user_id?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
      user_photos: {
        Row: {
          created_at: string
          id: string
          photo_url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          photo_url: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          photo_url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_photo"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_posts: {
        Row: {
          caption: string | null
          created_at: string | null
          id: string
          image_url: string
          likes: number | null
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          id?: string
          image_url: string
          likes?: number | null
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          id?: string
          image_url?: string
          likes?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          bio: string | null
          connection_requests: string | null
          connections: number | null
          created_at: string | null
          education: string | null
          id: string
          interests: string[] | null
          location: string | null
          mobile: string | null
          name: string | null
          photo_visibility: string | null
          profession: string | null
          profile_visibility: string | null
          story_visibility: string | null
          updated_at: string | null
          user_id: string
          username: string
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          connection_requests?: string | null
          connections?: number | null
          created_at?: string | null
          education?: string | null
          id?: string
          interests?: string[] | null
          location?: string | null
          mobile?: string | null
          name?: string | null
          photo_visibility?: string | null
          profession?: string | null
          profile_visibility?: string | null
          story_visibility?: string | null
          updated_at?: string | null
          user_id: string
          username: string
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          connection_requests?: string | null
          connections?: number | null
          created_at?: string | null
          education?: string | null
          id?: string
          interests?: string[] | null
          location?: string | null
          mobile?: string | null
          name?: string | null
          photo_visibility?: string | null
          profession?: string | null
          profile_visibility?: string | null
          story_visibility?: string | null
          updated_at?: string | null
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_stats: {
        Row: {
          best_streak: number | null
          current_streak: number | null
          favorite_game: string | null
          id: string
          total_games_played: number | null
          total_games_won: number | null
          total_tokens_lost: number | null
          total_tokens_won: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          best_streak?: number | null
          current_streak?: number | null
          favorite_game?: string | null
          id?: string
          total_games_played?: number | null
          total_games_won?: number | null
          total_tokens_lost?: number | null
          total_tokens_won?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          best_streak?: number | null
          current_streak?: number | null
          favorite_game?: string | null
          id?: string
          total_games_played?: number | null
          total_games_won?: number | null
          total_tokens_lost?: number | null
          total_tokens_won?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_stories: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          media_type: string
          media_url: string
          user_id: string
          view_count: number | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          media_type: string
          media_url: string
          user_id: string
          view_count?: number | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          media_type?: string
          media_url?: string
          user_id?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_stories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          password_hash: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          password_hash: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          password_hash?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          game_room_id: string | null
          id: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          game_room_id?: string | null
          id?: string
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          game_room_id?: string | null
          id?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_game_room_id_fkey"
            columns: ["game_room_id"]
            isOneToOne: false
            referencedRelation: "game_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_user_id_fkey"
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
      update_user_balance: {
        Args: {
          amount: number
          description?: string
          game_room_id?: string
          transaction_type: string
          user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      content_type: "movie" | "series"
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
      content_type: ["movie", "series"],
    },
  },
} as const
