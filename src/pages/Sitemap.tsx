
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
      const [movies, tvShows] = await Promise.all([
        tmdbService.getPopularMovies(),
        tmdbService.getPopularTVShows()
      ]);
      return [...movies.results, ...tvShows.results];
    }
  });

  useEffect(() => {
    // Generate sitemap XML
    const generateSitemap = () => {
      const baseUrl = 'https://cinestreambd.onrender.com';
      const currentDate = new Date().toISOString().split('T')[0];
      
      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;

      // Add Supabase content
      if (supabaseContent) {
        supabaseContent.forEach((item) => {
          sitemap += `
  <url>
    <loc>${baseUrl}/movie/${item.id}</loc>
    <lastmod>${item.updated_at.split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
        });
      }

      // Add TMDB content
      if (tmdbContent) {
        tmdbContent.forEach((item) => {
          sitemap += `
  <url>
    <loc>${baseUrl}/movie/${item.id}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
        });
      }

      sitemap += `
</urlset>`;

      // Set response headers and content
      const response = new Response(sitemap, {
        headers: {
          'Content-Type': 'application/xml',
          'Cache-Control': 'public, max-age=3600'
        }
      });

      return response;
    };

    // This component won't actually render, it's just for data fetching
    if (supabaseContent && tmdbContent) {
      // In a real implementation, this would be handled by the routing system
      console.log('Sitemap data ready');
    }
  }, [supabaseContent, tmdbContent]);

  return null; // This component doesn't render anything
};

export default Sitemap;
