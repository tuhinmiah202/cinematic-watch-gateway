
import { contentService } from './contentService';
import { supabase } from '@/integrations/supabase/client';

interface LocalStorageContent {
  id: number;
  title: string;
  year: number;
  streamingLink?: string;
  type: 'movie' | 'series';
  tmdbId?: number;
  description?: string;
  poster_path?: string;
}

export const migrationService = {
  async migrateLocalStorageToSupabase(): Promise<void> {
    try {
      console.log('Starting migration from localStorage to Supabase...');
      
      // Get localStorage data
      const localData = localStorage.getItem('adminManagedContent');
      if (!localData) {
        console.log('No localStorage data found to migrate');
        return;
      }

      const parsedData: LocalStorageContent[] = JSON.parse(localData);
      console.log(`Found ${parsedData.length} items in localStorage`);

      // Check if we already have data in Supabase
      const existingContent = await contentService.getApprovedContent();
      if (existingContent.length > 0) {
        console.log('Supabase already has content, skipping migration');
        return;
      }

      let migratedCount = 0;

      for (const item of parsedData) {
        try {
          // Add content to Supabase
          const contentId = await contentService.addContent({
            title: item.title,
            description: item.description || '',
            content_type: item.type,
            release_year: item.year,
            poster_url: item.poster_path,
            tmdb_id: item.tmdbId,
            is_admin_approved: true
          });

          if (contentId) {
            // Add streaming link if exists
            if (item.streamingLink) {
              await contentService.addStreamingLink(contentId, item.streamingLink);
            }

            // Add some mock cast members for demonstration
            await contentService.addCastToContent(contentId, [
              { name: 'John Doe', role: 'Actor', character_name: 'Main Character' },
              { name: 'Jane Smith', role: 'Actor', character_name: 'Supporting Role' }
            ]);

            migratedCount++;
            console.log(`Migrated: ${item.title}`);
          }
        } catch (error) {
          console.error(`Failed to migrate ${item.title}:`, error);
        }
      }

      console.log(`Migration completed. ${migratedCount} items migrated successfully.`);
      
      // Clear localStorage after successful migration
      if (migratedCount > 0) {
        localStorage.removeItem('adminManagedContent');
        console.log('localStorage cleared after successful migration');
      }
    } catch (error) {
      console.error('Migration failed:', error);
    }
  },

  async clearAllLocalStorage(): Promise<void> {
    localStorage.removeItem('adminManagedContent');
    console.log('All localStorage content cleared');
  }
};
