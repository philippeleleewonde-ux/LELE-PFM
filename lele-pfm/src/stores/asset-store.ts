import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AssetClass } from '@/constants/patrimoine-buckets';

export interface AssetEntry {
  id: string;
  assetClass: AssetClass;
  subcategory: string | null;
  label: string;
  currentValue: number; // in user currency (not cents)
  annualYieldPercent: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

interface AssetState {
  assets: AssetEntry[];

  addAsset: (entry: Omit<AssetEntry, 'id' | 'created_at' | 'updated_at'>) => void;
  updateAsset: (id: string, updates: Partial<Omit<AssetEntry, 'id' | 'created_at'>>) => void;
  deleteAsset: (id: string) => void;
  clearAssets: () => void;
  getAssetsByClass: (assetClass: AssetClass) => AssetEntry[];
  getTotalValue: () => number;
  getEstimatedMonthlyPassiveIncome: () => number;
}

export const useAssetStore = create<AssetState>()(
  persist(
    (set, get) => ({
      assets: [],

      addAsset: (entry) => {
        const now = new Date().toISOString();
        const newAsset: AssetEntry = {
          ...entry,
          id: `asset-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          created_at: now,
          updated_at: now,
        };
        set((state) => ({ assets: [...state.assets, newAsset] }));
      },

      updateAsset: (id, updates) => {
        set((state) => ({
          assets: state.assets.map((a) =>
            a.id === id
              ? { ...a, ...updates, updated_at: new Date().toISOString() }
              : a
          ),
        }));
      },

      deleteAsset: (id) => {
        set((state) => ({ assets: state.assets.filter((a) => a.id !== id) }));
      },

      clearAssets: () => {
        set({ assets: [] });
      },

      getAssetsByClass: (assetClass) => {
        return get().assets.filter((a) => a.assetClass === assetClass);
      },

      getTotalValue: () => {
        return get().assets.reduce((sum, a) => sum + a.currentValue, 0);
      },

      getEstimatedMonthlyPassiveIncome: () => {
        return get().assets.reduce(
          (sum, a) => sum + (a.currentValue * a.annualYieldPercent) / 100 / 12,
          0
        );
      },
    }),
    {
      name: 'lele-pfm-assets',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ assets: state.assets }),
      migrate: (persisted: any, version: number) => {
        if (version < 2) {
          const state = persisted as { assets: any[] };
          state.assets = (state.assets || []).map((a: any) => ({
            ...a,
            subcategory: a.subcategory ?? null,
          }));
        }
        return persisted;
      },
    }
  )
);
