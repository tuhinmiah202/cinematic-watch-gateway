
import { contentService, ContentItem } from './contentService';
import { tmdbService } from './tmdbService';

export interface AdminContentItem {
  id?: string;
  title: string;
  description?: string;
  content_type: 'movie' | 'series';
  release_year?: number;
  poster_url?: string;
  trailer_url?: string;
  tmdb_id?: number;
  cast_names?: string[];
  streaming_url?: string;
  platform_name?: string;
}

export const adminService = {
  // Get all admin content (approved content)
  async getAllContent(): Promise<ContentItem[]> {
    return await contentService.getApprovedContent();
  },

  // Add content from TMDB
  async addFromTMDB(tmdbMovie: any): Promise<boolean> {
    try {
      const title = tmdbMovie.title || tmdbMovie.name;
      const releaseDate = tmdbMovie.release_date || tmdbMovie.first_air_date;
      const year = releaseDate ? new Date(releaseDate).getFullYear() : new Date().getFullYear();
      const contentType = tmdbMovie.media_type === 'tv' ? 'series' : 'movie';
      
      const contentId = await contentService.addContent({
        title: title,
        description: tmdbMovie.overview,
        content_type: contentType,
        release_year: year,
        poster_url: tmdbMovie.poster_path ? tmdbService.getImageUrl(tmdbMovie.poster_path) : undefined,
        tmdb_id: tmdbMovie.id,
        is_admin_approved: true
      });

      if (contentId) {
        // Add some default cast members
        await contentService.addCastToContent(contentId, [
          { name: 'Cast Member 1', role: 'Actor', character_name: 'Main Character' },
          { name: 'Cast Member 2', role: 'Actor', character_name: 'Supporting Role' }
        ]);

        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding TMDB content:', error);
      return false;
    }
  },

  // Add custom content
  async addCustomContent(content: AdminContentItem): Promise<boolean> {
    try {
      const contentId = await contentService.addContent({
        title: content.title,
        description: content.description,
        content_type: content.content_type,
        release_year: content.release_year,
        poster_url: content.poster_url,
        trailer_url: content.trailer_url,
        is_admin_approved: true
      });

      if (contentId) {
        // Add streaming link if provided
        if (content.streaming_url) {
          await contentService.addStreamingLink(
            contentId, 
            content.streaming_url, 
            content.platform_name
          );
        }

        // Add cast members if provided
        if (content.cast_names && content.cast_names.length > 0) {
          const castMembers = content.cast_names.map(name => ({
            name: name.trim(),
            role: 'Actor'
          }));
          await contentService.addCastToContent(contentId, castMembers);
        }

        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding custom content:', error);
      return false;
    }
  },

  // Update content
  async updateContent(id: string, updates: Partial<AdminContentItem>): Promise<boolean> {
    try {
      const success = await contentService.updateContent(id, updates);
      
      // Update streaming link if provided
      if (success && updates.streaming_url) {
        await contentService.addStreamingLink(id, updates.streaming_url, updates.platform_name);
      }

      return success;
    } catch (error) {
      console.error('Error updating content:', error);
      return false;
    }
  },

  // Delete content
  async deleteContent(id: string): Promise<boolean> {
    try {
      return await contentService.deleteContent(id);
    } catch (error) {
      console.error('Error deleting content:', error);
      return false;
    }
  },

  // Add streaming link to existing content
  async addStreamingLink(contentId: string, url: string, platformName?: string): Promise<boolean> {
    try {
      return await contentService.addStreamingLink(contentId, url, platformName);
    } catch (error) {
      console.error('Error adding streaming link:', error);
      return false;
    }
  }
};
