
import { useEffect, useRef } from 'react';

interface AdsterraBannerProps {
  className?: string;
}

const AdsterraBanner = ({ className = "" }: AdsterraBannerProps) => {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    // Only load the script once per component instance
    if (scriptLoadedRef.current) return;
    
    // Set the atOptions globally
    (window as any).atOptions = {
      'key': '7b79a2783b27a651e01416f91705d630',
      'format': 'iframe',
      'height': 50,
      'width': 320,
      'params': {}
    };

    // Create and load the Adsterra script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = '//www.highperformanceformat.com/7b79a2783b27a651e01416f91705d630/invoke.js';
    script.async = true;
    
    // Add the script to the ad container instead of document head
    if (adContainerRef.current) {
      adContainerRef.current.appendChild(script);
      scriptLoadedRef.current = true;
    }

    // Cleanup function
    return () => {
      if (adContainerRef.current && adContainerRef.current.contains(script)) {
        adContainerRef.current.removeChild(script);
      }
      scriptLoadedRef.current = false;
    };
  }, []);

  return (
    <div className={`w-full h-16 bg-gray-800/50 border border-purple-500/20 rounded-lg flex items-center justify-center ${className}`}>
      <div 
        ref={adContainerRef}
        id="adsterra-banner" 
        className="text-center min-h-[50px] flex items-center justify-center"
      >
        <span className="text-gray-400 text-xs">Advertisement Loading...</span>
      </div>
    </div>
  );
};

export default AdsterraBanner;
