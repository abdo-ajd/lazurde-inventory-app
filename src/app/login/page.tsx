// src/app/login/page.tsx
"use client"; // This page needs client-side interaction for the form

import LoginForm from '@/components/auth/LoginForm';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Image from 'next/image';

export default function LoginPage() {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && currentUser) {
      router.replace('/dashboard');
    }
  }, [currentUser, isLoading, router]);

  if (isLoading || (!isLoading && currentUser)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-foreground">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background to-primary/10 p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-xl shadow-2xl">
        <div className="text-center">
          <Image 
            src="https://placehold.co/100x100.png" 
            alt="شعار المتجر" 
            width={100} 
            height={100} 
            className="mx-auto mb-4 rounded-full"
            data-ai-hint="woman building" 
          />
          <h1 className="text-3xl font-bold text-primary font-headline">تسجيل الدخول</h1>
          <p className="mt-2 text-muted-foreground font-body">مرحباً بك في لازوردي للمخزون</p>
        </div>
        <LoginForm />
      </div>
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} لازوردي. جميع الحقوق محفوظة.</p>
      </footer>
    </div>
  );
}
