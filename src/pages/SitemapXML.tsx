
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
    <loc>${baseUrl}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;

      // Add Supabase content if available
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

      // Add TMDB content if available
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

      // Clear existing content and display XML
      document.body.innerHTML = '';
      document.body.style.cssText = 'font-family: monospace; white-space: pre-wrap; margin: 0; padding: 10px; background: #f5f5f5;';
      
      const pre = document.createElement('pre');
      pre.textContent = sitemap;
      pre.style.cssText = 'margin: 0; font-size: 12px; line-height: 1.4;';
      document.body.appendChild(pre);
      
      // Set title
      document.title = 'Sitemap - MovieSuggest';
      
      // Create and append a meta tag for content type
      const metaTag = document.createElement('meta');
      metaTag.setAttribute('http-equiv', 'Content-Type');
      metaTag.setAttribute('content', 'application/xml; charset=utf-8');
      document.head.appendChild(metaTag);
    }
  }, [supabaseContent, tmdbContent, isLoadingSupabase, isLoadingTmdb]);

  if (isLoadingSupabase || isLoadingTmdb) {
    return (
      <div style={{ 
        fontFamily: 'monospace', 
        padding: '20px',
        backgroundColor: '#f5f5f5',
        color: '#333',
        minHeight: '100vh'
      }}>
        <h1>Generating sitemap...</h1>
        <p>Please wait while we fetch the latest content.</p>
      </div>
    );
  }

  return null;
};

export default SitemapXML;
