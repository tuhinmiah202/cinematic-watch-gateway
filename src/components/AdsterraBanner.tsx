
import { useEffect, useRef, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface AdsterraBannerProps {
  className?: string;
}

const AdsterraBanner = ({ className = "" }: AdsterraBannerProps) => {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Responsive dimensions based on screen size
  const getAdDimensions = () => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width < 480) {
        return { width: Math.min(320, width - 32), height: 50 };
      } else if (width < 768) {
        return { width: 468, height: 60 };
      }
      return { width: 728, height: 90 };
    }
    return { width: 320, height: 50 };
  };

  useEffect(() => {
    // Load ad immediately when component mounts
    if (scriptLoadedRef.current || hasError) return;

    const loadAd = () => {
      try {
        const dimensions = getAdDimensions();
        
        // Set responsive atOptions
        (window as any).atOptions = {
          'key': '7b79a2783b27a651e01416f91705d630',
          'format': 'iframe',
          'height': dimensions.height,
          'width': dimensions.width,
          'params': {}
        };

        // Create and load the Adsterra script
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = '//www.highperformanceformat.com/7b79a2783b27a651e01416f91705d630/invoke.js';
        script.async = true;
        
        // Handle successful load
        script.onload = () => {
          console.log('Ad script loaded successfully');
          setIsLoading(false);
          scriptLoadedRef.current = true;
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
        };

        // Handle error
        script.onerror = () => {
          console.error('Ad script failed to load');
          setHasError(true);
          setIsLoading(false);
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
        };
        
        // Add script to container
        if (adContainerRef.current) {
          adContainerRef.current.appendChild(script);
          console.log('Ad script added to container');
        }

        // Set timeout to stop loading after 8 seconds
        timeoutRef.current = setTimeout(() => {
          if (isLoading) {
            console.log('Ad loading timeout reached');
            setHasError(true);
            setIsLoading(false);
          }
        }, 8000);

      } catch (error) {
        console.error('Error loading ad:', error);
        setHasError(true);
        setIsLoading(false);
      }
    };

    // Small delay to ensure DOM is ready
    const loadTimer = setTimeout(() => {
      loadAd();
    }, 100);

    // Cleanup function
    return () => {
      clearTimeout(loadTimer);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [hasError, isLoading]);

  // Handle responsive resize
  useEffect(() => {
    const handleResize = () => {
      if (scriptLoadedRef.current && !isLoading && !hasError) {
        // Only reload if significant size change
        const currentDimensions = getAdDimensions();
        const existingOptions = (window as any).atOptions;
        
        if (existingOptions && 
            (Math.abs(existingOptions.width - currentDimensions.width) > 100)) {
          // Reset and reload for better responsive behavior
          setIsLoading(true);
          setHasError(false);
          scriptLoadedRef.current = false;
          if (adContainerRef.current) {
            adContainerRef.current.innerHTML = '';
          }
        }
      }
    };

    const debounceResize = setTimeout(() => {
      handleResize();
    }, 300);

    window.addEventListener('resize', () => {
      clearTimeout(debounceResize);
      setTimeout(handleResize, 300);
    });

    return () => {
      clearTimeout(debounceResize);
      window.removeEventListener('resize', handleResize);
    };
  }, [isLoading, hasError]);

  const dimensions = getAdDimensions();

  if (hasError) {
    return (
      <div className={`w-full bg-gray-800/30 border border-purple-500/10 rounded-lg flex items-center justify-center ${className}`}
           style={{ height: `${dimensions.height}px`, maxWidth: `${dimensions.width}px`, margin: '0 auto' }}>
        <span className="text-gray-500 text-xs">Advertisement unavailable</span>
      </div>
    );
  }

  return (
    <div className={`w-full bg-gray-800/50 border border-purple-500/20 rounded-lg flex items-center justify-center overflow-hidden ${className}`}
         style={{ height: `${dimensions.height}px`, maxWidth: `${dimensions.width}px`, margin: '0 auto' }}>
      {isLoading ? (
        <div className="w-full h-full flex items-center justify-center">
          <Skeleton className="w-full h-full bg-gray-700/50" />
        </div>
      ) : (
        <div 
          ref={adContainerRef}
          id="adsterra-banner" 
          className="w-full h-full flex items-center justify-center"
          style={{ minHeight: `${dimensions.height}px` }}
        />
      )}
    </div>
  );
};

export default AdsterraBanner;
