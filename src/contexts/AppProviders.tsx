// src/contexts/AppProviders.tsx
"use client";

import { ReactNode } from 'react';
import { AuthProvider } from './AuthContext';
import { AppSettingsProvider } from './AppSettingsContext';
import { ProductProvider } from './ProductContext';
import { SalesProvider } from './SalesContext';
import { Toaster } from '@/components/ui/toaster';

export const AppProviders = ({ children }: { children: ReactNode }) => {
  return (
    <AuthProvider>
      <AppSettingsProvider>
        <ProductProvider>
          <SalesProvider>
            {children}
            <Toaster />
          </SalesProvider>
        </ProductProvider>
      </AppSettingsProvider>
    </AuthProvider>
  );
};
