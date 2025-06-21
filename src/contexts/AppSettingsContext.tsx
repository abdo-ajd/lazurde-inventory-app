
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
      // These set the HSL values that the light theme's --primary, --background, --accent derive from.
      // The .dark block in globals.css will directly set --primary, --background, --accent for dark mode.
      root.style.setProperty('--theme-primary-hsl', colors.primary);
      root.style.setProperty('--theme-background-hsl', colors.background);
      root.style.setProperty('--theme-accent-hsl', colors.accent);
    }
  }, []);
  
  const applyAppIcon = useCallback((iconDataUri: string | undefined) => {
    if (typeof document !== 'undefined') {
        const favicon = document.getElementById('favicon') as HTMLLinkElement | null;
        const appleIcon = document.getElementById('apple-touch-icon') as HTMLLinkElement | null;
        
        const defaultFavicon = '/favicon.ico';
        const defaultAppleIcon = '/icons/icon-192x192.png';

        if (iconDataUri) {
            if (favicon) favicon.href = iconDataUri;
            if (appleIcon) appleIcon.href = iconDataUri;
        } else {
            if (favicon) favicon.href = defaultFavicon;
            if (appleIcon) appleIcon.href = defaultAppleIcon;
        }
    }
  }, []);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => {
      const updatedSettings = { ...prev, ...newSettings };
      if (newSettings.themeColors) {
        updatedSettings.themeColors = { ...prev.themeColors, ...newSettings.themeColors };
      }
      
      // No need to call applyTheme and applyAppIcon here, useEffect will handle it
      
      return updatedSettings;
    });
    toast({ title: "تم حفظ الإعدادات بنجاح" });
  };
  
  const resetToDefaults = () => {
    setSettings(DEFAULT_APP_SETTINGS);
    // No need to call applyTheme/applyAppIcon here, useEffect will handle it
    toast({ title: "تم استعادة الإعدادات الافتراضية" });
  };


  useEffect(() => {
    // Apply theme and icon on initial load and when settings change
    if(settings) {
        if (settings.themeColors) {
            applyTheme(settings.themeColors);
        }
        applyAppIcon(settings.appIcon);
    } else {
        // This ensures default theme is applied if settings are somehow null/undefined initially
        applyTheme(DEFAULT_APP_SETTINGS.themeColors);
        applyAppIcon(DEFAULT_APP_SETTINGS.appIcon);
    }
  }, [settings, applyTheme, applyAppIcon]);

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

    