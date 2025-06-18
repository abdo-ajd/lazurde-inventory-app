// src/app/dashboard/layout.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import SidebarNav from '@/components/layout/SidebarNav';
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
        <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10 px-0 md:px-4 py-6 md:py-8">
          <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block overflow-y-auto border-r py-6 pr-6 lg:py-8">
             <div className="space-y-4">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
             </div>
          </aside>
          <main className="flex w-full flex-col overflow-hidden px-4 md:px-0">
            <Skeleton className="h-96 w-full" />
          </main>
        </div>
      </div>
    );
  }
  
  // Use NextThemesProvider here if it's not in the root layout or if you want a specific theme context for dashboard
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10 px-0 md:px-4 pt-6 pb-8 md:py-8">
          <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block overflow-y-auto border-r py-6 pr-6 lg:py-8 print:hidden">
            <SidebarNav />
          </aside>
          <main className="flex w-full flex-col overflow-hidden px-4 md:px-0">
            {children}
          </main>
        </div>
      </div>
    </NextThemesProvider>
  );
}
