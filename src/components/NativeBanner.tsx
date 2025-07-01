
import { useEffect, useRef } from 'react';

interface NativeBannerProps {
  className?: string;
}

const NativeBanner = ({ className = '' }: NativeBannerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    console.log('Loading native banner ad');
    
    // Clear any existing content
    containerRef.current.innerHTML = '';
    
    // Create the ad container
    const adContainer = document.createElement('div');
    adContainer.id = 'container-a72b44e62300d07717fb5618ec6b0836';
    containerRef.current.appendChild(adContainer);
    
    // Create and append the script
    const script = document.createElement('script');
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    script.src = '//pl26926162.profitableratecpm.com/a72b44e62300d07717fb5618ec6b0836/invoke.js';
    
    script.onload = () => {
      console.log('Native banner script loaded successfully');
    };
    
    script.onerror = () => {
      console.error('Failed to load native banner script');
    };
    
    document.head.appendChild(script);
    
    return () => {
      // Cleanup: remove script when component unmounts
      const existingScript = document.querySelector('script[src="//pl26926162.profitableratecpm.com/a72b44e62300d07717fb5618ec6b0836/invoke.js"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  return (
    <div className={`native-banner w-full ${className}`}>
      <div ref={containerRef} className="w-full min-h-[100px]" />
      <div className="text-center mt-2">
        <span className="text-xs text-gray-500 opacity-70">Advertisement</span>
      </div>
    </div>
  );
};

export default NativeBanner;
