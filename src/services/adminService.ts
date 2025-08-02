
import { supabase } from '@/integrations/supabase/client';

export interface PendingSubmission {
  id: string;
  title: string;
  description: string;
  poster_url: string;
  content_type: 'movie' | 'series';
  release_year: number;
  tmdb_id: number;
  trailer_url: string;
  thumbnail_url: string;
  created_at: string;
  updated_at: string;
  is_admin_approved: boolean;
}

export interface StreamingLink {
  id: string;
  content_id: string;
  url: string;
  platform_name: string;
  is_active: boolean;
  created_at: string;
}

export const adminService = {
  async getPendingSubmissions(): Promise<PendingSubmission[]> {
    try {
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('is_admin_approved', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending submissions:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getPendingSubmissions:', error);
      throw error;
    }
  },

  async getAllContent(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('is_admin_approved', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all content:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllContent:', error);
      throw error;
    }
  },

  async addFromTMDB(tmdbData: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('content')
        .insert([{
          title: tmdbData.title || tmdbData.name,
          description: tmdbData.overview,
          poster_url: tmdbData.poster_path,
          content_type: tmdbData.media_type === 'tv' ? 'series' : 'movie',
          release_year: new Date(tmdbData.release_date || tmdbData.first_air_date || '2024-01-01').getFullYear(),
          tmdb_id: tmdbData.id,
          trailer_url: '',
          thumbnail_url: tmdbData.poster_path,
          is_admin_approved: true
        }]);

      if (error) {
        console.error('Error adding from TMDB:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in addFromTMDB:', error);
      return false;
    }
  },

  async addCustomContent(contentData: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('content')
        .insert([{
          ...contentData,
          is_admin_approved: true
        }]);

      if (error) {
        console.error('Error adding custom content:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in addCustomContent:', error);
      return false;
    }
  },

  async approveSubmission(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('content')
        .update({ is_admin_approved: true })
        .eq('id', id);

      if (error) {
        console.error('Error approving submission:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in approveSubmission:', error);
      throw error;
    }
  },

  async rejectSubmission(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('content')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error rejecting submission:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in rejectSubmission:', error);
      throw error;
    }
  },

  async updateSubmission(id: string, updates: Partial<PendingSubmission>): Promise<PendingSubmission> {
    try {
      const { data, error } = await supabase
        .from('content')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating submission:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateSubmission:', error);
      throw error;
    }
  },

  async addStreamingLink(contentId: string, url: string, platformName: string): Promise<StreamingLink> {
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

  async getStreamingLinks(contentId: string): Promise<StreamingLink[]> {
    try {
      const { data, error } = await supabase
        .from('streaming_links')
        .select('*')
        .eq('content_id', contentId)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching streaming links:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getStreamingLinks:', error);
      throw error;
    }
  },

  async updateStreamingLink(id: string, updates: Partial<StreamingLink>): Promise<StreamingLink> {
    try {
      const { data, error } = await supabase
        .from('streaming_links')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating streaming link:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateStreamingLink:', error);
      throw error;
    }
  },

  async deleteStreamingLink(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('streaming_links')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting streaming link:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteStreamingLink:', error);
      throw error;
    }
  }
};
