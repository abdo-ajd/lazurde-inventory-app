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
  addUser: (user: Omit<User, 'id' | 'password'> & { password: string }) => Promise<boolean>; // Removed avatarUrl from addUser
  updateUser: (userId: string, updates: Partial<Omit<User, 'id'>>) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
  getUserById: (userId: string) => User | undefined;
  hasRole: (roles: UserRole[]) => boolean;
  replaceAllUsers: (newUsers: User[]) => void; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>(LOCALSTORAGE_KEYS.AUTH_USER, null);

  const initialUsersCreator = useCallback(() => {
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
    if (users !== undefined) {
      setIsLoading(false);
    }
  }, [users]);


  const login = async (username: string, password?: string): Promise<boolean> => {
    setIsLoading(true);
    const allUsers = users || [];
    const user = allUsers.find(u => u.username === username && u.password === password);
    
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

  const addUser = async (userData: Omit<User, 'id' | 'password'> & { password: string }): Promise<boolean> => { // Removed avatarUrl
    const currentUsers = users || [];
    if (currentUsers.find(u => u.username === userData.username)) {
      toast({ title: "خطأ", description: "اسم المستخدم موجود بالفعل.", variant: "destructive" });
      return false;
    }
    const newUser: User = { 
      username: userData.username,
      password: userData.password,
      role: userData.role,
      // avatarUrl: userData.avatarUrl || '', // Removed avatarUrl
      id: `user_${Date.now()}` 
    };
    setUsers(prevUsers => [...(prevUsers || []), newUser]);
    toast({ title: "نجاح", description: `تم إضافة المستخدم ${newUser.username} بنجاح.` });
    return true;
  };

  const updateUser = async (userId: string, updates: Partial<Omit<User, 'id'>>): Promise<boolean> => {
    // Security Guard: Prevent any admin other than the default admin from modifying the default admin.
    if (userId === DEFAULT_ADMIN_USER.id && currentUser?.id !== DEFAULT_ADMIN_USER.id) {
        toast({ title: "غير مصرح به", description: "ليس لديك صلاحية لتعديل بيانات هذا المستخدم.", variant: "destructive" });
        return false;
    }
    
    const currentUsers = users || [];
    const userIndex = currentUsers.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      toast({ title: "خطأ", description: "المستخدم غير موجود.", variant: "destructive" });
      return false;
    }
    
    const userToUpdate = currentUsers[userIndex];
    if (userToUpdate.id === DEFAULT_ADMIN_USER.id && updates.role && updates.role !== 'admin') {
      toast({ title: "خطأ", description: "لا يمكن تغيير صلاحيات المدير الافتراضي.", variant: "destructive" });
      return false;
    }
    
    const actualUsers = users || []; 
    const currentAdmins = actualUsers.filter(u => u.role === 'admin');
    if (userToUpdate.role === 'admin' && currentAdmins.length === 1 && updates.role && updates.role !== 'admin') {
        toast({ title: "خطأ", description: "لا يمكن تغيير دور المدير الوحيد.", variant: "destructive" });
        return false;
    }
    
    if (updates.username && actualUsers.some(u => u.username === updates.username && u.id !== userId)) {
      toast({ title: "خطأ", description: "اسم المستخدم الجديد موجود بالفعل.", variant: "destructive" });
      return false;
    }

    // if (updates.avatarUrl === undefined) delete updates.avatarUrl; // Ensure avatarUrl is not accidentally set to undefined

    setUsers(prevUsers => (prevUsers || []).map(u => {
      if (u.id === userId) {
        const updatedUser = { ...u, ...updates };
        // Keep old password if new one is not provided or is empty
        if (!updates.password || updates.password === '') {
          updatedUser.password = u.password;
        }
        // delete updatedUser.avatarUrl; // Ensure avatarUrl isn't part of the update unless explicitly passed (which it won't be now)
        return updatedUser;
      }
      return u;
    }));
    
    toast({ title: "نجاح", description: `تم تحديث بيانات المستخدم.` });
    
    if (currentUser?.id === userId) {
       const updatedUserDetailsFromStorage = (users || []).find(u => u.id === userId);
        if(updatedUserDetailsFromStorage){
            setCurrentUser(updatedUserDetailsFromStorage);
        }
    }
    return true;
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    const currentUsers = users || [];
    const userToDelete = currentUsers.find(u => u.id === userId);
    if (!userToDelete) {
      toast({ title: "خطأ", description: "المستخدم غير موجود.", variant: "destructive" });
      return false;
    }
    if (userToDelete.id === DEFAULT_ADMIN_USER.id && userToDelete.username === DEFAULT_ADMIN_USER.username) {
        toast({ title: "خطأ", description: "لا يمكن حذف المدير الافتراضي.", variant: "destructive" });
        return false;
    }
    
    const actualUsers = users || [];
    const currentAdmins = actualUsers.filter(u => u.role === 'admin');
    if (userToDelete.role === 'admin' && currentAdmins.length === 1) {
        toast({ title: "خطأ", description: "لا يمكن حذف المدير الوحيد.", variant: "destructive" });
        return false;
    }

    setUsers(prevUsers => (prevUsers || []).filter(u => u.id !== userId));
    toast({ title: "نجاح", description: `تم حذف المستخدم ${userToDelete.username}.` });
    return true;
  };
  
  const getUserById = (userId: string): User | undefined => {
    return (users || []).find(u => u.id === userId);
  };

  const hasRole = (rolesToCheck: UserRole[]): boolean => {
    if (!currentUser) return false;
    const currentUsersSafe = users || [];
    const userForRoleCheck = currentUsersSafe.find(u => u.id === currentUser.id);
    if (!userForRoleCheck) return false;
    return rolesToCheck.includes(userForRoleCheck.role);
  };

  const replaceAllUsers = (newUsers: User[]): void => {
    setUsers(newUsers);
    const currentIsValid = newUsers.some(u => u.id === currentUser?.id && u.username === currentUser?.username);
    if (!currentIsValid && currentUser) {
        setCurrentUser(null); 
    } else if (currentUser) {
        const updatedCurrentUser = newUsers.find(u => u.id === currentUser.id);
        if (updatedCurrentUser && (
            updatedCurrentUser.username !== currentUser.username || 
            updatedCurrentUser.role !== currentUser.role 
            // updatedCurrentUser.avatarUrl !== currentUser.avatarUrl // Removed avatarUrl check
            )) {
            setCurrentUser(updatedCurrentUser);
        }
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, isLoading, users: users || [], addUser, updateUser, deleteUser, getUserById, hasRole, replaceAllUsers }}>
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
