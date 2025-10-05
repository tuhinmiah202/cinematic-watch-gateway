import { useState, useEffect } from 'react';

const AD_URL = 'https://www.revenuecpmgate.com/jv9gi4g38?key=3033a8c9472ea7342ecdcbf17d0b52f2';

export const useAdClickTracker = (contentId: string) => {
  const [clickCount, setClickCount] = useState(0);

  useEffect(() => {
    const storageKey = `ad_clicks_${contentId}`;
    const stored = localStorage.getItem(storageKey);
    setClickCount(stored ? parseInt(stored, 10) : 0);
  }, [contentId]);

  const handleClickWithAd = (callback: () => void) => {
    const storageKey = `ad_clicks_${contentId}`;
    const newCount = clickCount + 1;
    
    localStorage.setItem(storageKey, newCount.toString());
    setClickCount(newCount);

    if (newCount <= 2) {
      // Show ad on 1st and 2nd click
      window.open(AD_URL, '_blank');
      setTimeout(() => callback(), 500);
    } else {
      // Skip ad on 3rd+ click
      callback();
    }
  };

  return { handleClickWithAd, clickCount };
};
