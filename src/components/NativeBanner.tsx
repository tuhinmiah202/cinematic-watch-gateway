
import { useEffect, useRef } from 'react';

interface NativeBannerProps {
  className?: string;
  adCount?: number;
}

const NativeBanner = ({ className = '', adCount = 2 }: NativeBannerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      // Clear any existing content
      containerRef.current.innerHTML = '';
      
      // Create ad containers based on adCount
      for (let i = 0; i < adCount; i++) {
        const adContainer = document.createElement('div');
        adContainer.id = `container-a72b44e62300d07717fb5618ec6b0836-${Date.now()}-${i}`;
        adContainer.className = 'native-ad-item w-full h-full min-h-[250px] bg-gray-800/30 rounded-lg border border-gray-700/50 flex items-center justify-center';
        adContainer.innerHTML = '<div class="text-gray-500 text-sm">Loading ad...</div>';
        containerRef.current.appendChild(adContainer);
      }
      
      // Load the ad script
      const existingScript = document.querySelector('script[src*="a72b44e62300d07717fb5618ec6b0836"]');
      if (existingScript) {
        existingScript.remove();
      }
      
      const script = document.createElement('script');
      script.src = '//pl26926162.profitableratecpm.com/a72b44e62300d07717fb5618ec6b0836/invoke.js';
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      
      script.onload = () => {
        console.log('Native ad script loaded successfully');
      };
      
      script.onerror = (error) => {
        console.error('Native ad script failed to load:', error);
        // Show fallback content if script fails
        if (containerRef.current) {
          const containers = containerRef.current.querySelectorAll('.native-ad-item');
          containers.forEach(container => {
            container.innerHTML = '<div class="text-gray-500 text-sm">Advertisement unavailable</div>';
          });
        }
      };
      
      document.head.appendChild(script);
    }
  }, [adCount]);

  const gridCols = adCount === 1 ? 'grid-cols-1' : adCount === 2 ? 'grid-cols-2' : 'grid-cols-3';

  return (
    <div className={`native-banner-container ${className}`}>
      <div 
        ref={containerRef} 
        className={`grid ${gridCols} gap-3 md:gap-4 w-full`}
      />
      <p className="text-xs text-gray-500 text-center mt-2">Advertisement</p>
    </div>
  );
};

export default NativeBanner;
