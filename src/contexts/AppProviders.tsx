// src/contexts/AppProviders.tsx
"use client";

import { ReactNode } from 'react';
import { AuthProvider } from './AuthContext';
import { AppSettingsProvider } from './AppSettingsContext';
import { ProductProvider } from './ProductContext';
import { SalesProvider } from './SalesContext';

export const AppProviders = ({ children }: { children: ReactNode }) => {
  return (
    <AuthProvider>
      <AppSettingsProvider>
        <ProductProvider>
          <SalesProvider>
            {children}
          </SalesProvider>
        </ProductProvider>
      </AppSettingsProvider>
    </AuthProvider>
  );
};
