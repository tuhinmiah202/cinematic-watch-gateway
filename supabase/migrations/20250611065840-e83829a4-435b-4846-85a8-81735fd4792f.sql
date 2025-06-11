
-- Create enum for content type
CREATE TYPE content_type AS ENUM ('movie', 'series');

-- Create main content table with all required fields
CREATE TABLE IF NOT EXISTS public.content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  content_type content_type NOT NULL,
  release_year INTEGER,
  poster_url TEXT,
  trailer_url TEXT,
  thumbnail_url TEXT,
  tmdb_id INTEGER,
  is_admin_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cast table for normalized cast storage
CREATE TABLE IF NOT EXISTS public.cast_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  profile_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create junction table for content-cast relationships
CREATE TABLE IF NOT EXISTS public.content_cast (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES public.content(id) ON DELETE CASCADE,
  cast_member_id UUID REFERENCES public.cast_members(id) ON DELETE CASCADE,
  role TEXT, -- e.g., "Actor", "Director", "Producer"
  character_name TEXT, -- Character name for actors
  UNIQUE(content_id, cast_member_id)
);

-- Create episodes table for series
CREATE TABLE IF NOT EXISTS public.episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES public.content(id) ON DELETE CASCADE,
  season_number INTEGER NOT NULL,
  episode_number INTEGER NOT NULL,
  title TEXT,
  description TEXT,
  duration_minutes INTEGER,
  air_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(content_id, season_number, episode_number)
);

-- Create genres table
CREATE TABLE IF NOT EXISTS public.genres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  tmdb_id INTEGER UNIQUE
);

-- Create junction table for content-genre relationships
CREATE TABLE IF NOT EXISTS public.content_genres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES public.content(id) ON DELETE CASCADE,
  genre_id UUID REFERENCES public.genres(id) ON DELETE CASCADE,
  UNIQUE(content_id, genre_id)
);

-- Create streaming links table
CREATE TABLE IF NOT EXISTS public.streaming_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES public.content(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  platform_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_content_type ON public.content(content_type);
CREATE INDEX IF NOT EXISTS idx_content_approved ON public.content(is_admin_approved);
CREATE INDEX IF NOT EXISTS idx_content_release_year ON public.content(release_year);
CREATE INDEX IF NOT EXISTS idx_episodes_content_id ON public.episodes(content_id);
CREATE INDEX IF NOT EXISTS idx_content_cast_content_id ON public.content_cast(content_id);
CREATE INDEX IF NOT EXISTS idx_content_genres_content_id ON public.content_genres(content_id);

-- Enable RLS on all tables
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cast_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_cast ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaming_links ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (public read access for approved content, admin write access)
CREATE POLICY "Anyone can view approved content" ON public.content
  FOR SELECT USING (is_admin_approved = true);

CREATE POLICY "Anyone can view cast members" ON public.cast_members
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view content cast relationships" ON public.content_cast
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view episodes for approved content" ON public.episodes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.content 
      WHERE content.id = episodes.content_id 
      AND content.is_admin_approved = true
    )
  );

CREATE POLICY "Anyone can view genres" ON public.genres
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view content genre relationships" ON public.content_genres
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view active streaming links for approved content" ON public.streaming_links
  FOR SELECT USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM public.content 
      WHERE content.id = streaming_links.content_id 
      AND content.is_admin_approved = true
    )
  );

-- Insert some common genres
INSERT INTO public.genres (name, tmdb_id) VALUES
  ('Action', 28),
  ('Adventure', 12),
  ('Animation', 16),
  ('Comedy', 35),
  ('Crime', 80),
  ('Documentary', 99),
  ('Drama', 18),
  ('Family', 10751),
  ('Fantasy', 14),
  ('History', 36),
  ('Horror', 27),
  ('Music', 10402),
  ('Mystery', 9648),
  ('Romance', 10749),
  ('Science Fiction', 878),
  ('TV Movie', 10770),
  ('Thriller', 53),
  ('War', 10752),
  ('Western', 37),
  ('Bollywood', NULL),
  ('K-Drama', NULL)
ON CONFLICT (name) DO NOTHING;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON public.content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
