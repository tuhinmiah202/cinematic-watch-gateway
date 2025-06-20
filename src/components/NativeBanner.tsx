
import { useEffect, useRef } from 'react';

interface NativeBannerProps {
  className?: string;
  adCount?: number;
}

const NativeBanner = ({ className = '', adCount = 1 }: NativeBannerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      // Clear any existing content
      containerRef.current.innerHTML = '';
      
      // Create ad containers based on adCount
      for (let i = 0; i < adCount; i++) {
        const adContainer = document.createElement('div');
        const uniqueId = `container-a72b44e62300d07717fb5618ec6b0836-${Date.now()}-${i}`;
        adContainer.id = uniqueId;
        adContainer.className = 'native-ad-item flex-1 min-h-[200px] bg-gray-800/30 rounded-lg border border-gray-700/50 flex items-center justify-center relative overflow-hidden';
        
        // Add loading content
        adContainer.innerHTML = `
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="text-gray-400 text-sm animate-pulse">Loading advertisement...</div>
          </div>
        `;
        
        containerRef.current.appendChild(adContainer);
      }
      
      // Remove any existing scripts to prevent conflicts
      const existingScripts = document.querySelectorAll('script[src*="a72b44e62300d07717fb5618ec6b0836"]');
      existingScripts.forEach(script => script.remove());
      
      // Add a small delay before loading the script to ensure containers are ready
      setTimeout(() => {
        const script = document.createElement('script');
        script.src = '//pl26926162.profitableratecpm.com/a72b44e62300d07717fb5618ec6b0836/invoke.js';
        script.async = true;
        script.setAttribute('data-cfasync', 'false');
        script.setAttribute('data-ad-client', 'ca-pub-a72b44e62300d07717fb5618ec6b0836');
        
        script.onload = () => {
          console.log('Native ad script loaded successfully');
          
          // Check if ads loaded after a delay
          setTimeout(() => {
            if (containerRef.current) {
              const containers = containerRef.current.querySelectorAll('.native-ad-item');
              containers.forEach((container, index) => {
                // Check if the container still has loading content
                const loadingDiv = container.querySelector('.absolute');
                if (loadingDiv && container.innerHTML.includes('Loading advertisement')) {
                  // Show fallback content if ad didn't load
                  container.innerHTML = `
                    <div class="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                      <div class="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg mb-2 flex items-center justify-center">
                        <span class="text-white font-bold text-xl">AD</span>
                      </div>
                      <div class="text-gray-300 text-sm font-medium">Advertisement Space</div>
                      <div class="text-gray-500 text-xs mt-1">Content will appear here</div>
                    </div>
                  `;
                }
              });
            }
          }, 3000);
        };
        
        script.onerror = (error) => {
          console.error('Native ad script failed to load:', error);
          // Show fallback content immediately if script fails
          if (containerRef.current) {
            const containers = containerRef.current.querySelectorAll('.native-ad-item');
            containers.forEach(container => {
              container.innerHTML = `
                <div class="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                  <div class="w-16 h-16 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg mb-2 flex items-center justify-center">
                    <span class="text-white font-bold text-xl">AD</span>
                  </div>
                  <div class="text-gray-400 text-sm font-medium">Advertisement</div>
                  <div class="text-gray-500 text-xs mt-1">Unable to load</div>
                </div>
              `;
            });
          }
        };
        
        // Append script to head
        document.head.appendChild(script);
      }, 100);
    }
  }, [adCount]);

  // Determine grid layout based on adCount
  const getGridLayout = () => {
    if (adCount === 1) return 'flex justify-center';
    if (adCount === 2) return 'grid grid-cols-2 gap-4';
    return 'grid grid-cols-3 gap-4';
  };

  return (
    <div className={`native-banner-container ${className}`}>
      <div 
        ref={containerRef} 
        className={`${getGridLayout()} w-full`}
      />
      <p className="text-xs text-gray-500 text-center mt-3 opacity-75">Advertisement</p>
    </div>
  );
};

export default NativeBanner;
