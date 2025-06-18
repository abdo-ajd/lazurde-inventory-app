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

  const applyTheme = (colors: AppSettings['themeColors']) => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.style.setProperty('--primary', colors.primary);
      root.style.setProperty('--background', colors.background);
      root.style.setProperty('--accent', colors.accent);

      // Potentially update related theme variables in globals.css if they are derived.
      // For simplicity, this example directly sets the main HSL values.
      // For a more robust solution, you might need to update a larger set of CSS variables
      // or recompile/re-evaluate CSS if using a preprocessor that can handle dynamic HSL.
    }
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
