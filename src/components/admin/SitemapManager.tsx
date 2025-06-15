
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Download, UploadCloud, RefreshCw, Eye, FileUp, FileDown, FileInput, FileOutput } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

// Helper to fetch sitemap.xml from public
async function fetchSitemapXml() {
  const res = await fetch("/sitemap.xml");
  return await res.text();
}

// Dynamic sitemap generate (placeholder for actual API or client-only approach)
async function generateDynamicSitemap(): Promise<string> {
  // Here use the same logic as in SitemapXML.tsx to refetch current content and build XML
  // For now, simply refetch public/sitemap.xml as a placeholder
  return await fetchSitemapXml();
}

export default function SitemapManager() {
  const [generatedXml, setGeneratedXml] = useState<string | null>(null);
  const [uploadInfo, setUploadInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("manager"); // can expand with more tabs if needed

  // Fetch live sitemap
  const { data: liveSitemap } = useQuery({
    queryKey: ['live-sitemap-xml'],
    queryFn: fetchSitemapXml,
    staleTime: 60000,
  });

  // Download given XML content as a file
  const downloadXml = (content: string) => {
    const blob = new Blob([content], { type: "application/xml" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "sitemap.xml";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Generate Dynamic Sitemap and immediately download
  const handleGenerateAndDownload = async () => {
    setLoading(true);
    const xml = await generateDynamicSitemap();
    setGeneratedXml(xml);
    downloadXml(xml);
    setLoading(false);
  };

  // Download generated or live sitemap
  const handleDownload = () => {
    const content = generatedXml || liveSitemap || "";
    if (!content) return;
    downloadXml(content);
  };

  // Upload and replace (client-side only – for a real update, this would need backend API)
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      // In a real app, you'd send to backend or update storage here
      setGeneratedXml(event.target?.result as string);
      setUploadInfo("Sitemap XML loaded in memory. (Live replace requires backend/API)");
    };
    reader.readAsText(file);
  };

  return (
    <Card className="bg-gray-800 border-gray-700 mb-6">
      <CardHeader>
        <CardTitle className="text-white text-lg flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-yellow-400" />
          Sitemap Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <Button
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold flex items-center gap-2 w-full md:w-auto"
              onClick={handleGenerateAndDownload}
              disabled={loading}
            >
              <RefreshCw className="w-4 h-4" />
              Generate &amp; Download Sitemap
            </Button>
            <Button
              onClick={handleDownload}
              variant="outline"
              className="text-white border-white/20 flex items-center gap-2 w-full md:w-auto"
              disabled={(!generatedXml && !liveSitemap)}
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
              <span>
                <Button
                  variant="outline"
                  className="text-white border-white/20 flex items-center gap-2"
                  asChild
                >
                  <span>
                    <UploadCloud className="w-4 h-4" />
                    Upload Sitemap
                  </span>
                </Button>
              </span>
            </label>
            <Button
              variant="outline"
              className="text-white border-white/20 flex items-center gap-2 w-full md:w-auto"
              asChild
              disabled
            >
              <span>
                <Eye className="w-4 h-4" />
                View Current Live Sitemap
              </span>
            </Button>
          </div>
          <div className="text-gray-400 border border-gray-700 rounded-md p-4 bg-gray-900/40 text-xs">
            <div className="font-bold text-base text-white mb-3">How to Update Your Sitemap:</div>
            <ol className="space-y-1 list-decimal list-inside">
              <li>Click <span className="font-semibold">Generate &amp; Download Sitemap</span>. This will save <code>sitemap.xml</code> to your computer.</li>
              <li>Open the downloaded file in a text editor.</li>
              <li>Copy all the content from the edited file if needed.</li>
              <li>In your codebase, replace <span className="font-mono">public/sitemap.xml</span> with your new content.</li>
              <li>Deploy to your hosting to make the new sitemap live!</li>
            </ol>
            <div className="mt-2 text-yellow-300">
              Note: Uploading here only updates the file in the browser memory.<br />
              To update the live sitemap, you must update <code>public/sitemap.xml</code> manually and deploy.
            </div>
            {uploadInfo && (
              <div className="mt-2 text-xs text-green-400">{uploadInfo}</div>
            )}
          </div>
          <div className="mt-4">
            <span className="text-gray-300 font-semibold">Preview (first 6 lines):</span>
            <pre className="bg-gray-900 rounded p-2 text-gray-300 text-xs max-h-32 overflow-auto mt-1 border border-gray-700">
              {(generatedXml || liveSitemap || "No sitemap loaded.").split('\n').slice(0,6).join('\n')}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
