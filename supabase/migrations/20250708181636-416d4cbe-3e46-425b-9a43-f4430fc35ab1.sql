
-- Create table for pending movie submissions that need admin approval
CREATE TABLE public.pending_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tmdb_id INTEGER NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  poster_url TEXT,
  release_year INTEGER,
  content_type public.content_type NOT NULL,
  vote_average DECIMAL(3,1),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by TEXT
);

-- Create table for admin notifications
CREATE TABLE public.admin_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('new_submission', 'system_alert')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  related_id UUID REFERENCES public.pending_submissions(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_pending_submissions_status ON public.pending_submissions(status);
CREATE INDEX idx_pending_submissions_tmdb_id ON public.pending_submissions(tmdb_id);
CREATE INDEX idx_admin_notifications_is_read ON public.admin_notifications(is_read);
CREATE INDEX idx_admin_notifications_created_at ON public.admin_notifications(created_at DESC);

-- Create function to automatically create notification when new submission is added
CREATE OR REPLACE FUNCTION create_submission_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.admin_notifications (type, title, message, related_id)
  VALUES (
    'new_submission',
    'New Content Submission',
    'New ' || NEW.content_type || ' "' || NEW.title || '" requires approval',
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create notifications
CREATE TRIGGER trigger_create_submission_notification
  AFTER INSERT ON public.pending_submissions
  FOR EACH ROW
  EXECUTE FUNCTION create_submission_notification();

-- Add RLS policies
ALTER TABLE public.pending_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Allow public read access to approved submissions (for auto-import system)
CREATE POLICY "Public can view approved submissions" 
  ON public.pending_submissions 
  FOR SELECT 
  USING (status = 'approved');

-- Admin can do everything with pending submissions
CREATE POLICY "Admins can manage pending submissions" 
  ON public.pending_submissions 
  FOR ALL 
  USING (TRUE);

-- Admin can manage notifications
CREATE POLICY "Admins can manage notifications" 
  ON public.admin_notifications 
  FOR ALL 
  USING (TRUE);
