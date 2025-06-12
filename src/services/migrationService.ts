
import { contentService } from './contentService';
import { supabase } from '@/integrations/supabase/client';

export const migrationService = {
  async clearAllExistingContent(): Promise<void> {
    try {
      console.log('Migration service ready - no automatic clearing');
      // Remove automatic clearing - user will manually add content
    } catch (error) {
      console.error('Error in migration service:', error);
    }
  }
};
