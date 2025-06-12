
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Anyone can view approved content" ON public.content;
DROP POLICY IF EXISTS "Anyone can view episodes for approved content" ON public.episodes;
DROP POLICY IF EXISTS "Anyone can view active streaming links for approved content" ON public.streaming_links;

-- Create new policies that allow admin operations and public read access
CREATE POLICY "Public can view approved content" ON public.content
  FOR SELECT USING (is_admin_approved = true);

CREATE POLICY "Allow all insert operations on content" ON public.content
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all update operations on content" ON public.content
  FOR UPDATE USING (true);

CREATE POLICY "Allow all delete operations on content" ON public.content
  FOR DELETE USING (true);

-- Similar policies for related tables
CREATE POLICY "Allow all operations on cast_members" ON public.cast_members
  FOR ALL USING (true);

CREATE POLICY "Allow all operations on content_cast" ON public.content_cast
  FOR ALL USING (true);

CREATE POLICY "Allow all operations on episodes" ON public.episodes
  FOR ALL USING (true);

CREATE POLICY "Allow all operations on content_genres" ON public.content_genres
  FOR ALL USING (true);

CREATE POLICY "Allow all operations on streaming_links" ON public.streaming_links
  FOR ALL USING (true);

-- Clear all existing content to start fresh
DELETE FROM public.content;
