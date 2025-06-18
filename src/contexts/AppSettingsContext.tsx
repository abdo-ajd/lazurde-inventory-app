// src/contexts/AppSettingsContext.tsx
"use client";

import type { AppSettings } from '@/lib/types';
import { createContext, useContext, ReactNode, useEffect } from 'react';
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

  const applyTheme = (colors: AppSettings['themeColors']) => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      // These set the HSL values that the light theme's --primary, --background, --accent derive from.
      // The .dark block in globals.css will directly set --primary, --background, --accent for dark mode.
      root.style.setProperty('--theme-primary-hsl', colors.primary);
      root.style.setProperty('--theme-background-hsl', colors.background);
      root.style.setProperty('--theme-accent-hsl', colors.accent);
    }
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => {
      const updatedSettings = { ...prev, ...newSettings };
      if (newSettings.themeColors) {
        updatedSettings.themeColors = { ...prev.themeColors, ...newSettings.themeColors };
      }
      applyTheme(updatedSettings.themeColors);
      return updatedSettings;
    });
    toast({ title: "تم حفظ الإعدادات بنجاح" });
  };
  
  const resetToDefaults = () => {
    setSettings(DEFAULT_APP_SETTINGS);
    applyTheme(DEFAULT_APP_SETTINGS.themeColors);
    toast({ title: "تم استعادة الإعدادات الافتراضية" });
  };


  useEffect(() => {
    // Apply theme on initial load and when settings change
    if(settings?.themeColors) {
        applyTheme(settings.themeColors);
    } else {
        // This ensures default theme is applied if settings are somehow null/undefined initially
        applyTheme(DEFAULT_APP_SETTINGS.themeColors);
    }
  }, [settings]);

  return (
    <AppSettingsContext.Provider value={{ settings: settings || DEFAULT_APP_SETTINGS, updateSettings, resetToDefaults, applyTheme }}>
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
