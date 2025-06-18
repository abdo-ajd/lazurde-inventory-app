// src/app/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (currentUser) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [currentUser, isLoading, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <div className="space-y-4 w-full max-w-md text-center">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-8 w-3/4 mx-auto" />
        <Skeleton className="h-40 w-full" />
        <p className="text-muted-foreground font-body">جاري التحميل...</p>
      </div>
    </div>
  );
}
