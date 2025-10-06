import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { contentService } from "@/services/contentService";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useAdClickTracker } from "@/hooks/useAdClickTracker";
import { useEffect } from "react";

const DownloadStep1 = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { handleClickWithAd, clickCount } = useAdClickTracker(id || '');

  const { data: movie } = useQuery({
    queryKey: ['content', id],
    queryFn: () => contentService.getContentById(id!),
    enabled: !!id,
  });

  const handleDownloadClick = () => {
    handleClickWithAd(() => navigate(`/download-step2/${id}`));
  };

  const getClickMessage = () => {
    if (clickCount === 0) return "Click the button 2 times to proceed";
    if (clickCount === 1) return "Click 1 more time";
    return "Ready! Click to proceed";
  };

  useEffect(() => {
    // Load banner ad scripts for each ad
    const loadBannerAd = (containerId: string, adIndex: number) => {
      // Create atOptions script for this specific ad
      const atOptionsScript = document.createElement('script');
      atOptionsScript.type = 'text/javascript';
      atOptionsScript.innerHTML = `
        atOptions${adIndex} = {
          'key' : '9733ddf1f8648b3b155c611384f5dee2',
          'format' : 'iframe',
          'height' : 250,
          'width' : 300,
          'params' : {}
        };`;
      
      // Create invoke script
      const invokeScript = document.createElement('script');
      invokeScript.type = 'text/javascript';
      invokeScript.src = '//www.highperformanceformat.com/9733ddf1f8648b3b155c611384f5dee2/invoke.js';
      invokeScript.async = true;
      invokeScript.id = `ad-script-${adIndex}`;
      
      document.head.appendChild(atOptionsScript);
      document.head.appendChild(invokeScript);
      
      return { atOptionsScript, invokeScript };
    };
    
    // Load 3 banner ads
    const ad1 = loadBannerAd('container-9733ddf1f8648b3b155c611384f5dee2-1', 1);
    const ad2 = loadBannerAd('container-9733ddf1f8648b3b155c611384f5dee2-2', 2);
    const ad3 = loadBannerAd('container-9733ddf1f8648b3b155c611384f5dee2-3', 3);

    return () => {
      // Cleanup all scripts
      [ad1, ad2, ad3].forEach(ad => {
        if (ad.atOptionsScript && document.head.contains(ad.atOptionsScript)) {
          document.head.removeChild(ad.atOptionsScript);
        }
        if (ad.invokeScript && document.head.contains(ad.invokeScript)) {
          document.head.removeChild(ad.invokeScript);
        }
      });
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 py-20 px-4">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold">{movie?.title}</h1>
          <p className="text-muted-foreground text-lg">
            Prepare to download your content
          </p>
        </div>

        <div className="bg-card p-8 rounded-lg shadow-lg space-y-6">
          <div className="w-24 h-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <Download className="w-12 h-12 text-primary" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Step 1 of 2</h2>
            <p className="text-muted-foreground">
              {getClickMessage()}
            </p>
          </div>

          <Button 
            onClick={handleDownloadClick}
            size="lg"
            className="w-full max-w-xs mx-auto"
          >
            <Download className="mr-2 h-5 w-5" />
            Continue to Download
          </Button>

          {/* New Banner Ads */}
          <div className="space-y-4 mt-6">
            <div className="flex justify-center">
              <div id="container-9733ddf1f8648b3b155c611384f5dee2-1"></div>
            </div>
            <div className="flex justify-center">
              <div id="container-9733ddf1f8648b3b155c611384f5dee2-2"></div>
            </div>
            <div className="flex justify-center">
              <div id="container-9733ddf1f8648b3b155c611384f5dee2-3"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadStep1;
