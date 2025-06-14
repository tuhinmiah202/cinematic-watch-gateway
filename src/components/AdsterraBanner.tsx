
import { useEffect, useRef, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface AdsterraBannerProps {
  className?: string;
}

const AdsterraBanner = ({ className = "" }: AdsterraBannerProps) => {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Responsive dimensions based on screen size
  const getAdDimensions = () => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width < 480) {
        return { width: 320, height: 50 };
      } else if (width < 768) {
        return { width: 468, height: 60 };
      }
      return { width: 728, height: 90 };
    }
    return { width: 320, height: 50 };
  };

  useEffect(() => {
    const loadAd = () => {
      if (!adContainerRef.current) return;

      const dimensions = getAdDimensions();
      
      // Clear any existing content
      adContainerRef.current.innerHTML = '';
      
      // Set up the atOptions for Adsterra
      (window as any).atOptions = {
        'key': '7b79a2783b27a651e01416f91705d630',
        'format': 'iframe',
        'height': dimensions.height,
        'width': dimensions.width,
        'params': {}
      };

      // Create the script element
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = '//www.highperformanceformat.com/7b79a2783b27a651e01416f91705d630/invoke.js';
      script.async = true;
      
      // Set up timeout to handle slow/failed loads
      const timeout = setTimeout(() => {
        console.log('Ad loading timeout - showing fallback');
        setHasError(true);
        setIsLoading(false);
      }, 10000); // 10 second timeout

      script.onload = () => {
        console.log('Adsterra script loaded successfully');
        clearTimeout(timeout);
        setIsLoading(false);
      };

      script.onerror = () => {
        console.error('Failed to load Adsterra script');
        clearTimeout(timeout);
        setHasError(true);
        setIsLoading(false);
      };

      // Append to container
      adContainerRef.current.appendChild(script);
      console.log('Adsterra script added to DOM');
    };

    // Load the ad after a small delay to ensure DOM is ready
    const timer = setTimeout(loadAd, 500);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const dimensions = getAdDimensions();

  if (hasError) {
    return (
      <div 
        className={`w-full bg-gray-800/30 border border-purple-500/10 rounded-lg flex items-center justify-center ${className}`}
        style={{ height: `${dimensions.height}px`, maxWidth: `${dimensions.width}px`, margin: '0 auto' }}
      >
        <span className="text-gray-500 text-xs">Ad space</span>
      </div>
    );
  }

  return (
    <div 
      className={`w-full bg-gray-800/50 border border-purple-500/20 rounded-lg overflow-hidden ${className}`}
      style={{ height: `${dimensions.height}px`, maxWidth: `${dimensions.width}px`, margin: '0 auto' }}
    >
      {isLoading && (
        <div className="w-full h-full flex items-center justify-center absolute">
          <Skeleton className="w-full h-full bg-gray-700/50" />
        </div>
      )}
      <div 
        ref={adContainerRef}
        className="w-full h-full"
        style={{ minHeight: `${dimensions.height}px` }}
      />
    </div>
  );
};

export default AdsterraBanner;
