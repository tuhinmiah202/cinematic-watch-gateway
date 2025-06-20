
import { useEffect, useRef } from 'react';

interface NativeBannerProps {
  className?: string;
}

const NativeBanner = ({ className = '' }: NativeBannerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      // Create unique container ID for each instance
      const uniqueId = `container-a72b44e62300d07717fb5618ec6b0836-${Date.now()}-${Math.random()}`;
      containerRef.current.id = uniqueId;
      
      console.log('Native ad container created with ID:', uniqueId);
      
      // Add the container div that the ad script expects
      const adContainer = document.createElement('div');
      adContainer.id = 'container-a72b44e62300d07717fb5618ec6b0836';
      containerRef.current.appendChild(adContainer);
      
      // Load the ad script
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
      
      // Append script to the document head instead of container
      document.head.appendChild(script);
      
      // Cleanup function
      return () => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };
    }
  }, []);

  return (
    <div className={`native-banner-container ${className}`}>
      <div ref={containerRef} className="w-full flex justify-center min-h-[100px]"></div>
      <p className="text-xs text-gray-500 text-center mt-2">Advertisement</p>
    </div>
  );
};

export default NativeBanner;
