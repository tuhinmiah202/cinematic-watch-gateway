// Ad Settings Service - Controls global ad visibility
const AD_SETTINGS_KEY = 'admin_ad_settings';

interface AdSettings {
  adsEnabled: boolean;
  updatedAt: string;
}

const getSettings = (): AdSettings => {
  const stored = localStorage.getItem(AD_SETTINGS_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  return { adsEnabled: true, updatedAt: new Date().toISOString() };
};

const setSettings = (settings: AdSettings): void => {
  localStorage.setItem(AD_SETTINGS_KEY, JSON.stringify(settings));
  // Dispatch custom event for components to react
  window.dispatchEvent(new CustomEvent('adSettingsChanged', { detail: settings }));
};

export const adSettingsService = {
  areAdsEnabled: (): boolean => {
    return getSettings().adsEnabled;
  },

  toggleAds: (enabled: boolean): void => {
    setSettings({
      adsEnabled: enabled,
      updatedAt: new Date().toISOString()
    });
  },

  getSettings,
};
