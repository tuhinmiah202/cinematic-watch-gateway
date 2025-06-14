
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

      // Create and download the sitemap as a file
      const element = document.createElement('a');
      const file = new Blob([sitemap], { type: 'application/xml' });
      element.href = URL.createObjectURL(file);
      element.download = 'sitemap.xml';
      
      // Replace the entire page content with raw XML
      document.open();
      document.write(sitemap);
      document.close();
      
      // Set the content type header
      if (document.querySelector('meta[http-equiv="Content-Type"]')) {
        document.querySelector('meta[http-equiv="Content-Type"]')?.setAttribute('content', 'application/xml; charset=utf-8');
      } else {
        const meta = document.createElement('meta');
        meta.setAttribute('http-equiv', 'Content-Type');
        meta.setAttribute('content', 'application/xml; charset=utf-8');
        document.head?.appendChild(meta);
      }
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

  return (
    <div style={{ 
      fontFamily: 'monospace', 
      padding: '20px',
      backgroundColor: '#000',
      color: '#fff',
      minHeight: '100vh'
    }}>
      Sitemap loading...
    </div>
  );
};

export default SitemapXML;
