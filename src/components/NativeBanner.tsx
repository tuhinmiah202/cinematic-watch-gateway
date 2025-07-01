
import { useEffect, useRef, useState } from 'react';

interface NativeBannerProps {
  className?: string;
  adCount?: number;
}

const NativeBanner = ({ className = '', adCount = 1 }: NativeBannerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [adStatus, setAdStatus] = useState<'loading' | 'loaded' | 'failed'>('loading');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    console.log('Loading native ads with count:', adCount);
    setAdStatus('loading');
    
    // Clear container
    containerRef.current.innerHTML = '';
    
    // Create ad containers
    for (let i = 0; i < adCount; i++) {
      const adContainer = document.createElement('div');
      adContainer.className = 'native-ad-slot bg-gray-800/50 border border-gray-600/30 rounded-lg p-6 min-h-[140px] flex flex-col items-center justify-center';
      adContainer.innerHTML = `
        <div class="flex items-center gap-3 mb-3">
          <div class="animate-pulse w-3 h-3 bg-purple-400 rounded-full"></div>
          <div class="animate-pulse w-3 h-3 bg-purple-400 rounded-full animation-delay-150"></div>
          <div class="animate-pulse w-3 h-3 bg-purple-400 rounded-full animation-delay-300"></div>
        </div>
        <div class="text-gray-300 text-sm font-medium">Loading advertisement...</div>
      `;
      containerRef.current.appendChild(adContainer);
    }

    // Try multiple ad networks
    const loadAds = async () => {
      try {
        // Method 1: Try original native ad network
        await loadProfitableAds();
      } catch (error) {
        console.log('Primary ad network failed, trying backup...');
        try {
          // Method 2: Try backup ad network
          await loadBackupAds();
        } catch (backupError) {
          console.log('Backup ad network also failed, showing enhanced fallback');
          showEnhancedFallback();
        }
      }
    };

    loadAds();

    // Cleanup timeout
    const timeout = setTimeout(() => {
      if (adStatus === 'loading') {
        console.log('Ad loading timeout, showing fallback');
        showEnhancedFallback();
      }
    }, 8000);

    return () => clearTimeout(timeout);
  }, [adCount, retryCount]);

  const loadProfitableAds = () => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = '//pl26926162.profitableratecpm.com/a72b44e62300d07717fb5618ec6b0836/invoke.js';
      script.async = true;
      
      script.onload = () => {
        console.log('Primary ad script loaded');
        setTimeout(() => {
          checkAdContent() ? resolve('loaded') : reject('no content');
        }, 3000);
      };
      
      script.onerror = () => reject('script failed');
      document.head.appendChild(script);
    });
  };

  const loadBackupAds = () => {
    return new Promise((resolve, reject) => {
      // Try a different ad approach
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      script.src = '//www.profitablegatecpm.com/show.js';
      
      script.onload = () => {
        console.log('Backup ad script loaded');
        setTimeout(() => {
          checkAdContent() ? resolve('loaded') : reject('no backup content');
        }, 2000);
      };
      
      script.onerror = () => reject('backup script failed');
      document.head.appendChild(script);
    });
  };

  const checkAdContent = (): boolean => {
    if (!containerRef.current) return false;
    
    const containers = containerRef.current.querySelectorAll('.native-ad-slot');
    let hasRealAds = false;
    
    containers.forEach((container) => {
      const hasIframe = container.querySelector('iframe');
      const hasAdContent = container.querySelector('[data-ad]') || 
                          container.querySelector('.ad-content') ||
                          container.children.length > 1;
      
      if (hasIframe || hasAdContent) {
        hasRealAds = true;
        setAdStatus('loaded');
      }
    });
    
    return hasRealAds;
  };

  const showEnhancedFallback = () => {
    if (!containerRef.current) return;
    
    const containers = containerRef.current.querySelectorAll('.native-ad-slot');
    containers.forEach((container, index) => {
      const adTypes = [
        {
          title: "Sponsored Content",
          description: "Discover amazing deals",
          icon: "🎯"
        },
        {
          title: "Featured Promotion", 
          description: "Special offers for you",
          icon: "⭐"
        },
        {
          title: "Recommended",
          description: "Popular picks today",
          icon: "🔥"
        }
      ];
      
      const ad = adTypes[index % adTypes.length];
      
      container.innerHTML = `
        <div class="w-full text-center py-4">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl mb-3">
            <span class="text-2xl">${ad.icon}</span>
          </div>
          <div class="text-white text-base font-semibold mb-1">${ad.title}</div>
          <div class="text-gray-300 text-sm mb-3">${ad.description}</div>
          <div class="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      `;
    });
    
    setAdStatus('failed');
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setAdStatus('loading');
  };

  // Grid layout based on ad count
  const getGridClasses = () => {
    if (adCount === 1) return 'flex justify-center';
    if (adCount === 2) return 'grid grid-cols-1 md:grid-cols-2 gap-4';
    return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
  };

  return (
    <div className={`native-banner w-full ${className}`}>
      <div 
        ref={containerRef}
        className={`${getGridClasses()} w-full`}
      />
      <div className="text-center mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-500 opacity-70">Advertisement</span>
        {adStatus === 'failed' && retryCount < 2 && (
          <button 
            onClick={handleRetry}
            className="text-xs text-purple-400 hover:text-purple-300 underline"
          >
            Retry loading
          </button>
        )}
      </div>
    </div>
  );
};

export default NativeBanner;
