CREATE TABLE public.content_overrides (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tmdb_id integer NOT NULL,
  media_type text NOT NULL DEFAULT 'movie',
  title text,
  hindi_stream_url text,
  download_url text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (tmdb_id, media_type)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_overrides TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_overrides TO authenticated;
GRANT ALL ON public.content_overrides TO service_role;

ALTER TABLE public.content_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view content overrides"
  ON public.content_overrides FOR SELECT USING (true);

CREATE POLICY "Anyone can insert content overrides"
  ON public.content_overrides FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update content overrides"
  ON public.content_overrides FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can delete content overrides"
  ON public.content_overrides FOR DELETE USING (true);

CREATE TRIGGER update_content_overrides_updated_at
  BEFORE UPDATE ON public.content_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();