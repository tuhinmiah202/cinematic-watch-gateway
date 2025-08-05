
import { useQuery } from '@tanstack/react-query';
import { tmdbService } from '@/services/tmdbService';
import { contentService } from '@/services/contentService';
import { useEffect } from 'react';

const SitemapXML = () => {
  const { data: supabaseContent, isLoading: isLoadingSupabase } = useQuery({
    queryKey: ['supabase-content-sitemap'],
    queryFn: () => contentService.getApprovedContent(),
    retry: false
  });

  const { data: tmdbContent, isLoading: isLoadingTmdb } = useQuery({
    queryKey: ['tmdb-popular-sitemap'],
    queryFn: async () => {
      try {
        const [movies, tvShows] = await Promise.all([
          tmdbService.getPopularMovies(),
          tmdbService.getPopularTVShows()
        ]);
        return [...movies.results.slice(0, 100), ...tvShows.results.slice(0, 100)];
      } catch (error) {
        console.error('Error fetching TMDB content:', error);
        return [];
      }
    },
    retry: false
  });

  useEffect(() => {
    if (!isLoadingSupabase && !isLoadingTmdb) {
      const baseUrl = 'https://moviesuggest.xyz';
      const currentDate = new Date().toISOString().split('T')[0];
      
      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/about</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/privacy</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`;

      // Add Supabase content
      if (supabaseContent && Array.isArray(supabaseContent)) {
        supabaseContent.forEach((item) => {
          const lastmod = item.updated_at ? item.updated_at.split('T')[0] : currentDate;
          sitemap += `
  <url>
    <loc>${baseUrl}/movie/${item.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
          
          sitemap += `
  <url>
    <loc>${baseUrl}/watch/${item.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
        });
      }

      // Add TMDB content
      if (tmdbContent && Array.isArray(tmdbContent)) {
        tmdbContent.forEach((item) => {
          if (item && item.id) {
            sitemap += `
  <url>
    <loc>${baseUrl}/movie/tmdb-${item.id}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
          }
        });
      }

      sitemap += `
</urlset>`;

      // Return the sitemap as plain text response
      const response = new Response(sitemap, {
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
          'X-Robots-Tag': 'all'
        }
      });

      // For client-side, we need to replace the document content
      if (typeof document !== 'undefined') {
        document.open('application/xml', 'replace');
        document.write(sitemap);
        document.close();
      }
    }
  }, [supabaseContent, tmdbContent, isLoadingSupabase, isLoadingTmdb]);

  // Return minimal loading state
  if (isLoadingSupabase || isLoadingTmdb) {
    return null;
  }

  return null;
};

export default SitemapXML;
