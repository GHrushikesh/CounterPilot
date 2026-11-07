import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/api';
import type { StoreSetting } from '../types';

interface StoreContextType {
  settings: StoreSetting;
  shopName: string;
  updateShopSettings: (payload: Partial<StoreSetting>) => Promise<StoreSetting>;
  loading: boolean;
}

const DEFAULT_SETTINGS: StoreSetting = {
  shop_name: localStorage.getItem('cp_shop_name') || 'CounterPilot Store',
  tagline: 'Provisions & Retail Store',
  address: 'Main Market Road',
  phone: '',
  gstin: 'Unregistered Retailer',
  currency: 'INR',
  currency_symbol: '₹',
};

const StoreContext = createContext<StoreContextType>({
  settings: DEFAULT_SETTINGS,
  shopName: DEFAULT_SETTINGS.shop_name,
  updateShopSettings: async () => DEFAULT_SETTINGS,
  loading: false,
});

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<StoreSetting>(() => {
    const cached = localStorage.getItem('cp_store_settings');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // fallback
      }
    }
    return DEFAULT_SETTINGS;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchSettings = async () => {
      try {
        const remote = await apiService.getStoreSettings();
        if (mounted && remote) {
          setSettings(remote);
          localStorage.setItem('cp_shop_name', remote.shop_name);
          localStorage.setItem('cp_store_settings', JSON.stringify(remote));
        }
      } catch (err) {
        // Graceful fallback to cached state if backend is booting
        console.warn('Could not fetch remote store settings, using cached values:', err);
      }
    };

    fetchSettings();
    return () => {
      mounted = false;
    };
  }, []);

  const updateShopSettings = async (payload: Partial<StoreSetting>): Promise<StoreSetting> => {
    setLoading(true);
    try {
      const updated = await apiService.updateStoreSettings(payload);
      setSettings(updated);
      localStorage.setItem('cp_shop_name', updated.shop_name);
      localStorage.setItem('cp_store_settings', JSON.stringify(updated));
      return updated;
    } finally {
      setLoading(false);
    }
  };

  return (
    <StoreContext.Provider
      value={{
        settings,
        shopName: settings.shop_name,
        updateShopSettings,
        loading,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => useContext(StoreContext);

