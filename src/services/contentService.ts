
import { supabase } from '@/integrations/supabase/client';
import { tmdbService } from '@/services/tmdbService';

export interface ContentItem {
  id: string;
  title: string;
  description: string | null;
  poster_url: string | null;
  content_type: 'movie' | 'series';
  release_year: number | null;
  tmdb_id: number | null;
  is_admin_approved: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  trailer_url: string | null;
  thumbnail_url: string | null;
  rating?: number;
  genres: any[];
  streaming_links: any[];
  episodes: any[];
}

const normalizePosterUrl = (url: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) return tmdbService.getImageUrl(url);
  return url;
};

export const contentService = {
  async getApprovedContent(): Promise<ContentItem[]> {
    try {
      const { data, error } = await supabase
        .from('content')
        .select(`
          *,
          genres:content_genres(
            genre:genres(*)
          ),
          streaming_links(*),
          episodes(*)
        `)
        .eq('is_admin_approved', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching approved content:', error);
        throw error;
      }

      // Transform the data to flatten genres and normalize image URLs
      const transformedData = (data ?? []).map(item => ({
        ...item,
        poster_url: normalizePosterUrl(item.poster_url),
        thumbnail_url: normalizePosterUrl(item.thumbnail_url || item.poster_url),
        genres: item.genres?.map((g: any) => g.genre).filter(Boolean) || []
      }));

      console.log('Fetched content with genres:', transformedData[0]);
      return transformedData;
    } catch (error) {
      console.error('Error in getApprovedContent:', error);
      throw error;
    }
  },

  async getAllContent(): Promise<ContentItem[]> {
    try {
      const { data, error } = await supabase
        .from('content')
        .select(`
          *,
          genres:content_genres(
            genre:genres(*)
          ),
          streaming_links(
            id,
            url,
            platform_name,
            is_active,
            created_at
          ),
          episodes(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all content:', error);
        throw error;
      }

      // Transform the data to flatten genres and normalize image URLs
      const transformedData = (data ?? []).map(item => ({
        ...item,
        poster_url: normalizePosterUrl(item.poster_url),
        thumbnail_url: normalizePosterUrl(item.thumbnail_url || item.poster_url),
        genres: item.genres?.map((g: any) => g.genre).filter(Boolean) || [],
        streaming_links: (item.streaming_links || []).filter((link: any) => link.is_active !== false)
      }));

      console.log('getAllContent: Sample with streaming links:', transformedData[0]);
      return transformedData;
    } catch (error) {
      console.error('Error in getAllContent:', error);
      throw error;
    }
  },

  async getContentById(id: string): Promise<ContentItem> {
    try {
      const { data, error } = await supabase
        .from('content')
        .select(`
          *,
          genres:content_genres(
            genre:genres(*)
          ),
          streaming_links(*),
          episodes(*)
        `)
        .eq('id', id)
        .eq('is_admin_approved', true)
        .single();

      if (error) {
        console.error('Error fetching content by ID:', error);
        throw error;
      }

      // Transform the data to flatten genres and normalize image URLs
      const transformedData = {
        ...data,
        poster_url: normalizePosterUrl(data.poster_url),
        thumbnail_url: normalizePosterUrl(data.thumbnail_url || data.poster_url),
        genres: data.genres?.map((g: any) => g.genre).filter(Boolean) || []
      };

      return transformedData;
    } catch (error) {
      console.error('Error in getContentById:', error);
      throw error;
    }
  },

  async createContent(contentData: any) {
    try {
      console.log('Creating content with data:', contentData);
      
      const { data, error } = await supabase
        .from('content')
        .insert([{
          title: contentData.title,
          description: contentData.description,
          poster_url: contentData.poster_url,
          content_type: contentData.content_type,
          release_year: contentData.release_year,
          tmdb_id: contentData.tmdb_id,
          is_admin_approved: true,
          trailer_url: contentData.trailer_url,
          thumbnail_url: contentData.thumbnail_url || contentData.poster_url
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating content:', error);
        throw error;
      }

      console.log('Content created:', data);
      return data;
    } catch (error) {
      console.error('Error in createContent:', error);
      throw error;
    }
  },

  async addContent(contentData: any) {
    return this.createContent(contentData);
  },

  async updateContent(id: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('content')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating content:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateContent:', error);
      throw error;
    }
  },

  async deleteContent(id: string) {
    try {
      const { error } = await supabase
        .from('content')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting content:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteContent:', error);
      throw error;
    }
  },

  async addStreamingLink(contentId: string, url: string, platformName?: string) {
    try {
      const { data, error } = await supabase
        .from('streaming_links')
        .insert([{
          content_id: contentId,
          url: url,
          platform_name: platformName,
          is_active: true
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding streaming link:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in addStreamingLink:', error);
      throw error;
    }
  },

  async deleteStreamingLinks(contentId: string) {
    try {
      const { error } = await supabase
        .from('streaming_links')
        .delete()
        .eq('content_id', contentId);

      if (error) {
        console.error('Error deleting streaming links:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteStreamingLinks:', error);
      throw error;
    }
  },

  async addCastToContent(contentId: string, castData: any) {
    try {
      // This is a placeholder function - implement based on your cast table structure
      console.log('Adding cast to content:', contentId, castData);
      return true;
    } catch (error) {
      console.error('Error in addCastToContent:', error);
      throw error;
    }
  }
};
