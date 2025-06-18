// src/app/dashboard/settings/page.tsx
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { Save, RotateCcw } from 'lucide-react';
import { DEFAULT_APP_SETTINGS } from '@/lib/constants';

const hslColorSchema = z.string().regex(/^(\d{1,3})\s+(\d{1,3}%)\s+(\d{1,3}%)$/, {
  message: "اللون يجب أن يكون بتنسيق HSL صحيح (مثال: 217 89% 61%)"
});

const settingsSchema = z.object({
  storeName: z.string().min(1, { message: "اسم المتجر مطلوب" }),
  themeColors: z.object({
    primary: hslColorSchema,
    background: hslColorSchema,
    accent: hslColorSchema,
  }),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function AppSettingsPage() {
  const { settings, updateSettings, resetToDefaults } = useAppSettings();
  const { hasRole } = useAuth();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings, // Initialize with current settings
  });

  useEffect(() => {
    // Reset form with current settings when they change (e.g., after resetToDefaults)
    form.reset(settings);
  }, [settings, form]);
  
  if (!hasRole(['admin'])) {
    // router.replace('/dashboard');
    // return <p>ليس لديك صلاحية الوصول.</p>;
  }

  const onSubmit = (data: SettingsFormValues) => {
    updateSettings(data);
  };

  const handleReset = () => {
    resetToDefaults();
    // Form will be reset by useEffect
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">إعدادات التطبيق</h1>
        <p className="text-muted-foreground font-body">
          قم بتخصيص اسم المتجر وألوان الواجهة لتناسب علامتك التجارية.
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>إعدادات عامة</CardTitle>
              <CardDescription>تخصيص اسم المتجر الظاهر في التطبيق.</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="storeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="storeName">اسم المتجر</FormLabel>
                    <FormControl>
                      <Input id="storeName" placeholder="مثال: متجر النجوم" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>ألوان الواجهة</CardTitle>
              <CardDescription>أدخل الألوان بتنسيق HSL (مثال: 217 89% 61%). سيتم تطبيق الألوان مباشرة.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="themeColors.primary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="primaryColor">اللون الأساسي (Primary)</FormLabel>
                    <FormControl>
                      <Input id="primaryColor" placeholder={DEFAULT_APP_SETTINGS.themeColors.primary} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="themeColors.background"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="backgroundColor">لون الخلفية (Background)</FormLabel>
                    <FormControl>
                      <Input id="backgroundColor" placeholder={DEFAULT_APP_SETTINGS.themeColors.background} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="themeColors.accent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="accentColor">اللون الثانوي/المميز (Accent)</FormLabel>
                    <FormControl>
                      <Input id="accentColor" placeholder={DEFAULT_APP_SETTINGS.themeColors.accent} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="submit">
                <Save className="ml-2 h-4 w-4" /> حفظ الإعدادات
              </Button>
              <Button type="button" variant="outline" onClick={handleReset}>
                <RotateCcw className="ml-2 h-4 w-4" /> استعادة الافتراضي
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
