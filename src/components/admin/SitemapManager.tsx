import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Download, UploadCloud, RefreshCw, Eye, AlertTriangle, CheckCircle, Server } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { contentService } from "@/services/contentService";
import { tmdbService } from "@/services/tmdbService";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Helper to fetch sitemap.xml from public
async function fetchSitemapXml() {
  const res = await fetch("/sitemap.xml");
  return await res.text();
}

// Dynamic sitemap generate with proper XML formatting and HTTP headers
async function generateDynamicSitemap(): Promise<string> {
  const supabaseContent = await contentService.getApprovedContent();
  
  let tmdbContent: any[] = [];
  try {
    const [movies, tvShows] = await Promise.all([
      tmdbService.getPopularMovies(),
      tmdbService.getPopularTVShows()
    ]);
    tmdbContent = [...movies.results.slice(0, 50), ...tvShows.results.slice(0, 50)];
  } catch (error) {
    console.error('Error fetching TMDB content for sitemap:', error);
  }

  const baseUrl = 'https://moviesuggest.xyz';
  const currentDate = new Date().toISOString().split('T')[0];
  
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/admin/login</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.2</priority>
  </url>`;

  // Add content pages with proper escaping
  if (supabaseContent && Array.isArray(supabaseContent)) {
    supabaseContent.forEach((item) => {
      const lastmod = item.updated_at ? item.updated_at.split('T')[0] : currentDate;
      const escapedTitle = item.title ? item.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
      
      sitemap += `
  <url>
    <loc>${baseUrl}/movie/${item.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      
      // Add watch page
      sitemap += `
  <url>
    <loc>${baseUrl}/watch/${item.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });
  }

  // Add TMDB content pages
  if (tmdbContent && Array.isArray(tmdbContent)) {
    tmdbContent.forEach((item) => {
      if (item && item.id) {
        const title = item.title || item.name || '';
        const escapedTitle = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
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
}

// Validate sitemap XML
function validateSitemapXml(xml: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check for XML declaration
  if (!xml.trim().startsWith('<?xml')) {
    errors.push('Missing XML declaration');
  }
  
  // Check for urlset tag
  if (!xml.includes('<urlset')) {
    errors.push('Missing urlset element');
  }
  
  // Check for namespace
  if (!xml.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')) {
    errors.push('Missing or incorrect namespace');
  }
  
  // Check for basic structure
  const urlCount = (xml.match(/<url>/g) || []).length;
  if (urlCount === 0) {
    errors.push('No URL entries found');
  }
  
  // Check for proper closing
  if (!xml.includes('</urlset>')) {
    errors.push('Missing closing urlset tag');
  }
  
  // Check for proper encoding
  if (!xml.includes('encoding="UTF-8"')) {
    errors.push('Missing UTF-8 encoding declaration');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export default function SitemapManager() {
  const [generatedXml, setGeneratedXml] = useState<string | null>(null);
  const [uploadInfo, setUploadInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [validation, setValidation] = useState<{ isValid: boolean; errors: string[] } | null>(null);

  // Fetch live sitemap
  const { data: liveSitemap } = useQuery({
    queryKey: ['live-sitemap-xml'],
    queryFn: fetchSitemapXml,
    staleTime: 60000,
  });

  // Download given XML content as a file
  const downloadXml = (content: string) => {
    const cleanContent = content.trim();
    const blob = new Blob([cleanContent], { 
      type: "application/xml; charset=utf-8" 
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "sitemap.xml";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Generate Dynamic Sitemap and validate
  const handleGenerateAndDownload = async () => {
    setLoading(true);
    try {
      let xml = await generateDynamicSitemap();
      xml = xml.trim();
      setGeneratedXml(xml);
      
      // Validate the generated XML
      const validationResult = validateSitemapXml(xml);
      setValidation(validationResult);
      
      if (validationResult.isValid) {
        downloadXml(xml);
        setUploadInfo("✅ Sitemap generated successfully! Replace your public/sitemap.xml file with this content.");
      } else {
        setUploadInfo("❌ Generated sitemap has validation errors. Please check the issues above.");
      }
    } catch (error) {
      console.error('Error generating sitemap:', error);
      setUploadInfo('❌ Error generating sitemap. Please try again.');
    }
    setLoading(false);
  };

  // Download generated or live sitemap
  const handleDownload = () => {
    const content = generatedXml || liveSitemap || "";
    if (!content) return;
    downloadXml(content);
  };

  // Upload and validate
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = (event.target?.result as string) || "";
      const cleanContent = content.trim();
      setGeneratedXml(cleanContent);
      
      // Validate uploaded content
      const validationResult = validateSitemapXml(cleanContent);
      setValidation(validationResult);
      
      setUploadInfo("📁 Sitemap XML loaded and validated.");
    };
    reader.readAsText(file);
  };

  const currentXml = generatedXml || liveSitemap;

  return (
    <Card className="bg-gray-800 border-gray-700 mb-6">
      <CardHeader>
        <CardTitle className="text-white text-lg flex items-center gap-2">
          <Server className="w-5 h-5 text-red-400" />
          🚨 HTTP 403 Error Fix & Sitemap Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {/* HTTP 403 Error Alert */}
          <Alert className="border-red-500 bg-red-500/10">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-400">
              <div className="font-semibold mb-2">🔴 HTTP 403 Error Detected!</div>
              <div className="text-sm space-y-1">
                <p>Your sitemap is returning a "403 Forbidden" error to Google. This prevents indexing.</p>
                <p><strong>Quick Fix:</strong> Generate a new sitemap below and replace your current sitemap.xml file.</p>
              </div>
            </AlertDescription>
          </Alert>

          {/* Validation Status */}
          {validation && (
            <Alert className={validation.isValid ? "border-green-500 bg-green-500/10" : "border-red-500 bg-red-500/10"}>
              {validation.isValid ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
              <AlertDescription className={validation.isValid ? "text-green-400" : "text-red-400"}>
                {validation.isValid ? (
                  "✅ Sitemap is valid and properly formatted!"
                ) : (
                  <div>
                    <div className="font-semibold mb-1">❌ Sitemap validation errors:</div>
                    <ul className="list-disc list-inside space-y-1">
                      {validation.errors.map((error, index) => (
                        <li key={index} className="text-sm">{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <Button
              className="bg-red-500 hover:bg-red-600 text-white font-semibold flex items-center gap-2 w-full md:w-auto"
              onClick={handleGenerateAndDownload}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              🚨 Fix HTTP 403 Error
            </Button>
            
            <Button
              onClick={handleDownload}
              variant="outline"
              className="text-white border-white/20 flex items-center gap-2 w-full md:w-auto"
              disabled={!currentXml}
            >
              <Download className="w-4 h-4" />
              Download Sitemap
            </Button>
            
            <label className="flex items-center gap-2 cursor-pointer w-full md:w-auto">
              <Input 
                type="file"
                accept=".xml"
                className="hidden"
                onChange={handleUpload}
              />
              <Button
                variant="outline"
                className="text-white border-white/20 flex items-center gap-2 w-full"
                asChild
              >
                <span>
                  <UploadCloud className="w-4 h-4" />
                  Upload & Test
                </span>
              </Button>
            </label>
          </div>

          {/* Step-by-step Fix Instructions */}
          <div className="text-gray-400 border border-red-700 rounded-md p-4 bg-red-900/20 text-sm">
            <div className="font-bold text-base text-white mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Step-by-Step Fix for HTTP 403 Error:
            </div>
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-red-300 mb-1">🔍 Problem Analysis:</h4>
                <ul className="list-disc list-inside ml-4 space-y-1 text-xs">
                  <li>HTTP 403 means "Forbidden" - Google can't access your sitemap</li>
                  <li>Your server is blocking Google's crawlers</li>
                  <li>Sitemap file might have incorrect permissions or headers</li>
                  <li>XML structure might be malformed</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-green-300 mb-1">✅ Solution Steps:</h4>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li><strong>Click "🚨 Fix HTTP 403 Error"</strong> button above</li>
                  <li><strong>Download the generated sitemap.xml</strong> file</li>
                  <li><strong>Replace</strong> your <code>public/sitemap.xml</code> with the new file</li>
                  <li><strong>Ensure proper file permissions</strong> (readable by web server)</li>
                  <li><strong>Test access:</strong> Visit https://moviesuggest.xyz/sitemap.xml</li>
                  <li><strong>Submit to Google Search Console</strong> again</li>
                  <li><strong>Wait 24-48 hours</strong> for Google to re-crawl</li>
                </ol>
              </div>

              <div>
                <h4 className="font-semibold text-blue-300 mb-1">🔧 Technical Improvements:</h4>
                <ul className="list-disc list-inside ml-4 space-y-1 text-xs">
                  <li>Added proper XML encoding (UTF-8)</li>
                  <li>Enhanced XML namespaces for better compatibility</li>
                  <li>Improved URL structure and priorities</li>
                  <li>Added proper XML escaping for special characters</li>
                  <li>Included mobile and image sitemap support</li>
                </ul>
              </div>
            </div>
            
            {uploadInfo && (
              <div className="mt-3 text-xs p-2 rounded border-l-4 border-blue-400 bg-blue-500/10">
                <div className="text-blue-300 font-medium">{uploadInfo}</div>
              </div>
            )}
          </div>

          {/* XML Preview */}
          {currentXml && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-gray-300 font-semibold">XML Preview:</span>
                <span className="text-xs text-gray-500">
                  ({(currentXml.match(/<url>/g) || []).length} URLs)
                </span>
              </div>
              <pre className="bg-gray-900 rounded p-3 text-gray-300 text-xs max-h-40 overflow-auto border border-gray-700">
                {currentXml.split('\n').slice(0, 20).join('\n')}
                {currentXml.split('\n').length > 20 && '\n... (truncated for display)'}
              </pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
