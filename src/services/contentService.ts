
import { supabase } from '@/integrations/supabase/client';

export interface ContentItem {
  id: string;
  title: string;
  description?: string;
  content_type: 'movie' | 'series';
  release_year?: number;
  poster_url?: string;
  trailer_url?: string;
  thumbnail_url?: string;
  tmdb_id?: number;
  is_admin_approved: boolean;
  created_at: string;
  updated_at: string;
  cast_members?: CastMember[];
  genres?: Genre[];
  streaming_links?: StreamingLink[];
  episodes?: Episode[];
}

export interface CastMember {
  id: string;
  name: string;
  profile_image_url?: string;
  role?: string;
  character_name?: string;
}

export interface Genre {
  id: string;
  name: string;
  tmdb_id?: number;
}

export interface StreamingLink {
  id: string;
  url: string;
  platform_name?: string;
  is_active: boolean;
}

export interface Episode {
  id: string;
  season_number: number;
  episode_number: number;
  title?: string;
  description?: string;
  duration_minutes?: number;
  air_date?: string;
}

export const contentService = {
  // Get all approved content
  async getApprovedContent(): Promise<ContentItem[]> {
    const { data, error } = await supabase
      .from('content')
      .select(`
        *,
        content_cast!inner(
          role,
          character_name,
          cast_members(id, name, profile_image_url)
        ),
        content_genres!inner(
          genres(id, name, tmdb_id)
        ),
        streaming_links!inner(url, platform_name, is_active),
        episodes(*)
      `)
      .eq('is_admin_approved', true)
      .eq('streaming_links.is_active', true)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching approved content:', error);
      return [];
    }

    return data?.map(item => ({
      ...item,
      cast_members: item.content_cast?.map((cc: any) => ({
        ...cc.cast_members,
        role: cc.role,
        character_name: cc.character_name
      })) || [],
      genres: item.content_genres?.map((cg: any) => cg.genres) || [],
      streaming_links: item.streaming_links || []
    })) || [];
  },

  // Get content by type
  async getContentByType(type: 'movie' | 'series'): Promise<ContentItem[]> {
    const { data, error } = await supabase
      .from('content')
      .select(`
        *,
        content_cast!inner(
          role,
          character_name,
          cast_members(id, name, profile_image_url)
        ),
        content_genres!inner(
          genres(id, name, tmdb_id)
        ),
        streaming_links!inner(url, platform_name, is_active),
        episodes(*)
      `)
      .eq('is_admin_approved', true)
      .eq('content_type', type)
      .eq('streaming_links.is_active', true)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching content by type:', error);
      return [];
    }

    return data?.map(item => ({
      ...item,
      cast_members: item.content_cast?.map((cc: any) => ({
        ...cc.cast_members,
        role: cc.role,
        character_name: cc.character_name
      })) || [],
      genres: item.content_genres?.map((cg: any) => cg.genres) || [],
      streaming_links: item.streaming_links || []
    })) || [];
  },

  // Get content by genre
  async getContentByGenre(genreId: string): Promise<ContentItem[]> {
    const { data, error } = await supabase
      .from('content')
      .select(`
        *,
        content_cast!inner(
          role,
          character_name,
          cast_members(id, name, profile_image_url)
        ),
        content_genres!inner(
          genres(id, name, tmdb_id)
        ),
        streaming_links!inner(url, platform_name, is_active),
        episodes(*)
      `)
      .eq('is_admin_approved', true)
      .eq('content_genres.genre_id', genreId)
      .eq('streaming_links.is_active', true)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching content by genre:', error);
      return [];
    }

    return data?.map(item => ({
      ...item,
      cast_members: item.content_cast?.map((cc: any) => ({
        ...cc.cast_members,
        role: cc.role,
        character_name: cc.character_name
      })) || [],
      genres: item.content_genres?.map((cg: any) => cg.genres) || [],
      streaming_links: item.streaming_links || []
    })) || [];
  },

  // Search content
  async searchContent(query: string): Promise<ContentItem[]> {
    const { data, error } = await supabase
      .from('content')
      .select(`
        *,
        content_cast!inner(
          role,
          character_name,
          cast_members(id, name, profile_image_url)
        ),
        content_genres!inner(
          genres(id, name, tmdb_id)
        ),
        streaming_links!inner(url, platform_name, is_active),
        episodes(*)
      `)
      .eq('is_admin_approved', true)
      .eq('streaming_links.is_active', true)
      .ilike('title', `%${query}%`)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error searching content:', error);
      return [];
    }

    return data?.map(item => ({
      ...item,
      cast_members: item.content_cast?.map((cc: any) => ({
        ...cc.cast_members,
        role: cc.role,
        character_name: cc.character_name
      })) || [],
      genres: item.content_genres?.map((cg: any) => cg.genres) || [],
      streaming_links: item.streaming_links || []
    })) || [];
  },

  // Get single content item
  async getContentById(id: string): Promise<ContentItem | null> {
    const { data, error } = await supabase
      .from('content')
      .select(`
        *,
        content_cast!inner(
          role,
          character_name,
          cast_members(id, name, profile_image_url)
        ),
        content_genres!inner(
          genres(id, name, tmdb_id)
        ),
        streaming_links!inner(url, platform_name, is_active),
        episodes(*)
      `)
      .eq('id', id)
      .eq('is_admin_approved', true)
      .eq('streaming_links.is_active', true)
      .single();

    if (error) {
      console.error('Error fetching content by ID:', error);
      return null;
    }

    if (!data) return null;

    return {
      ...data,
      cast_members: data.content_cast?.map((cc: any) => ({
        ...cc.cast_members,
        role: cc.role,
        character_name: cc.character_name
      })) || [],
      genres: data.content_genres?.map((cg: any) => cg.genres) || [],
      streaming_links: data.streaming_links || []
    };
  },

  // Get all genres
  async getGenres(): Promise<Genre[]> {
    const { data, error } = await supabase
      .from('genres')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching genres:', error);
      return [];
    }

    return data || [];
  },

  // Admin functions
  async addContent(content: Omit<ContentItem, 'id' | 'created_at' | 'updated_at'>): Promise<string | null> {
    const { data, error } = await supabase
      .from('content')
      .insert({
        title: content.title,
        description: content.description,
        content_type: content.content_type,
        release_year: content.release_year,
        poster_url: content.poster_url,
        trailer_url: content.trailer_url,
        thumbnail_url: content.thumbnail_url,
        tmdb_id: content.tmdb_id,
        is_admin_approved: true
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error adding content:', error);
      return null;
    }

    return data?.id || null;
  },

  async updateContent(id: string, updates: Partial<ContentItem>): Promise<boolean> {
    const { error } = await supabase
      .from('content')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating content:', error);
      return false;
    }

    return true;
  },

  async deleteContent(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('content')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting content:', error);
      return false;
    }

    return true;
  },

  // Cast management
  async addCastToContent(contentId: string, castMembers: { name: string; role?: string; character_name?: string }[]): Promise<boolean> {
    try {
      for (const cast of castMembers) {
        // First, ensure cast member exists
        let { data: existingCast } = await supabase
          .from('cast_members')
          .select('id')
          .eq('name', cast.name)
          .single();

        let castMemberId = existingCast?.id;

        if (!castMemberId) {
          const { data: newCast, error: castError } = await supabase
            .from('cast_members')
            .insert({ name: cast.name })
            .select('id')
            .single();

          if (castError) throw castError;
          castMemberId = newCast?.id;
        }

        // Add relationship
        if (castMemberId) {
          await supabase
            .from('content_cast')
            .insert({
              content_id: contentId,
              cast_member_id: castMemberId,
              role: cast.role,
              character_name: cast.character_name
            });
        }
      }
      return true;
    } catch (error) {
      console.error('Error adding cast to content:', error);
      return false;
    }
  },

  // Streaming links management
  async addStreamingLink(contentId: string, url: string, platformName?: string): Promise<boolean> {
    const { error } = await supabase
      .from('streaming_links')
      .insert({
        content_id: contentId,
        url,
        platform_name: platformName,
        is_active: true
      });

    if (error) {
      console.error('Error adding streaming link:', error);
      return false;
    }

    return true;
  }
};
