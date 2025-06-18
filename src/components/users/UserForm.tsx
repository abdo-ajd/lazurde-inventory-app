// src/components/users/UserForm.tsx
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { User, UserRole } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Save } from 'lucide-react';

const roles: UserRole[] = ['admin', 'employee', 'employee_return'];
const roleTranslations: Record<UserRole, string> = {
  admin: 'مدير',
  employee: 'موظف',
  employee_return: 'موظف إرجاع',
};

const userSchemaBase = {
  username: z.string().min(3, { message: "اسم المستخدم يجب أن يكون 3 أحرف على الأقل" }),
  role: z.enum(roles, { errorMap: () => ({ message: "الرجاء اختيار دور صالح" }) }),
};

const addUserSchema = z.object({
  ...userSchemaBase,
  password: z.string().min(6, { message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" }),
});

const editUserSchema = z.object({
  ...userSchemaBase,
  password: z.string().optional().refine(val => val === '' || val === undefined || val.length >= 6, {
    message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل أو اتركها فارغة لعدم التغيير",
  }),
});

export type AddUserFormValues = z.infer<typeof addUserSchema>;
export type EditUserFormValues = z.infer<typeof editUserSchema>;
type UserFormValues = AddUserFormValues | EditUserFormValues;


interface UserFormProps {
  onSubmit: (data: UserFormValues) => Promise<void>;
  initialData?: User | null;
  isEditMode?: boolean;
  isLoading?: boolean;
}

export default function UserForm({ onSubmit, initialData, isEditMode = false, isLoading = false }: UserFormProps) {
  const formSchema = isEditMode ? editUserSchema : addUserSchema;
  
  const form = useForm<UserFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: initialData?.username || '',
      password: '', // Always empty for edit, required for add
      role: initialData?.role || 'employee',
    },
  });

  const handleFormSubmit = async (data: UserFormValues) => {
    // For edit mode, if password is empty string, don't send it
    if (isEditMode && 'password' in data && (data.password === '' || data.password === undefined)) {
      const { password, ...restData } = data as EditUserFormValues;
      await onSubmit(restData);
    } else {
      await onSubmit(data);
    }
    if (!isEditMode) {
      form.reset({ username: '', password: '', role: 'employee' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}</CardTitle>
        <CardDescription>
          {isEditMode ? 'قم بتحديث تفاصيل المستخدم أدناه.' : 'أدخل تفاصيل المستخدم الجديد وصلاحياته.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="username">اسم المستخدم</FormLabel>
                  <FormControl>
                    <Input id="username" placeholder="مثال: ali.mohamed" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="password">
                    كلمة المرور {isEditMode && '(اتركه فارغًا لعدم التغيير)'}
                  </FormLabel>
                  <FormControl>
                    <Input id="password" type="password" placeholder="********" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="role">الدور</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} dir="rtl">
                    <FormControl>
                      <SelectTrigger id="role">
                        <SelectValue placeholder="اختر دورًا للمستخدم" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles.map(role => (
                        <SelectItem key={role} value={role}>
                          {roleTranslations[role]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
              {isLoading ? (isEditMode ? 'جاري الحفظ...' : 'جاري الإضافة...') : 
                <><Save className="ml-2 h-4 w-4" /> {isEditMode ? 'حفظ التعديلات' : 'إضافة المستخدم'}</>}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
