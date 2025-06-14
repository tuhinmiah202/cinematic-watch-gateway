
import { useEffect, useRef, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface AdsterraBannerProps {
  className?: string;
}

const AdsterraBanner = ({ className = "" }: AdsterraBannerProps) => {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showFallback, setShowFallback] = useState(false);
  const scriptLoadedRef = useRef(false);

  // Get responsive dimensions
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
    if (!adContainerRef.current || scriptLoadedRef.current) return;

    const dimensions = getAdDimensions();
    console.log('Loading Adsterra banner with dimensions:', dimensions);

    // Clear container
    adContainerRef.current.innerHTML = '';

    // Set global atOptions
    (window as any).atOptions = {
      'key': '7b79a2783b27a651e01416f91705d630',
      'format': 'iframe',
      'height': dimensions.height,
      'width': dimensions.width,
      'params': {}
    };

    // Create and load script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = '//www.highperformanceformat.com/7b79a2783b27a651e01416f91705d630/invoke.js';
    script.async = true;

    // Set loading timeout
    const loadingTimeout = setTimeout(() => {
      console.log('Ad loading timeout - showing fallback');
      setShowFallback(true);
      setIsLoading(false);
    }, 15000); // Increased to 15 seconds

    // Success handler
    const handleSuccess = () => {
      console.log('Adsterra script loaded successfully');
      clearTimeout(loadingTimeout);
      scriptLoadedRef.current = true;
      setIsLoading(false);
      
      // Additional check after script loads
      setTimeout(() => {
        if (adContainerRef.current && adContainerRef.current.children.length === 0) {
          console.log('No ad content rendered, showing fallback');
          setShowFallback(true);
        }
      }, 2000);
    };

    // Error handler
    const handleError = () => {
      console.error('Failed to load Adsterra script');
      clearTimeout(loadingTimeout);
      setShowFallback(true);
      setIsLoading(false);
    };

    script.onload = handleSuccess;
    script.onerror = handleError;

    // Append script
    adContainerRef.current.appendChild(script);
    console.log('Adsterra script appended to container');

    return () => {
      clearTimeout(loadingTimeout);
    };
  }, []);

  const dimensions = getAdDimensions();

  // Show fallback if needed
  if (showFallback) {
    return (
      <div 
        className={`w-full bg-gray-800/30 border border-purple-500/10 rounded-lg flex items-center justify-center ${className}`}
        style={{ height: `${dimensions.height}px`, maxWidth: `${dimensions.width}px`, margin: '0 auto' }}
      >
        <span className="text-gray-500 text-xs">Advertisement</span>
      </div>
    );
  }

  return (
    <div 
      className={`relative w-full bg-gray-800/50 border border-purple-500/20 rounded-lg overflow-hidden ${className}`}
      style={{ height: `${dimensions.height}px`, maxWidth: `${dimensions.width}px`, margin: '0 auto' }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
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
