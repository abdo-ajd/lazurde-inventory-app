// src/app/dashboard/users/[id]/edit/page.tsx
"use client";

import { useState, useEffect } from 'react';
import UserForm, { type EditUserFormValues } from '@/components/users/UserForm';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import type { User } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DEFAULT_ADMIN_USER } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';

export default function EditUserPage() {
  const { getUserById, updateUser, hasRole, currentUser } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingUser, setIsFetchingUser] = useState(true);

  const userId = typeof params.id === 'string' ? params.id : '';

  useEffect(() => {
    // Security check: Prevent other admins from editing the default admin
    if (currentUser && userId === DEFAULT_ADMIN_USER.id && currentUser.id !== DEFAULT_ADMIN_USER.id) {
      toast({
        variant: "destructive",
        title: "غير مصرح به",
        description: "ليس لديك الصلاحية لتعديل بيانات هذا المستخدم.",
      });
      router.replace('/dashboard/users');
    }
  }, [userId, currentUser, router, toast]);

  useEffect(() => {
    if (userId) {
      const fetchedUser = getUserById(userId);
      setUser(fetchedUser);
    }
    setIsFetchingUser(false);
  }, [userId, getUserById]);

  // Secondary check while data is loading
  if (userId === DEFAULT_ADMIN_USER.id && currentUser && currentUser.id !== DEFAULT_ADMIN_USER.id) {
      return <p className="p-4">إعادة توجيه...</p>;
  }

  if (!hasRole(['admin'])) {
    // router.replace('/dashboard');
    // return <p>ليس لديك صلاحية الوصول.</p>;
  }

  const handleSubmit = async (data: EditUserFormValues) => {
    if (!user) return;
    setIsLoading(true);
    const success = await updateUser(user.id, data);
    setIsLoading(false);
    if (success) {
      router.push('/dashboard/users');
    }
  };

  if (isFetchingUser) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-8 w-1/3" />
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6 text-center py-10">
        <h1 className="text-3xl font-bold">المستخدم غير موجود</h1>
        <p className="text-muted-foreground">لم نتمكن من العثور على المستخدم الذي تبحث عنه.</p>
        <Button asChild>
          <Link href="/dashboard/users">العودة إلى قائمة المستخدمين</Link>
        </Button>
      </div>
    );
  }

  const isDefaultAdmin = user.id === DEFAULT_ADMIN_USER.id && user.username === DEFAULT_ADMIN_USER.username;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">تعديل المستخدم: {user.username}</h1>
          <p className="text-muted-foreground font-body">
            قم بتحديث بيانات المستخدم وصلاحياته.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/users">
            <ArrowRight className="ml-2 h-4 w-4" />
            العودة إلى قائمة المستخدمين
          </Link>
        </Button>
      </div>
      <UserForm 
        onSubmit={handleSubmit} 
        initialData={user} 
        isEditMode 
        isLoading={isLoading}
        isDefaultAdmin={isDefaultAdmin}
      />
    </div>
  );
}
