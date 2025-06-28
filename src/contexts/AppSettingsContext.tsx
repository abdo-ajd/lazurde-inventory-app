
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
      if (newSettings.displaySettings) {
        updatedSettings.displaySettings = { ...(prev.displaySettings || DEFAULT_APP_SETTINGS.displaySettings!), ...newSettings.displaySettings };
      }
      return updatedSettings;
    });
    toast({ title: "تم حفظ الإعدادات بنجاح" });
  };
  
  const resetToDefaults = () => {
    setSettings(DEFAULT_APP_SETTINGS);
    toast({ title: "تم استعادة الإعدادات الافتراضية" });
  };


  useEffect(() => {
    const effectiveSettings = { ...DEFAULT_APP_SETTINGS, ...settings };
    
    // Migration for users from "items per page" to "item size" setting.
    const needsMigration = settings?.displaySettings && ('imageGridItems' in settings.displaySettings);
    if (needsMigration) {
      console.log("Migrating display settings...");
      setSettings(currentSettings => {
        const { displaySettings, ...rest } = currentSettings;
        return {
          ...rest,
          displaySettings: DEFAULT_APP_SETTINGS.displaySettings,
        };
      });
    } else if (!settings?.displaySettings) {
      // For new users or corrupted settings, ensure displaySettings exists.
      setSettings(currentSettings => ({
        ...currentSettings,
        displaySettings: DEFAULT_APP_SETTINGS.displaySettings,
      }));
    }

    applyTheme(effectiveSettings.themeColors);
    
    if (typeof document !== 'undefined') {
        document.title = effectiveSettings.storeName || 'لازوردي للمخزون';
    }

  }, [settings, applyTheme, setSettings]);
  
  const settingsToProvide = { ...DEFAULT_APP_SETTINGS, ...settings, displaySettings: { ...DEFAULT_APP_SETTINGS.displaySettings!, ...settings?.displaySettings } };

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
