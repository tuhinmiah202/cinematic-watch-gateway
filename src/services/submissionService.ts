
import { supabase } from '@/integrations/supabase/client';

export interface PendingSubmission {
  id: string;
  tmdb_id: number;
  title: string;
  description?: string;
  poster_url?: string;
  release_year?: number;
  content_type: 'movie' | 'series';
  vote_average?: number;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface AdminNotification {
  id: string;
  type: 'new_submission' | 'system_alert';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  related_id?: string;
}

export const submissionService = {
  // Get all pending submissions
  async getPendingSubmissions(): Promise<PendingSubmission[]> {
    const { data, error } = await supabase
      .from('pending_submissions')
      .select('*')
      .eq('status', 'pending')
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending submissions:', error);
      return [];
    }

    return data || [];
  },

  // Get all notifications
  async getNotifications(): Promise<AdminNotification[]> {
    const { data, error } = await supabase
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }

    return data || [];
  },

  // Get unread notification count
  async getUnreadCount(): Promise<number> {
    const { data, error } = await supabase
      .from('admin_notifications')
      .select('id')
      .eq('is_read', false);

    if (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }

    return data?.length || 0;
  },

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<boolean> {
    const { error } = await supabase
      .from('admin_notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }

    return true;
  },

  // Approve submission
  async approveSubmission(submissionId: string): Promise<boolean> {
    const { error } = await supabase
      .from('pending_submissions')
      .update({ 
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: 'admin'
      })
      .eq('id', submissionId);

    if (error) {
      console.error('Error approving submission:', error);
      return false;
    }

    return true;
  },

  // Reject submission
  async rejectSubmission(submissionId: string): Promise<boolean> {
    const { error } = await supabase
      .from('pending_submissions')
      .update({ 
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: 'admin'
      })
      .eq('id', submissionId);

    if (error) {
      console.error('Error rejecting submission:', error);
      return false;
    }

    return true;
  },

  // Submit new content for approval
  async submitForApproval(movieData: any): Promise<boolean> {
    const contentType = movieData.media_type === 'tv' ? 'series' : 'movie';
    
    const { error } = await supabase
      .from('pending_submissions')
      .insert({
        tmdb_id: movieData.id,
        title: movieData.title || movieData.name,
        description: movieData.overview,
        poster_url: movieData.poster_path,
        release_year: movieData.release_date ? new Date(movieData.release_date).getFullYear() : 
                     movieData.first_air_date ? new Date(movieData.first_air_date).getFullYear() : null,
        content_type: contentType,
        vote_average: movieData.vote_average
      });

    if (error) {
      console.error('Error submitting for approval:', error);
      return false;
    }

    return true;
  }
};
