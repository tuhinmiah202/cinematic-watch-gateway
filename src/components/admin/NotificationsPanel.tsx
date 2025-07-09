
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { submissionService } from '@/services/submissionService';
import { adminService } from '@/services/adminService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, X, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import EditSubmissionDialog from './EditSubmissionDialog';

const NotificationsPanel = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications = [], refetch: refetchNotifications } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: submissionService.getNotifications
  });

  // Fetch pending submissions
  const { data: pendingSubmissions = [], refetch: refetchSubmissions } = useQuery({
    queryKey: ['pending-submissions'],
    queryFn: submissionService.getPendingSubmissions
  });

  // Get unread count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-notifications'],
    queryFn: submissionService.getUnreadCount
  });

  const handleApprove = async (submissionId: string) => {
    const submission = pendingSubmissions.find(s => s.id === submissionId);
    if (!submission) return;

    // First approve in pending_submissions
    const approved = await submissionService.approveSubmission(submissionId);
    if (!approved) {
      toast({
        title: "Error",
        description: "Failed to approve submission.",
        variant: "destructive",
      });
      return;
    }

    // Then add to main content table
    const success = await adminService.addFromTMDB({
      id: submission.tmdb_id,
      title: submission.title,
      name: submission.title,
      overview: submission.description,
      poster_path: submission.poster_url,
      release_date: submission.content_type === 'movie' ? `${submission.release_year}-01-01` : undefined,
      first_air_date: submission.content_type === 'series' ? `${submission.release_year}-01-01` : undefined,
      vote_average: submission.vote_average,
      media_type: submission.content_type === 'series' ? 'tv' : 'movie'
    });

    if (success) {
      toast({
        title: "Approved",
        description: `${submission.title} has been approved and added to the content library.`,
      });
      
      refetchSubmissions();
      refetchNotifications();
      queryClient.invalidateQueries({ queryKey: ['admin-content'] });
      queryClient.invalidateQueries({ queryKey: ['supabase-content'] });
    } else {
      toast({
        title: "Error",
        description: "Approved but failed to add to content library.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (submissionId: string) => {
    const success = await submissionService.rejectSubmission(submissionId);
    
    if (success) {
      const submission = pendingSubmissions.find(s => s.id === submissionId);
      toast({
        title: "Rejected",
        description: `${submission?.title} has been rejected.`,
      });
      
      refetchSubmissions();
      refetchNotifications();
    } else {
      toast({
        title: "Error",
        description: "Failed to reject submission.",
        variant: "destructive",
      });
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    await submissionService.markAsRead(notificationId);
    refetchNotifications();
  };

  return (
    <div className="space-y-6">
      {/* Notifications Header */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-yellow-400" />
            Admin Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-gray-400 text-sm">No notifications</p>
            ) : (
              notifications.slice(0, 10).map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border ${
                    notification.is_read ? 'bg-gray-700 border-gray-600' : 'bg-yellow-900/20 border-yellow-600'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-white text-sm font-semibold">{notification.title}</h4>
                      <p className="text-gray-300 text-xs mt-1">{notification.message}</p>
                      <p className="text-gray-500 text-xs mt-1">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="text-yellow-400 hover:text-yellow-300"
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pending Submissions */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">
            Pending Submissions ({pendingSubmissions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingSubmissions.length === 0 ? (
              <p className="text-gray-400 text-sm">No pending submissions</p>
            ) : (
              pendingSubmissions.map((submission) => (
                <div key={submission.id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={submission.poster_url ? `https://image.tmdb.org/t/p/w92${submission.poster_url}` : '/placeholder.svg'}
                      alt={submission.title}
                      className="w-16 h-24 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h4 className="text-white font-semibold">{submission.title}</h4>
                      <p className="text-gray-400 text-sm">{submission.release_year}</p>
                      <p className="text-gray-500 text-xs capitalize">{submission.content_type}</p>
                      {submission.vote_average && (
                        <p className="text-yellow-400 text-sm">⭐ {submission.vote_average.toFixed(1)}</p>
                      )}
                      <p className="text-gray-500 text-xs mt-1">
                        Submitted: {new Date(submission.submitted_at).toLocaleDateString()}
                      </p>
                      {submission.description && (
                        <p className="text-gray-400 text-xs mt-1 line-clamp-2">{submission.description}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <EditSubmissionDialog 
                        submission={submission} 
                        onUpdate={refetchSubmissions}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(submission.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(submission.id)}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsPanel;
