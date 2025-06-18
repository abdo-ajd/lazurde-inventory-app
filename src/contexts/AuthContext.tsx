// src/contexts/AuthContext.tsx
"use client";

import type { User, UserRole } from '@/lib/types';
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { LOCALSTORAGE_KEYS, DEFAULT_ADMIN_USER } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  currentUser: User | null;
  login: (username: string, password?: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  users: User[];
  addUser: (user: Omit<User, 'id'>) => Promise<boolean>;
  updateUser: (userId: string, updates: Partial<Omit<User, 'id'>>) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
  getUserById: (userId: string) => User | undefined;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>(LOCALSTORAGE_KEYS.AUTH_USER, null);

  const initialUsersCreator = useCallback(() => {
    // This function is called by getValueFromLocalStorage if:
    // 1. SSR (window is undefined) -> we want [] for SSR.
    // 2. Client-side, and localStorage.getItem(key) is null -> we want [DEFAULT_ADMIN_USER].
    if (typeof window === 'undefined') {
      return [];
    }
    // If on client and this function is called, it means item was null.
    return [DEFAULT_ADMIN_USER];
  }, []);

  const [users, setUsers] = useLocalStorage<User[]>(
    LOCALSTORAGE_KEYS.USERS,
    initialUsersCreator
  );

  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // This effect runs on the client after useLocalStorage has initialized 'users'.
    // It ensures the default admin exists if 'users' array is empty (e.g., localStorage had "[]" or was cleared and initialUsersCreator ran on SSR then client).
    if (users.length === 0 && typeof window !== 'undefined') {
      setUsers([DEFAULT_ADMIN_USER]);
    }
    setIsLoading(false);
  }, [users, setUsers]);


  const login = async (username: string, password?: string): Promise<boolean> => {
    setIsLoading(true);
    // In a real app, password would be sent to a backend for verification.
    // Here, we check against locally stored users.
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      setCurrentUser(user);
      setIsLoading(false);
      toast({ title: "تم تسجيل الدخول بنجاح", description: `مرحباً ${user.username}!` });
      router.push('/dashboard');
      return true;
    } else {
      setCurrentUser(null);
      setIsLoading(false);
      toast({ title: "فشل تسجيل الدخول", description: "اسم المستخدم أو كلمة المرور غير صحيحة.", variant: "destructive" });
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    router.push('/login');
    toast({ title: "تم تسجيل الخروج بنجاح" });
  };

  const addUser = async (userData: Omit<User, 'id'>): Promise<boolean> => {
    if (users.find(u => u.username === userData.username)) {
      toast({ title: "خطأ", description: "اسم المستخدم موجود بالفعل.", variant: "destructive" });
      return false;
    }
    const newUser: User = { ...userData, id: `user_${Date.now()}` };
    setUsers(prevUsers => [...prevUsers, newUser]);
    toast({ title: "نجاح", description: `تم إضافة المستخدم ${newUser.username} بنجاح.` });
    return true;
  };

  const updateUser = async (userId: string, updates: Partial<Omit<User, 'id'>>): Promise<boolean> => {
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      toast({ title: "خطأ", description: "المستخدم غير موجود.", variant: "destructive" });
      return false;
    }

    // Prevent changing the role of the sole admin
    const currentAdmins = users.filter(u => u.role === 'admin');
    if (users[userIndex].role === 'admin' && currentAdmins.length === 1 && updates.role && updates.role !== 'admin') {
        toast({ title: "خطأ", description: "لا يمكن تغيير دور المدير الوحيد.", variant: "destructive" });
        return false;
    }
    
    // Prevent changing username to an existing one
    if (updates.username && users.some(u => u.username === updates.username && u.id !== userId)) {
      toast({ title: "خطأ", description: "اسم المستخدم الجديد موجود بالفعل.", variant: "destructive" });
      return false;
    }


    setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, ...updates, password: updates.password || u.password } : u));
    toast({ title: "نجاح", description: `تم تحديث بيانات المستخدم.` });
    return true;
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) {
      toast({ title: "خطأ", description: "المستخدم غير موجود.", variant: "destructive" });
      return false;
    }
    if (userToDelete.id === DEFAULT_ADMIN_USER.id) {
        toast({ title: "خطأ", description: "لا يمكن حذف المدير الافتراضي.", variant: "destructive" });
        return false;
    }
    const currentAdmins = users.filter(u => u.role === 'admin');
    if (userToDelete.role === 'admin' && currentAdmins.length === 1) {
        toast({ title: "خطأ", description: "لا يمكن حذف المدير الوحيد.", variant: "destructive" });
        return false;
    }

    setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
    toast({ title: "نجاح", description: `تم حذف المستخدم ${userToDelete.username}.` });
    return true;
  };
  
  const getUserById = (userId: string): User | undefined => {
    return users.find(u => u.id === userId);
  };

  const hasRole = (rolesToCheck: UserRole[]): boolean => {
    if (!currentUser) return false;
    return rolesToCheck.includes(currentUser.role);
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, isLoading, users, addUser, updateUser, deleteUser, getUserById, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
