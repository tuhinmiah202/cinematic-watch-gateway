
import { contentService } from './contentService';
import { tmdbService } from './tmdbService';

export const sitemapService = {
  async generateSitemap(): Promise<string> {
    try {
      const baseUrl = 'https://moviesuggest.xyz';
      const currentDate = new Date().toISOString().split('T')[0];
      
      // Fetch content in parallel
      const [supabaseContent, tmdbContent] = await Promise.all([
        contentService.getApprovedContent().catch(() => []),
        this.getTmdbContent().catch(() => [])
      ]);

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

      return sitemap;
    } catch (error) {
      console.error('Error generating sitemap:', error);
      // Return basic sitemap on error
      const baseUrl = 'https://moviesuggest.xyz';
      const currentDate = new Date().toISOString().split('T')[0];
      
      return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
    }
  },

  async getTmdbContent() {
    try {
      const [movies, tvShows] = await Promise.all([
        tmdbService.getPopularMovies(),
        tmdbService.getPopularTVShows()
      ]);
      return [...movies.results.slice(0, 100), ...tvShows.results.slice(0, 100)];
    } catch (error) {
      console.error('Error fetching TMDB content for sitemap:', error);
      return [];
    }
  }
};
