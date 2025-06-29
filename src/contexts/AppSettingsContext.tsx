
// src/contexts/AppSettingsContext.tsx
"use client";

import type { AppSettings } from '@/lib/types';
import { createContext, useContext, ReactNode, useEffect, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { LOCALSTORAGE_KEYS, DEFAULT_APP_SETTINGS } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';

interface AppSettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  resetToDefaults: () => void;
  applyTheme: (colors: AppSettings['themeColors']) => void;
}

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

export const AppSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useLocalStorage<AppSettings>(LOCALSTORAGE_KEYS.APP_SETTINGS, DEFAULT_APP_SETTINGS);
  const { toast } = useToast();

  const applyTheme = useCallback((colors: AppSettings['themeColors']) => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.style.setProperty('--theme-primary-hsl', colors.primary);
      root.style.setProperty('--theme-background-hsl', colors.background);
      root.style.setProperty('--theme-accent-hsl', colors.accent);
    }
  }, []);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => {
      const updatedSettings = { ...prev, ...newSettings };
      if (newSettings.themeColors) {
        updatedSettings.themeColors = { ...prev.themeColors, ...newSettings.themeColors };
      }
      return updatedSettings;
    });
    // This toast is now shown in the form submit handler to avoid showing it on restore.
    // toast({ title: "تم حفظ الإعدادات بنجاح" });
  };
  
  const resetToDefaults = () => {
    setSettings(DEFAULT_APP_SETTINGS);
    toast({ title: "تم استعادة الإعدادات الافتراضية" });
  };


  useEffect(() => {
    const effectiveSettings = { ...DEFAULT_APP_SETTINGS, ...settings };
    applyTheme(effectiveSettings.themeColors);
    
    if (typeof document !== 'undefined') {
        document.title = effectiveSettings.storeName || 'إدارة المخزون';
    }

  }, [settings, applyTheme]);
  
  const settingsToProvide = { ...DEFAULT_APP_SETTINGS, ...settings };

  return (
    <AppSettingsContext.Provider value={{ settings: settingsToProvide, updateSettings, resetToDefaults, applyTheme }}>
      {children}
    </AppSettingsContext.Provider>
  );
};

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);
  if (context === undefined) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider');
  }
  return context;
};
