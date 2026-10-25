import { useState } from 'react';
import {
  Save,
  CheckCircle2,
  Building,
  Coins,
  Sliders,
  Info,
  RotateCcw,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';

interface AdminSettingsData {
  restaurantName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  currency: string;
  defaultTableCapacity: number;
  taxIncluded: boolean;
}

const DEFAULT_SETTINGS: AdminSettingsData = {
  restaurantName: 'Tarri Restaurant & Dining',
  contactEmail: 'contact@tarrirestaurant.com',
  contactPhone: '+44 20 7946 0912',
  address: '142 High Street, London, UK',
  currency: 'GBP (£)',
  defaultTableCapacity: 4,
  taxIncluded: true,
};

const SETTINGS_KEY = 'rms_admin_settings';

export function ManagerSettings() {
  const [settings, setSettings] = useState<AdminSettingsData>(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem(SETTINGS_KEY);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="w-full space-y-6 pb-12 min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
        <div>
          <h1 className="text-xl font-semibold text-neutral-800 tracking-tight">System Settings</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Configure restaurant identity, currency formats, and operational system defaults.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-medium text-neutral-600 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset Defaults</span>
          </button>
          <button
            type="submit"
            form="settings-form"
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>System settings updated and saved successfully.</span>
        </div>
      )}

      <form id="settings-form" onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Restaurant Information */}
        <Card className="p-6 border border-neutral-200 bg-white shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
            <Building className="h-4 w-4 text-neutral-500" />
            <h3 className="text-sm font-bold text-neutral-900">Restaurant Information</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Restaurant Trade Name
              </label>
              <input
                type="text"
                required
                value={settings.restaurantName}
                onChange={(e) => setSettings({ ...settings, restaurantName: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-neutral-800 focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Contact Email
              </label>
              <input
                type="email"
                required
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-neutral-800 focus:outline-none focus:ring-1 focus:ring-accent font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={settings.contactPhone}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-neutral-800 focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Business Address
              </label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-neutral-800 focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>
        </Card>

        {/* Section 2: Currency & Pricing */}
        <Card className="p-6 border border-neutral-200 bg-white shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
            <Coins className="h-4 w-4 text-neutral-500" />
            <h3 className="text-sm font-bold text-neutral-900">Currency & Pricing</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Operating Currency
              </label>
              <select
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-neutral-800 focus:outline-none focus:ring-1 focus:ring-accent bg-white"
              >
                <option value="GBP (£)">GBP (£) — British Pound</option>
                <option value="USD ($)">USD ($) — US Dollar</option>
                <option value="EUR (€)">EUR (€) — Euro</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Tax Treatment
              </label>
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.taxIncluded}
                    onChange={(e) => setSettings({ ...settings, taxIncluded: e.target.checked })}
                    className="h-4 w-4 rounded border-neutral-300 text-accent accent-accent"
                  />
                  <span className="text-neutral-700 font-medium">
                    Menu prices are VAT/Tax-inclusive (Total = Subtotal)
                  </span>
                </label>
              </div>
            </div>
          </div>
        </Card>

        {/* Section 3: Operational Preferences */}
        <Card className="p-6 border border-neutral-200 bg-white shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
            <Sliders className="h-4 w-4 text-neutral-500" />
            <h3 className="text-sm font-bold text-neutral-900">Operational Preferences</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Default Seating Capacity per Table
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={settings.defaultTableCapacity}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    defaultTableCapacity: parseInt(e.target.value, 10) || 4,
                  })
                }
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-neutral-800 focus:outline-none focus:ring-1 focus:ring-accent font-mono"
              />
            </div>
          </div>
        </Card>

        {/* Section 4: System Information */}
        <Card className="p-6 border border-neutral-200 bg-white shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
            <Info className="h-4 w-4 text-neutral-500" />
            <h3 className="text-sm font-bold text-neutral-900">System Information</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-neutral-50 rounded-lg">
              <span className="text-[10px] font-semibold uppercase text-neutral-400 block mb-0.5">
                Version
              </span>
              <span className="font-mono font-bold text-neutral-800">v2.4.0-production</span>
            </div>
            <div className="p-3 bg-neutral-50 rounded-lg">
              <span className="text-[10px] font-semibold uppercase text-neutral-400 block mb-0.5">
                Build Release
              </span>
              <span className="font-mono text-neutral-800">2026.09.17</span>
            </div>
            <div className="p-3 bg-neutral-50 rounded-lg">
              <span className="text-[10px] font-semibold uppercase text-neutral-400 block mb-0.5">
                Active Roles
              </span>
              <span className="font-semibold text-neutral-800">Admin, Waiter, Cook, Customer, Manager</span>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
}
