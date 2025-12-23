import { useState, useEffect } from 'react';
import { adSettingsService } from '@/services/adSettingsService';

const AD_URL = 'https://www.revenuecpmgate.com/jv9gi4g38?key=3033a8c9472ea7342ecdcbf17d0b52f2';
const RESET_TIMEOUT = 60000; // 1 minute in milliseconds

export const useAdClickTrackerSingle = (contentId: string) => {
  const [hasClicked, setHasClicked] = useState(false);
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
    const storageKey = `ad_clicks_single_${contentId}`;
    const timestampKey = `ad_clicks_single_timestamp_${contentId}`;
    const stored = localStorage.getItem(storageKey);
    const timestamp = localStorage.getItem(timestampKey);
    
    const now = Date.now();
    const lastClickTime = timestamp ? parseInt(timestamp, 10) : 0;
    
    // Reset if more than 1 minute has passed
    if (now - lastClickTime > RESET_TIMEOUT) {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(timestampKey);
      setHasClicked(false);
    } else {
      setHasClicked(stored === 'true');
    }
  }, [contentId]);

  const handleClickWithAd = (callback: () => void) => {
    // If ads are disabled, execute callback directly without showing ad
    if (!adsEnabled) {
      callback();
      return;
    }

    const storageKey = `ad_clicks_single_${contentId}`;
    const timestampKey = `ad_clicks_single_timestamp_${contentId}`;
    
    localStorage.setItem(storageKey, 'true');
    localStorage.setItem(timestampKey, Date.now().toString());
    setHasClicked(true);

    // Open ad and execute callback
    window.open(AD_URL, '_blank');
    callback();
  };

  return { handleClickWithAd, hasClicked, adsEnabled };
};
