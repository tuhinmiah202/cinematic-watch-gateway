
import { useQuery } from '@tanstack/react-query';
import { tmdbService } from '@/services/tmdbService';
import { contentService } from '@/services/contentService';
import { useEffect } from 'react';

const SitemapXML = () => {
  const { data: supabaseContent, isLoading: isLoadingSupabase } = useQuery({
    queryKey: ['supabase-content-sitemap'],
    queryFn: () => contentService.getApprovedContent()
  });

  const { data: tmdbContent, isLoading: isLoadingTmdb } = useQuery({
    queryKey: ['tmdb-popular-sitemap'],
    queryFn: async () => {
      const [movies, tvShows] = await Promise.all([
        tmdbService.getPopularMovies(),
        tmdbService.getPopularTVShows()
      ]);
      return [...movies.results.slice(0, 100), ...tvShows.results.slice(0, 100)];
    }
  });

  useEffect(() => {
    if (!isLoadingSupabase && !isLoadingTmdb && supabaseContent && tmdbContent) {
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

      // Add TMDB content
      tmdbContent.forEach((item) => {
        sitemap += `
  <url>
    <loc>${baseUrl}/movie/${item.id}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
      });

      sitemap += `
</urlset>`;

      // Set the content type and write the XML
      const head = document.head || document.getElementsByTagName('head')[0];
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Type';
      meta.content = 'application/xml; charset=utf-8';
      head.appendChild(meta);
      
      // Write XML content
      document.body.innerHTML = `<pre>${sitemap.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`;
      document.body.style.fontFamily = 'monospace';
      document.body.style.whiteSpace = 'pre-wrap';
      document.body.style.margin = '0';
      document.body.style.padding = '10px';
    }
  }, [supabaseContent, tmdbContent, isLoadingSupabase, isLoadingTmdb]);

  if (isLoadingSupabase || isLoadingTmdb) {
    return (
      <div style={{ 
        fontFamily: 'monospace', 
        padding: '20px',
        backgroundColor: '#000',
        color: '#fff',
        minHeight: '100vh'
      }}>
        Generating sitemap...
      </div>
    );
  }

  return null;
};

export default SitemapXML;
