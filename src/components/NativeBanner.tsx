
import { useEffect, useRef, useState } from 'react';

interface NativeBannerProps {
  className?: string;
  adCount?: number;
}

const NativeBanner = ({ className = '', adCount = 1 }: NativeBannerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [adStatus, setAdStatus] = useState<'loading' | 'loaded' | 'failed'>('loading');
  const scriptLoadedRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!containerRef.current || scriptLoadedRef.current) return;

    console.log('Initializing native banner ads:', { adCount });
    setAdStatus('loading');

    // Clear container
    containerRef.current.innerHTML = '';
    
    // Create ad containers
    for (let i = 0; i < adCount; i++) {
      const adContainer = document.createElement('div');
      const uniqueId = `native-ad-${Date.now()}-${i}`;
      adContainer.id = uniqueId;
      adContainer.className = 'native-ad-container bg-gray-800/40 border border-gray-700/30 rounded-lg p-4 min-h-[120px] flex items-center justify-center';
      
      // Add loading indicator
      adContainer.innerHTML = `
        <div class="flex items-center gap-2 text-gray-400">
          <div class="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"></div>
          <span class="text-sm">Loading ad...</span>
        </div>
      `;
      
      containerRef.current.appendChild(adContainer);
    }

    // Set timeout for ad loading
    timeoutRef.current = setTimeout(() => {
      console.log('Ad loading timeout, showing fallback');
      setAdStatus('failed');
      showFallbackAds();
    }, 10000);

    // Load ad script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = '//pl26926162.profitableratecpm.com/a72b44e62300d07717fb5618ec6b0836/invoke.js';
    script.async = true;
    
    script.onload = () => {
      console.log('Native ad script loaded successfully');
      scriptLoadedRef.current = true;
      
      // Check if ads loaded after a delay
      setTimeout(() => {
        checkAdStatus();
      }, 3000);
    };
    
    script.onerror = () => {
      console.error('Failed to load native ad script');
      setAdStatus('failed');
      showFallbackAds();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    
    // Append script to head
    document.head.appendChild(script);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [adCount]);

  const checkAdStatus = () => {
    if (!containerRef.current) return;

    const containers = containerRef.current.querySelectorAll('.native-ad-container');
    let hasLoadedAds = false;

    containers.forEach((container) => {
      // Check if container has ad content (not just loading indicator)
      const hasAdContent = container.querySelector('iframe') || 
                          container.querySelector('[data-ad-loaded]') ||
                          (container.children.length > 1);
      
      if (hasAdContent) {
        hasLoadedAds = true;
      }
    });

    if (hasLoadedAds) {
      console.log('Ads loaded successfully');
      setAdStatus('loaded');
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    } else {
      console.log('No ads detected, showing fallback');
      setAdStatus('failed');
      showFallbackAds();
    }
  };

  const showFallbackAds = () => {
    if (!containerRef.current) return;

    const containers = containerRef.current.querySelectorAll('.native-ad-container');
    containers.forEach((container, index) => {
      container.innerHTML = `
        <div class="w-full text-center py-4">
          <div class="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg mb-2">
            <span class="text-purple-400 font-bold text-lg">AD</span>
          </div>
          <div class="text-gray-400 text-sm font-medium">Advertisement Space</div>
          <div class="text-gray-500 text-xs mt-1">Content loading...</div>
        </div>
      `;
    });
  };

  // Grid layout based on ad count
  const getGridClasses = () => {
    if (adCount === 1) return 'flex justify-center';
    if (adCount === 2) return 'grid grid-cols-1 md:grid-cols-2 gap-4';
    return 'grid grid-cols-1 md:grid-cols-3 gap-4';
  };

  return (
    <div className={`native-banner w-full ${className}`}>
      <div 
        ref={containerRef}
        className={`${getGridClasses()} w-full`}
      />
      <div className="text-center mt-2">
        <span className="text-xs text-gray-500 opacity-60">Advertisement</span>
      </div>
    </div>
  );
};

export default NativeBanner;
