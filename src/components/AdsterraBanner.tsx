
import { useEffect } from 'react';

interface AdsterraBannerProps {
  className?: string;
}

const AdsterraBanner = ({ className = "" }: AdsterraBannerProps) => {
  useEffect(() => {
    // Create the script element for Adsterra
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = '//www.highperformanceformat.com/7b79a2783b27a651e01416f91705d630/invoke.js';
    script.async = true;

    // Add the script to document head
    document.head.appendChild(script);

    // Set the atOptions globally
    (window as any).atOptions = {
      'key': '7b79a2783b27a651e01416f91705d630',
      'format': 'iframe',
      'height': 50,
      'width': 320,
      'params': {}
    };

    // Cleanup function
    return () => {
      // Remove the script when component unmounts
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  return (
    <div className={`w-full h-16 bg-gray-800/50 border border-purple-500/20 rounded-lg flex items-center justify-center ${className}`}>
      <div id="adsterra-banner" className="text-center">
        {/* The ad will be loaded here by the script */}
      </div>
    </div>
  );
};

export default AdsterraBanner;
