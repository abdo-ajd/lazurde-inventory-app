
import type { Metadata } from 'next';
import './globals.css';
import { AppProviders } from '@/contexts/AppProviders';

export const metadata: Metadata = {
  title: 'لازوردي للمخزون',
  description: 'نظام إدارة مخزون للشركات الصغيرة والمتوسطة',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/icon-192x192.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Source+Code+Pro:ital,wght@0,200..0,900;1,200..1,900&display=swap" rel="stylesheet" />
        
        {/* PWA Meta Tags */}
        <meta name="theme-color" content="#42A5F5" /> 
        <meta name='apple-mobile-web-app-capable' content='yes' />
        <meta name='apple-mobile-web-app-status-bar-style' content='default' />
        <meta name='apple-mobile-web-app-title' content='لازوردي Lite' />
        <meta name='format-detection' content='telephone=no' />
        <meta name='mobile-web-app-capable' content='yes' />
        {/* End PWA Meta Tags */}

      </head>
      <body className="font-body antialiased min-h-screen flex flex-col">
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
