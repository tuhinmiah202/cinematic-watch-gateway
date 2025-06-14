
import { useEffect, useRef, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface AdsterraBannerProps {
  className?: string;
}

const AdsterraBanner = ({ className = "" }: AdsterraBannerProps) => {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const observerRef = useRef<IntersectionObserver>();
  
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);

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
    // Set up intersection observer for lazy loading
    if (!observerRef.current && adContainerRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !isInView) {
              setIsInView(true);
            }
          });
        },
        { threshold: 0.1 }
      );
      
      observerRef.current.observe(adContainerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [isInView]);

  useEffect(() => {
    // Only load ad when in view and not already loaded
    if (!isInView || scriptLoadedRef.current || hasError) return;

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
          setIsLoading(false);
          scriptLoadedRef.current = true;
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
        };

        // Handle error
        script.onerror = () => {
          setHasError(true);
          setIsLoading(false);
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
        };
        
        // Add script to container
        if (adContainerRef.current) {
          adContainerRef.current.appendChild(script);
        }

        // Set timeout to stop loading after 5 seconds
        timeoutRef.current = setTimeout(() => {
          if (isLoading) {
            setHasError(true);
            setIsLoading(false);
          }
        }, 5000);

      } catch (error) {
        console.error('Error loading ad:', error);
        setHasError(true);
        setIsLoading(false);
      }
    };

    loadAd();

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (adContainerRef.current) {
        const scripts = adContainerRef.current.querySelectorAll('script');
        scripts.forEach(script => {
          if (script.parentNode) {
            script.parentNode.removeChild(script);
          }
        });
      }
      scriptLoadedRef.current = false;
    };
  }, [isInView, hasError, isLoading]);

  // Handle responsive resize
  useEffect(() => {
    const handleResize = () => {
      if (scriptLoadedRef.current && !isLoading && !hasError) {
        // Reload ad with new dimensions on significant resize
        const currentDimensions = getAdDimensions();
        const existingOptions = (window as any).atOptions;
        
        if (existingOptions && 
            (Math.abs(existingOptions.width - currentDimensions.width) > 50 ||
             Math.abs(existingOptions.height - currentDimensions.height) > 20)) {
          // Trigger reload for better responsive behavior
          setIsLoading(true);
          scriptLoadedRef.current = false;
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
