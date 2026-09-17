import type { ManagerSettings } from '../../types/dataset';

const SETTINGS_STORAGE_KEY = 'restaurant_manager_settings_v1';

const DEFAULT_SETTINGS: ManagerSettings = {
  currencySymbol: '£',
  dateFormat: 'DD/MM/YYYY',
  numberFormat: 'standard',
  showQualityWarnings: true,
  compactCharts: false,
  defaultTimeframe: 'All Time (2023–2025)',
  lastRefreshed: new Date().toISOString(),
};

/**
 * Loads current settings from localStorage or returns defaults.
 */
export function getManagerSettings(): ManagerSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (err) {
    console.error('Failed to parse settings from storage', err);
  }
  return { ...DEFAULT_SETTINGS };
}

/**
 * Saves updated settings to localStorage.
 */
export function saveManagerSettings(settings: Partial<ManagerSettings>): ManagerSettings {
  const current = getManagerSettings();
  const updated: ManagerSettings = {
    ...current,
    ...settings,
    lastRefreshed: new Date().toISOString(),
  };
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save settings', err);
  }
  return updated;
}

/**
 * Resets preferences to factory defaults without affecting dataset or model files.
 */
export function resetManagerSettings(): ManagerSettings {
  try {
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to reset settings', err);
  }
  return { ...DEFAULT_SETTINGS };
}
