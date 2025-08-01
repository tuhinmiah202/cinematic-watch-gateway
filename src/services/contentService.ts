
import { supabase } from '@/integrations/supabase/client';

export const contentService = {
  async getApprovedContent() {
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

      // Transform the data to flatten genres
      const transformedData = data?.map(item => ({
        ...item,
        genres: item.genres?.map((g: any) => g.genre).filter(Boolean) || []
      })) || [];

      console.log('Fetched content with genres:', transformedData[0]);
      return transformedData;
    } catch (error) {
      console.error('Error in getApprovedContent:', error);
      throw error;
    }
  },

  async getContentById(id: string) {
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

      // Transform the data to flatten genres
      const transformedData = {
        ...data,
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
  }
};
