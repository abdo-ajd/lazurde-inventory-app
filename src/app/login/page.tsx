// src/app/login/page.tsx
"use client"; // This page needs client-side interaction for the form

import LoginForm from '@/components/auth/LoginForm';
import { useAuth } from '@/contexts/AuthContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Image from 'next/image';

export default function LoginPage() {
  const { currentUser, isLoading } = useAuth();
  const { settings } = useAppSettings();
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
            src="https://images.unsplash.com/photo-1483985988355-763728e1935b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxGYXNoaW9uJTIwfGVufDB8fHx8MTc1MDMyMjI4NHww&ixlib=rb-4.1.0&q=80&w=1080" 
            alt="شعار المتجر" 
            width={120} 
            height={120} 
            className="mx-auto mb-4 rounded-full object-cover"
            data-ai-hint="fashion shopping" 
          />
          <h1 className="text-3xl font-bold text-primary font-headline">تسجيل الدخول</h1>
          <p className="mt-2 text-muted-foreground font-body">مرحباً بك في {settings.storeName}</p>
        </div>
        <LoginForm />
      </div>
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>&copy; 2025 Abdulrahman. جميع الحقوق محفوظة.</p>
      </footer>
    </div>
  );
}
