// src/app/dashboard/users/page.tsx
"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, Search, Edit3, Trash2, ShieldCheck, User, Briefcase } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription, DialogClose } from '@/components/ui/dialog';
import type { User, UserRole } from '@/lib/types';
import { DEFAULT_ADMIN_USER } from '@/lib/constants';

const roleTranslations: Record<UserRole, string> = {
  admin: 'مدير',
  employee: 'موظف',
  employee_return: 'موظف إرجاع',
};

const roleIcons: Record<UserRole, React.ElementType> = {
  admin: ShieldCheck,
  employee: User,
  employee_return: Briefcase,
};

export default function ManageUsersPage() {
  const { users, deleteUser, hasRole: userHasRoleAuth } = useAuth(); // Renamed to avoid conflict
  const [searchTerm, setSearchTerm] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);


  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(user =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      roleTranslations[user.role].toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);
  
  const handleDeleteUser = async (userId: string) => {
     const userToDelete = users.find(u => u.id === userId);
     if (userToDelete) {
        if (confirm(`هل أنت متأكد أنك تريد حذف المستخدم "${userToDelete.username}"؟`)) {
           await deleteUser(userId);
        }
     }
  };

  if (!userHasRoleAuth(['admin'])) {
    // This should be handled by layout, but as a fallback:
    // router.replace('/dashboard'); 
    // return <p className="p-4 text-red-500">ليس لديك صلاحية الوصول لهذه الصفحة.</p>;
  }

  if (!isClient) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-1/2 bg-muted animate-pulse rounded-md"></div>
        <Card>
          <CardHeader>
            <div className="h-8 w-1/2 bg-muted animate-pulse rounded-md"></div>
            <div className="h-6 w-1/3 bg-muted animate-pulse rounded-md mt-2"></div>
          </CardHeader>
          <CardContent>
            <div className="h-10 w-full bg-muted animate-pulse rounded-md mb-4"></div>
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 w-full bg-muted animate-pulse rounded-md"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">إدارة المستخدمين</h1>
        <p className="text-muted-foreground font-body">
          عرض، إضافة، تعديل، وحذف المستخدمين وصلاحياتهم.
        </p>
      </div>
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>قائمة المستخدمين</CardTitle>
            <CardDescription>إجمالي المستخدمين: {users?.length || 0}</CardDescription>
          </div>
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="ابحث بالاسم أو الدور..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10"
                aria-label="البحث عن مستخدم"
              />
            </div>
            <Button asChild className="w-full md:w-auto">
              <Link href="/dashboard/users/add">
                <PlusCircle className="ml-2 h-4 w-4" /> إضافة مستخدم
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>اسم المستخدم</TableHead>
                    <TableHead>الدور</TableHead>
                    <TableHead className="text-center">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const RoleIcon = roleIcons[user.role];
                    const isDefaultAdmin = user.id === DEFAULT_ADMIN_USER.id;
                    const currentAdmins = users.filter(u => u.role === 'admin');
                    const isSoleAdmin = user.role === 'admin' && currentAdmins.length === 1;
                    const canDelete = !isDefaultAdmin && !isSoleAdmin;

                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>
                          <span className="flex items-center">
                            <RoleIcon className="ml-2 h-4 w-4 text-muted-foreground" />
                            {roleTranslations[user.role]}
                          </span>
                        </TableCell>
                        <TableCell className="text-center space-x-1 space-x-reverse">
                          <Button variant="ghost" size="icon" asChild title="تعديل المستخدم">
                            <Link href={`/dashboard/users/${user.id}/edit`}>
                              <Edit3 className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="destructive" size="icon" title="حذف المستخدم" disabled={!canDelete}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>تأكيد الحذف</DialogTitle>
                                <DialogDescription>
                                  هل أنت متأكد أنك تريد حذف المستخدم "{user.username}"؟
                                  {isDefaultAdmin && " لا يمكن حذف المدير الافتراضي."}
                                  {isSoleAdmin && " لا يمكن حذف المدير الوحيد."}
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter className="gap-2 sm:justify-start">
                                <DialogClose asChild>
                                  <Button type="button" variant="secondary">إلغاء</Button>
                                </DialogClose>
                                <Button type="button" variant="destructive" onClick={() => handleDeleteUser(user.id)} disabled={!canDelete}>
                                  حذف
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <Search size={48} className="mx-auto mb-2" />
              <p>لا يوجد مستخدمون يطابقون بحثك أو لم يتم إضافة مستخدمين بعد.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
