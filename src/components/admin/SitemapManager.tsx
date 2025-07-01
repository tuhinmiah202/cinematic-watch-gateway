
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Download, UploadCloud, RefreshCw, Eye, AlertTriangle, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { contentService } from "@/services/contentService";
import { tmdbService } from "@/services/tmdbService";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Helper to fetch sitemap.xml from public
async function fetchSitemapXml() {
  const res = await fetch("/sitemap.xml");
  return await res.text();
}

// Dynamic sitemap generate with proper XML formatting
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

  const baseUrl = 'https://cinestreambd.onrender.com';
  const currentDate = new Date().toISOString().split('T')[0];
  
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/admin/dashboard</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.3</priority>
  </url>`;

  // Add content pages with proper escaping
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
    const blob = new Blob([cleanContent], { type: "application/xml" });
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
      }
    } catch (error) {
      console.error('Error generating sitemap:', error);
      setUploadInfo('Error generating sitemap. Please try again.');
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
      
      setUploadInfo("Sitemap XML loaded and validated.");
    };
    reader.readAsText(file);
  };

  const currentXml = generatedXml || liveSitemap;

  return (
    <Card className="bg-gray-800 border-gray-700 mb-6">
      <CardHeader>
        <CardTitle className="text-white text-lg flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-yellow-400" />
          Sitemap Management & SEO Fix
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
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
                  "Sitemap is valid and properly formatted!"
                ) : (
                  <div>
                    <div className="font-semibold mb-1">Sitemap validation errors:</div>
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
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold flex items-center gap-2 w-full md:w-auto"
              onClick={handleGenerateAndDownload}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Generate &amp; Validate Sitemap
            </Button>
            
            <Button
              onClick={handleDownload}
              variant="outline"
              className="text-white border-white/20 flex items-center gap-2 w-full md:w-auto"
              disabled={!currentXml}
            >
              <Download className="w-4 h-4" />
              Download Current Sitemap
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
                  Upload &amp; Validate
                </span>
              </Button>
            </label>
          </div>

          {/* SEO Fix Instructions */}
          <div className="text-gray-400 border border-gray-700 rounded-md p-4 bg-gray-900/40 text-sm">
            <div className="font-bold text-base text-white mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              How to Fix Your Sitemap Issues:
            </div>
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-yellow-300 mb-1">Problem:</h4>
                <p>Google shows "Sitemap could not be read" and "General HTTP error" because:</p>
                <ul className="list-disc list-inside ml-4 space-y-1 text-xs">
                  <li>Your sitemap might have XML formatting issues</li>
                  <li>The sitemap URL might not be accessible</li>
                  <li>Missing proper XML headers or namespace</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-green-300 mb-1">Solution:</h4>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Click "Generate &amp; Validate Sitemap" to create a properly formatted sitemap</li>
                  <li>Check for any validation errors above</li>
                  <li>Replace your <code>public/sitemap.xml</code> file with the generated content</li>
                  <li>Ensure your sitemap is accessible at: <code>https://cinestreambd.onrender.com/sitemap.xml</code></li>
                  <li>Submit the sitemap URL to Google Search Console</li>
                  <li>Wait 24-48 hours for Google to re-crawl</li>
                </ol>
              </div>
            </div>
            
            {uploadInfo && (
              <div className="mt-3 text-xs text-green-400 bg-green-500/10 p-2 rounded">
                {uploadInfo}
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
                {currentXml.split('\n').slice(0, 15).join('\n')}
                {currentXml.split('\n').length > 15 && '\n... (truncated)'}
              </pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
