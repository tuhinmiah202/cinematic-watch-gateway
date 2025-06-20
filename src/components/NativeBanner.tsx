
import { useEffect, useRef } from 'react';

interface NativeBannerProps {
  className?: string;
}

const NativeBanner = ({ className = '' }: NativeBannerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      // Create 3 ad containers to match movie card grid
      for (let i = 0; i < 3; i++) {
        const adContainer = document.createElement('div');
        adContainer.id = `container-a72b44e62300d07717fb5618ec6b0836-${i}`;
        adContainer.className = 'native-ad-item w-full h-full min-h-[200px] bg-gray-800/30 rounded-lg border border-gray-700/50 flex items-center justify-center';
        containerRef.current.appendChild(adContainer);
      }
      
      // Load the ad script only once
      if (!document.querySelector('script[src*="a72b44e62300d07717fb5618ec6b0836"]')) {
        const script = document.createElement('script');
        script.src = '//pl26926162.profitableratecpm.com/a72b44e62300d07717fb5618ec6b0836/invoke.js';
        script.async = true;
        script.setAttribute('data-cfasync', 'false');
        
        script.onload = () => {
          console.log('Native ad script loaded successfully');
        };
        
        script.onerror = (error) => {
          console.error('Native ad script failed to load:', error);
        };
        
        document.head.appendChild(script);
      }
    }
  }, []);

  return (
    <div className={`native-banner-container ${className}`}>
      <div 
        ref={containerRef} 
        className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 w-full"
      />
      <p className="text-xs text-gray-500 text-center mt-2">Advertisement</p>
    </div>
  );
};

export default NativeBanner;
