import { useState, useEffect } from 'react';
import { Card, Button } from '../../../components/ui';
import { useAuth } from '../../../hooks/useAuth';
import { loadDataset } from '../../../services/tarriDataService';
import {
  getManagerSettings,
  saveManagerSettings,
  resetManagerSettings,
} from '../../../services/settings/settingsService';
import type { ManagerSettings, TarriRecord } from '../../../types/dataset';

export function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<ManagerSettings>(getManagerSettings());
  const [records, setRecords] = useState<TarriRecord[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    loadDataset()
      .then((data) => {
        setRecords(data);
        setIsLoadingData(false);
      })
      .catch((err) => {
        console.error('Failed to load dataset in settings', err);
        setIsLoadingData(false);
      });
  }, []);

  const handleUpdate = (partial: Partial<ManagerSettings>) => {
    const updated = saveManagerSettings(partial);
    setSettings(updated);
    setSaveNotice('Settings updated successfully.');
    setTimeout(() => setSaveNotice(null), 2500);
  };

  const handleRefreshDataset = async () => {
    setIsRefreshing(true);
    setSaveNotice('Reloading dataset from source...');
    try {
      const refreshed = await loadDataset(true);
      setRecords(refreshed);
      setSettings(saveManagerSettings({ lastRefreshed: new Date().toISOString() }));
      setSaveNotice('Dataset reloaded. Warehouse and ML engines synchronized.');
      setTimeout(() => setSaveNotice(null), 3000);
    } catch (err) {
      console.error(err);
      setSaveNotice('Failed to reload dataset.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleReset = () => {
    const res = resetManagerSettings();
    setSettings(res);
    setShowResetConfirm(false);
    setSaveNotice('Preferences reset to factory defaults.');
    setTimeout(() => setSaveNotice(null), 2500);
  };

  return (
    <div className="w-full space-y-6 min-w-0">
      {/* 1. Header */}
      <div className="border-b border-neutral-100 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-neutral-800 tracking-tight">System Settings</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Application preferences, dataset maintenance, and environment configuration.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono bg-neutral-100 text-neutral-700 px-3 py-1 rounded border border-neutral-200">
            Role: {user?.role || 'Manager'}
          </span>
          <span className="text-xs font-mono bg-emerald-50 text-emerald-700 px-3 py-1 rounded border border-emerald-200">
            Status: Operational
          </span>
        </div>
      </div>

      {/* Save Toast Notification */}
      {saveNotice && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
          {saveNotice}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Profile & Application Settings */}
        <div className="lg:col-span-6 space-y-6">
          {/* User Profile Card */}
          <Card className="border border-neutral-100 bg-white space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <h3 className="text-sm font-semibold text-neutral-800">
                User Authentication Profile
              </h3>
              <span className="text-xs text-neutral-400 font-mono">
                Session Verified
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-neutral-50">
                <span className="text-neutral-500">Account Name:</span>
                <span className="font-semibold text-neutral-800 font-mono">{user?.name || 'Manager'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-neutral-50">
                <span className="text-neutral-500">Email Address:</span>
                <span className="font-semibold text-neutral-800 font-mono">{user?.email || 'manager@restaurant.com'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-neutral-50">
                <span className="text-neutral-500">Assigned Privilege:</span>
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-semibold text-[11px] border border-blue-200">
                  {user?.role || 'Manager'} (Full Access)
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-neutral-500">Portal Interface:</span>
                <span className="text-neutral-700">Executive Management Dashboard</span>
              </div>
            </div>
          </Card>

          {/* Application Display Preferences */}
          <Card className="border border-neutral-100 bg-white space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <h3 className="text-sm font-semibold text-neutral-800">
                Application Display Preferences
              </h3>
              <span className="text-xs text-neutral-400">
                Saved to Local Storage
              </span>
            </div>

            <div className="space-y-4 text-xs">
              {/* Currency Symbol */}
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Currency Symbol
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['£', '$', '€'] as const).map((curr) => (
                    <button
                      key={curr}
                      type="button"
                      onClick={() => handleUpdate({ currencySymbol: curr })}
                      className={`py-2 text-xs rounded border font-mono transition-colors ${
                        settings.currencySymbol === curr
                          ? 'border-accent bg-accent/10 font-bold text-accent'
                          : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      {curr} ({curr === '£' ? 'GBP' : curr === '$' ? 'USD' : 'EUR'})
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Format */}
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Date Representation Format
                </label>
                <select
                  value={settings.dateFormat}
                  onChange={(e) => handleUpdate({ dateFormat: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs rounded border border-neutral-200 bg-white text-neutral-800"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY (UK Standard: 31/12/2025)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO Standard: 2025-12-31)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (US Standard: 12/31/2025)</option>
                </select>
              </div>

              {/* Analytics Display Toggles */}
              <div className="space-y-2 pt-2 border-t border-neutral-100">
                <label className="flex items-center justify-between cursor-pointer p-2 rounded hover:bg-neutral-50">
                  <div>
                    <span className="font-semibold text-neutral-800 block">Show Data Quality Notices</span>
                    <span className="text-[11px] text-neutral-400">Display leakage alerts and class imbalance badges</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showQualityWarnings}
                    onChange={(e) => handleUpdate({ showQualityWarnings: e.target.checked })}
                    className="rounded border-neutral-300 text-accent focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer p-2 rounded hover:bg-neutral-50">
                  <div>
                    <span className="font-semibold text-neutral-800 block">Compact Chart Padding</span>
                    <span className="text-[11px] text-neutral-400">Reduce chart margins on smaller screen viewports</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.compactCharts}
                    onChange={(e) => handleUpdate({ compactCharts: e.target.checked })}
                    className="rounded border-neutral-300 text-accent focus:ring-0"
                  />
                </label>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Data Settings & System Audit */}
        <div className="lg:col-span-6 space-y-6">
          {/* Data Maintenance Card */}
          <Card className="border border-neutral-100 bg-white space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <h3 className="text-sm font-semibold text-neutral-800">
                Data Warehouse & Dataset State
              </h3>
              <span className="text-xs text-neutral-400 font-mono">
                Single Source of Truth
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-neutral-50">
                <span className="text-neutral-500">Active In-Memory File:</span>
                <span className="font-mono font-semibold text-neutral-800">tarri_data.csv</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-neutral-50">
                <span className="text-neutral-500">Total Valid Line Items:</span>
                <span className="font-mono font-semibold text-neutral-800">
                  {records.length.toLocaleString('en-GB')} rows
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-neutral-50">
                <span className="text-neutral-500">ETL Pipeline Status:</span>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold text-[11px] border border-emerald-200">
                  Synchronized (FACT_SALES active)
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-neutral-500">Last Warehouse Refresh:</span>
                <span className="font-mono text-neutral-600">
                  {settings.lastRefreshed ? new Date(settings.lastRefreshed).toLocaleTimeString('en-GB') : 'Session Start'}
                </span>
              </div>

              <div className="pt-2">
                <Button
                  onClick={handleRefreshDataset}
                  disabled={isRefreshing || isLoadingData}
                  className="w-full text-xs bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50 py-2"
                >
                  {isRefreshing ? 'Refreshing Dataset from Server...' : 'Trigger Dataset Reload & Cache Sync'}
                </Button>
              </div>
            </div>
          </Card>

          {/* System & Architecture Info */}
          <Card className="border border-neutral-100 bg-white space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <h3 className="text-sm font-semibold text-neutral-800">
                System & Architecture Metadata
              </h3>
              <span className="text-xs text-neutral-400 font-mono">
                v1.0 Production
              </span>
            </div>

            <div className="space-y-2 text-xs text-neutral-600">
              <div className="flex justify-between">
                <span>Application Suite:</span>
                <span className="font-semibold text-neutral-800">Restaurant MS (DWM Mini Project)</span>
              </div>
              <div className="flex justify-between">
                <span>Client Architecture:</span>
                <span className="font-mono text-neutral-800">Vite 8 + React 19 + TypeScript</span>
              </div>
              <div className="flex justify-between">
                <span>Active Analytics Modules:</span>
                <span className="font-mono text-neutral-800">Overview, Sales, Customers, Products</span>
              </div>
              <div className="flex justify-between">
                <span>Active Data Mining Modules:</span>
                <span className="font-mono text-neutral-800">Regression, Classification, Clustering</span>
              </div>
              <div className="flex justify-between">
                <span>Active Warehouse Modules:</span>
                <span className="font-mono text-neutral-800">Datasets, ETL Pipeline, OLAP Explorer</span>
              </div>
            </div>
          </Card>

          {/* Reset Preferences Card */}
          <Card className="border border-neutral-100 bg-neutral-50/60 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-semibold text-neutral-800">
                  Reset Application Preferences
                </h4>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Resets UI format preferences without affecting dataset or model files.
                </p>
              </div>

              {!showResetConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="text-xs px-3 py-1.5 rounded border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 self-start sm:self-auto"
                >
                  Reset Settings
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-xs px-3 py-1.5 rounded bg-rose-600 text-white font-medium hover:bg-rose-700"
                  >
                    Confirm Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className="text-xs px-3 py-1.5 rounded border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
