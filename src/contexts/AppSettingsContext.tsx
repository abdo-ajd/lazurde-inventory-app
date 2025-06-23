
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
  
  const applyAppIconAndManifest = useCallback((iconDataUri: string | undefined, storeName: string, themeColors: AppSettings['themeColors']) => {
    if (typeof document !== 'undefined') {
        const favicon = document.getElementById('favicon') as HTMLLinkElement | null;
        const appleIcon = document.getElementById('apple-touch-icon') as HTMLLinkElement | null;
        const manifestLink = document.getElementById('manifest') as HTMLLinkElement | null;
        const themeColorMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;

        const defaultFavicon = '/favicon.ico';
        const defaultAppleIcon = '/icons/icon-192x192.png';

        const customIcon512 = iconDataUri;
        const customIcon192 = iconDataUri || defaultAppleIcon;

        if (favicon) favicon.href = iconDataUri || defaultFavicon;
        if (appleIcon) appleIcon.href = customIcon192;

        const primaryThemeColor = `hsl(${themeColors.primary})`;
        if (themeColorMeta) themeColorMeta.content = primaryThemeColor;

        const manifest = {
            name: storeName,
            short_name: storeName,
            description: 'نظام إدارة مخزون للشركات الصغيرة والمتوسطة',
            start_url: '/',
            display: 'standalone',
            background_color: `hsl(${themeColors.background})`,
            theme_color: primaryThemeColor,
            icons: [
                {
                    src: customIcon192,
                    sizes: '192x192',
                    type: 'image/png',
                    purpose: 'any maskable',
                },
                {
                    src: customIcon512,
                    sizes: '512x512',
                    type: 'image/png',
                    purpose: 'any maskable',
                }
            ],
        };

        const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
        const manifestURL = URL.createObjectURL(blob);

        if (manifestLink) {
            const oldUrl = manifestLink.href;
            if (oldUrl.startsWith('blob:')) {
                URL.revokeObjectURL(oldUrl);
            }
            manifestLink.href = manifestURL;
        }
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
    toast({ title: "تم حفظ الإعدادات بنجاح" });
  };
  
  const resetToDefaults = () => {
    setSettings(DEFAULT_APP_SETTINGS);
    toast({ title: "تم استعادة الإعدادات الافتراضية" });
  };


  useEffect(() => {
    if(settings) {
        if (settings.themeColors) {
            applyTheme(settings.themeColors);
        }
        applyAppIconAndManifest(settings.appIcon, settings.storeName, settings.themeColors);
    } else {
        applyTheme(DEFAULT_APP_SETTINGS.themeColors);
        applyAppIconAndManifest(DEFAULT_APP_SETTINGS.appIcon, DEFAULT_APP_SETTINGS.storeName, DEFAULT_APP_SETTINGS.themeColors);
    }
  }, [settings, applyTheme, applyAppIconAndManifest]);

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
