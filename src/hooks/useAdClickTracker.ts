import { useState, useEffect } from 'react';
import { adSettingsService } from '@/services/adSettingsService';

const AD_URL = 'https://www.revenuecpmgate.com/jv9gi4g38?key=3033a8c9472ea7342ecdcbf17d0b52f2';
const RESET_TIMEOUT = 60000; // 1 minute in milliseconds

export const useAdClickTracker = (contentId: string) => {
  const [clickCount, setClickCount] = useState(0);
  const [adsEnabled, setAdsEnabled] = useState(adSettingsService.areAdsEnabled());

  useEffect(() => {
    const handleAdSettingsChange = (e: CustomEvent) => {
      setAdsEnabled(e.detail.adsEnabled);
    };

    window.addEventListener('adSettingsChanged', handleAdSettingsChange as EventListener);
    return () => {
      window.removeEventListener('adSettingsChanged', handleAdSettingsChange as EventListener);
    };
  }, []);

  useEffect(() => {
    const storageKey = `ad_clicks_${contentId}`;
    const timestampKey = `ad_clicks_timestamp_${contentId}`;
    const stored = localStorage.getItem(storageKey);
    const timestamp = localStorage.getItem(timestampKey);
    
    const now = Date.now();
    const lastClickTime = timestamp ? parseInt(timestamp, 10) : 0;
    
    // Reset if more than 1 minute has passed
    if (now - lastClickTime > RESET_TIMEOUT) {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(timestampKey);
      setClickCount(0);
    } else {
      setClickCount(stored ? parseInt(stored, 10) : 0);
    }
  }, [contentId]);

  const handleClickWithAd = (callback: () => void) => {
    // If ads are disabled, execute callback directly
    if (!adsEnabled) {
      callback();
      return;
    }

    const storageKey = `ad_clicks_${contentId}`;
    const timestampKey = `ad_clicks_timestamp_${contentId}`;
    const newCount = clickCount + 1;
    
    localStorage.setItem(storageKey, newCount.toString());
    localStorage.setItem(timestampKey, Date.now().toString());
    setClickCount(newCount);

    if (newCount <= 2) {
      // Show ad on 1st and 2nd click, don't execute callback
      window.open(AD_URL, '_blank');
    } else {
      // Execute callback on 3rd+ click
      callback();
    }
  };

  return { handleClickWithAd, clickCount, adsEnabled };
};
