
import { useQuery } from '@tanstack/react-query';
import { sitemapService } from '@/services/sitemapService';
import { useEffect } from 'react';

const SitemapXML = () => {
  const { data: sitemapXml, isLoading } = useQuery({
    queryKey: ['sitemap-xml-generation'],
    queryFn: () => sitemapService.generateSitemap(),
    staleTime: 300000, // 5 minutes
    retry: 1
  });

  useEffect(() => {
    if (sitemapXml && !isLoading) {
      // Replace document content with XML
      if (typeof window !== 'undefined') {
        // Set the document content type to XML
        document.open('application/xml', 'replace');
        document.write(sitemapXml);
        document.close();
        
        // Ensure proper content type header
        const response = new Response(sitemapXml, {
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600, s-maxage=86400',
            'X-Robots-Tag': 'all'
          }
        });
      }
    }
  }, [sitemapXml, isLoading]);

  if (isLoading) {
    return null;
  }

  return null;
};

export default SitemapXML;
