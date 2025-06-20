
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
      
      // Create script element to invoke the ad
      const script = document.createElement('script');
      script.innerHTML = `
        if (typeof window.adsbygoogle === 'undefined') {
          try {
            (function() {
              var d = document, s = d.createElement('script');
              s.src = '//pl26926162.profitableratecpm.com/a72b44e62300d07717fb5618ec6b0836/invoke.js';
              s.async = true;
              s.setAttribute('data-cfasync', 'false');
              d.head.appendChild(s);
            })();
          } catch(e) {
            console.log('Native ad script error:', e);
          }
        }
      `;
      
      // Append script to container
      containerRef.current.appendChild(script);
    }
  }, []);

  return (
    <div className={`native-banner-container ${className}`}>
      <div ref={containerRef} className="w-full flex justify-center"></div>
    </div>
  );
};

export default NativeBanner;
