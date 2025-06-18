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
import { useProducts } from '@/contexts/ProductContext';
import { useSales } from '@/contexts/SalesContext';
import { useEffect, useRef } from 'react';
import { Save, RotateCcw, Download, Upload } from 'lucide-react';
import { DEFAULT_APP_SETTINGS, LOCALSTORAGE_KEYS } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import type { User, Product, Sale, AppSettings as AppSettingsType } from '@/lib/types';


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

interface BackupData {
  users: User[];
  products: Product[];
  sales: Sale[];
  settings: AppSettingsType;
}

export default function AppSettingsPage() {
  const { settings, updateSettings, resetToDefaults } = useAppSettings();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { users, replaceAllUsers, hasRole } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { products, replaceAllProducts } = useProducts();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { sales, replaceAllSales } = useSales();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings,
  });

  useEffect(() => {
    form.reset(settings);
  }, [settings, form]);
  
  if (!hasRole(['admin'])) {
    // Logic to redirect or show access denied message if not admin
    // For now, assuming this is handled by layout or higher-order component
  }

  const onSubmit = (data: SettingsFormValues) => {
    updateSettings(data);
  };

  const handleReset = () => {
    resetToDefaults();
  };

  const handleCreateBackup = () => {
    try {
      const backupData: BackupData = {
        users: JSON.parse(localStorage.getItem(LOCALSTORAGE_KEYS.USERS) || '[]'),
        products: JSON.parse(localStorage.getItem(LOCALSTORAGE_KEYS.PRODUCTS) || '[]'),
        sales: JSON.parse(localStorage.getItem(LOCALSTORAGE_KEYS.SALES) || '[]'),
        settings: JSON.parse(localStorage.getItem(LOCALSTORAGE_KEYS.APP_SETTINGS) || JSON.stringify(DEFAULT_APP_SETTINGS)),
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      const date = new Date().toISOString().split('T')[0];
      link.download = `lazurde_backup_${date}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(href);
      toast({ title: "نجاح", description: "تم إنشاء النسخة الاحتياطية بنجاح." });
    } catch (error) {
      console.error("Backup error:", error);
      toast({ variant: "destructive", title: "خطأ", description: "فشل إنشاء النسخة الاحتياطية." });
    }
  };

  const handleRestoreBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error("File content is not a string");
        }
        const restoredData = JSON.parse(text) as Partial<BackupData>;

        if (!restoredData.users || !restoredData.products || !restoredData.sales || !restoredData.settings) {
          throw new Error("ملف النسخ الاحتياطي غير صالح أو تالف.");
        }
        
        // Validate structure further if necessary (e.g. array checks)
        if (!Array.isArray(restoredData.users) || !Array.isArray(restoredData.products) || !Array.isArray(restoredData.sales) || typeof restoredData.settings !== 'object') {
            throw new Error("تنسيق البيانات في ملف النسخ الاحتياطي غير صحيح.");
        }

        replaceAllUsers(restoredData.users);
        replaceAllProducts(restoredData.products);
        replaceAllSales(restoredData.sales);
        updateSettings(restoredData.settings); // This will also apply theme

        toast({ title: "نجاح", description: "تم استعادة البيانات بنجاح. سيتم إعادة تحميل الصفحة." });
        
        // Clear the file input so the same file can be selected again if needed
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }

        setTimeout(() => {
          window.location.reload();
        }, 1500);

      } catch (error) {
        console.error("Restore error:", error);
        const errorMessage = error instanceof Error ? error.message : "فشل استعادة النسخة الاحتياطية. تأكد من أن الملف صحيح.";
        toast({ variant: "destructive", title: "خطأ في الاستعادة", description: errorMessage });
         if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">إعدادات التطبيق</h1>
        <p className="text-muted-foreground font-body">
          قم بتخصيص اسم المتجر، ألوان الواجهة، وإدارة النسخ الاحتياطي للبيانات.
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

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>النسخ الاحتياطي والاستعادة</CardTitle>
          <CardDescription>قم بإنشاء نسخة احتياطية من بيانات تطبيقك أو استعد بياناتك من نسخة سابقة.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={handleCreateBackup} className="w-full sm:w-auto">
              <Download className="ml-2 h-4 w-4" /> إنشاء نسخة احتياطية
            </Button>
            <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="w-full sm:w-auto">
              <Upload className="ml-2 h-4 w-4" /> استعادة من نسخة احتياطية
            </Button>
            <Input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".json" 
                onChange={handleRestoreBackup}
            />
           </div>
           <p className="text-sm text-muted-foreground mt-2">
            سيتم تنزيل النسخة الاحتياطية كملف JSON. عند الاستعادة، تأكد من اختيار ملف JSON صحيح تم إنشاؤه بواسطة هذا التطبيق.
            <br/>
            <strong className="text-destructive">تحذير:</strong> استعادة نسخة احتياطية سيقوم بالكتابة فوق جميع البيانات الحالية.
           </p>
        </CardContent>
      </Card>
    </div>
  );
}

