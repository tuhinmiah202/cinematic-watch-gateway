
import { contentService } from './contentService';
import { supabase } from '@/integrations/supabase/client';

export const migrationService = {
  async clearAllExistingContent(): Promise<void> {
    try {
      console.log('Clearing all existing content from database...');
      
      // Clear all existing content
      await contentService.clearAllContent();
      
      // Also clear localStorage
      localStorage.removeItem('adminManagedContent');
      
      console.log('All existing content cleared successfully');
    } catch (error) {
      console.error('Error clearing content:', error);
    }
  }
};
