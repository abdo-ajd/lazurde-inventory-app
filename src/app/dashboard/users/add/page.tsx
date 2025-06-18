// src/app/dashboard/users/add/page.tsx
"use client";

import { useState } from 'react';
import UserForm, { type AddUserFormValues } from '@/components/users/UserForm';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AddUserPage() {
  const { addUser, hasRole } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  if (!hasRole(['admin'])) {
    // router.replace('/dashboard');
    // return <p>ليس لديك صلاحية الوصول.</p>;
  }

  const handleSubmit = async (data: AddUserFormValues) => {
    setIsLoading(true);
    // Ensure password is provided for new user
    if (!data.password) {
        // This should be caught by Zod, but as a safeguard:
        alert("كلمة المرور مطلوبة للمستخدم الجديد."); 
        setIsLoading(false);
        return;
    }
    const success = await addUser({ username: data.username, password: data.password, role: data.role });
    setIsLoading(false);
    if (success) {
      router.push('/dashboard/users');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">إضافة مستخدم جديد</h1>
          <p className="text-muted-foreground font-body">
            أدخل بيانات المستخدم الجديد وصلاحياته.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/users">
            <ArrowRight className="ml-2 h-4 w-4" />
            العودة إلى قائمة المستخدمين
          </Link>
        </Button>
      </div>
      <UserForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
}
