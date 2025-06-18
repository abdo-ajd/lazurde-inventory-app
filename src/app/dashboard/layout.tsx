// src/app/dashboard/layout.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeProvider as NextThemesProvider } from "next-themes";


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isLoading && !currentUser) {
      router.replace('/login');
    }
  }, [currentUser, isLoading, router]);

  if (isLoading || !currentUser || !mounted) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-40 w-full border-b bg-background">
          <div className="container flex h-14 items-center justify-between px-4 md:px-6">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </header>
        <div className="container flex-1 px-4 md:px-6 py-6 md:py-8">
          {/* Removed sidebar skeleton part */}
          <main className="flex w-full flex-col overflow-hidden">
            <Skeleton className="h-96 w-full" />
          </main>
        </div>
      </div>
    );
  }
  
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <div className="container flex-1 px-4 md:px-6 pt-6 pb-8 md:py-8">
          {/* Removed aside/sidebar structure */}
          <main className="flex w-full flex-col overflow-hidden">
            {children}
          </main>
        </div>
      </div>
    </NextThemesProvider>
  );
}
