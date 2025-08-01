
import { useQuery } from '@tanstack/react-query';
import { tmdbService } from '@/services/tmdbService';
import { contentService } from '@/services/contentService';
import { useEffect } from 'react';

const Sitemap = () => {
  const { data: supabaseContent } = useQuery({
    queryKey: ['supabase-content-sitemap'],
    queryFn: () => contentService.getApprovedContent()
  });

  const { data: tmdbContent } = useQuery({
    queryKey: ['tmdb-popular-sitemap'],
    queryFn: async () => {
      try {
        const [movies, tvShows] = await Promise.all([
          tmdbService.getPopularMovies(),
          tmdbService.getPopularTVShows()
        ]);
        return [...movies.results, ...tvShows.results];
      } catch (error) {
        console.error('Error fetching TMDB content:', error);
        return [];
      }
    }
  });

  useEffect(() => {
    // Generate sitemap XML with proper structure
    const generateSitemap = () => {
      const baseUrl = 'https://moviesuggest.xyz';
      const currentDate = new Date().toISOString().split('T')[0];
      
      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;

      // Add Supabase content with proper escaping
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
        });
      }

      // Add TMDB content
      if (tmdbContent && Array.isArray(tmdbContent)) {
        tmdbContent.forEach((item) => {
          if (item && item.id) {
            sitemap += `
  <url>
    <loc>${baseUrl}/movie/${item.id}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
          }
        });
      }

      sitemap += `
</urlset>`;

      return sitemap;
    };

    if (supabaseContent || tmdbContent) {
      console.log('Sitemap data ready with moviesuggest.xyz domain');
    }
  }, [supabaseContent, tmdbContent]);

  return null;
};

export default Sitemap;
