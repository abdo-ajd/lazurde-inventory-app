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
import { useEffect, useRef, useState } from 'react';
import { Save, RotateCcw, Download, Upload, Music, Trash2 } from 'lucide-react';
import { DEFAULT_APP_SETTINGS, LOCALSTORAGE_KEYS } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import type { User, Product, Sale, AppSettings as AppSettingsType } from '@/lib/types';
import { cn } from '@/lib/utils';


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

const PREDEFINED_PALETTES: { name: string; id: string; colors: AppSettingsType['themeColors'] }[] = [
  {
    name: "لازوردي الافتراضي",
    id: 'lazurde_default',
    colors: DEFAULT_APP_SETTINGS.themeColors,
  },
  {
    name: "أزرق سماوي",
    id: 'sky_blue',
    colors: { primary: "207 90% 54%", background: "210 40% 98%", accent: "190 80% 60%" },
  },
  {
    name: "أخضر نعناعي",
    id: 'mint_green',
    colors: { primary: "150 70% 45%", background: "150 20% 97%", accent: "160 60% 70%" },
  },
  {
    name: "وردي دافئ",
    id: 'warm_pink',
    colors: { primary: "340 80% 65%", background: "340 30% 98%", accent: "350 70% 75%" },
  },
  {
    name: "بنفسجي ملكي",
    id: 'royal_purple',
    colors: { primary: "260 70% 55%", background: "260 20% 96%", accent: "270 60% 70%" },
  },
  {
    name: "رمادي محايد",
    id: 'neutral_gray',
    colors: { primary: "215 15% 50%", background: "0 0% 98%", accent: "215 10% 70%" },
  },
];


export default function AppSettingsPage() {
  const { settings, updateSettings, resetToDefaults, applyTheme } = useAppSettings();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { users, replaceAllUsers, hasRole } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { products, replaceAllProducts } = useProducts();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { sales, replaceAllSales } = useSales();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const soundFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedSoundName, setUploadedSoundName] = useState<string | null>(null);


  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
        storeName: settings.storeName,
        themeColors: settings.themeColors,
    },
  });
  
  const currentThemeColors = form.watch('themeColors');

  useEffect(() => {
    form.reset({
        storeName: settings.storeName,
        themeColors: settings.themeColors,
    });
    if (settings.saleSuccessSound) {
        setUploadedSoundName("نغمة مخصصة مرفوعة");
    } else {
        setUploadedSoundName(null);
    }
  }, [settings, form]);
  
  if (!hasRole(['admin'])) {
    // Logic to redirect or show access denied message if not admin
  }

  const onSubmit = (data: SettingsFormValues) => {
    updateSettings({
        storeName: data.storeName,
        themeColors: data.themeColors, // These are already updated by palette selection
    });
  };

  const handleReset = () => {
    resetToDefaults(); 
  };

  const handlePaletteSelect = (paletteColors: AppSettingsType['themeColors']) => {
    form.setValue('themeColors', paletteColors, { shouldDirty: true, shouldValidate: true });
    applyTheme(paletteColors); 
  };

  const isActivePalette = (paletteColors: AppSettingsType['themeColors']) => {
    return (
      currentThemeColors.primary === paletteColors.primary &&
      currentThemeColors.background === paletteColors.background &&
      currentThemeColors.accent === paletteColors.accent
    );
  };

  const handleCreateBackup = () => {
    try {
      const backupData: BackupData = {
        users: JSON.parse(localStorage.getItem(LOCALSTORAGE_KEYS.USERS) || '[]'),
        products: JSON.parse(localStorage.getItem(LOCALSTORAGE_KEYS.PRODUCTS) || '[]'),
        sales: JSON.parse(localStorage.getItem(LOCALSTORAGE_KEYS.SALES) || '[]'),
        settings: settings, 
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
        
        if (!Array.isArray(restoredData.users) || !Array.isArray(restoredData.products) || !Array.isArray(restoredData.sales) || typeof restoredData.settings !== 'object') {
            throw new Error("تنسيق البيانات في ملف النسخ الاحتياطي غير صحيح.");
        }

        replaceAllUsers(restoredData.users);
        replaceAllProducts(restoredData.products);
        replaceAllSales(restoredData.sales);
        updateSettings(restoredData.settings);

        toast({ title: "نجاح", description: "تم استعادة البيانات بنجاح. سيتم إعادة تحميل الصفحة." });
        
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

  const handleSoundFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { 
        toast({ variant: "destructive", title: "خطأ", description: "حجم الملف كبير جداً. الرجاء اختيار ملف أصغر من 5 ميجابايت." });
        if(soundFileInputRef.current) soundFileInputRef.current.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        updateSettings({ saleSuccessSound: dataUri });
        setUploadedSoundName(file.name);
        toast({ title: "نجاح", description: `تم رفع النغمة: ${file.name}` });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearSound = () => {
    updateSettings({ saleSuccessSound: '' });
    setUploadedSoundName(null);
    if(soundFileInputRef.current) soundFileInputRef.current.value = "";
    toast({ title: "نجاح", description: "تمت إزالة النغمة المخصصة." });
  };

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">إعدادات التطبيق</h1>
        <p className="text-muted-foreground font-body">
          قم بتخصيص اسم المتجر، ألوان الواجهة، نغمة البيع، وإدارة النسخ الاحتياطي للبيانات.
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
              <CardDescription>اختر نسق الألوان المفضل لديك. سيتم تطبيق النسق مباشرة كمعاينة.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {PREDEFINED_PALETTES.map((palette) => (
                  <Button
                    key={palette.id}
                    type="button"
                    variant={isActivePalette(palette.colors) ? "default" : "outline"}
                    onClick={() => handlePaletteSelect(palette.colors)}
                    className={cn(
                        "flex flex-col items-start p-3 h-auto text-right",
                        isActivePalette(palette.colors) && "ring-2 ring-primary ring-offset-2"
                    )}
                  >
                    <span className="font-semibold mb-2 text-sm">{palette.name}</span>
                    <div className="flex gap-2">
                      <div className="w-5 h-5 rounded-full border" style={{ backgroundColor: `hsl(${palette.colors.primary})` }} title={`Primary: ${palette.colors.primary}`} />
                      <div className="w-5 h-5 rounded-full border" style={{ backgroundColor: `hsl(${palette.colors.background})` }} title={`Background: ${palette.colors.background}`} />
                      <div className="w-5 h-5 rounded-full border" style={{ backgroundColor: `hsl(${palette.colors.accent})` }} title={`Accent: ${palette.colors.accent}`} />
                    </div>
                  </Button>
                ))}
              </div>
               {/* Hidden FormField to keep themeColors in form state for submission */}
               <FormField
                control={form.control}
                name="themeColors.primary"
                render={({ field }) => <Input type="hidden" {...field} />}
              />
              <FormField
                control={form.control}
                name="themeColors.background"
                render={({ field }) => <Input type="hidden" {...field} />}
              />
              <FormField
                control={form.control}
                name="themeColors.accent"
                render={({ field }) => <Input type="hidden" {...field} />}
              />
            </CardContent>
          </Card>
          
          <div className="mt-8 flex flex-col sm:flex-row justify-between gap-4">
            <Button type="submit" className="w-full sm:w-auto">
              <Save className="ml-2 h-4 w-4" /> حفظ جميع الإعدادات
            </Button>
            <Button type="button" variant="outline" onClick={handleReset} className="w-full sm:w-auto">
              <RotateCcw className="ml-2 h-4 w-4" /> استعادة الإعدادات الافتراضية
            </Button>
          </div>

        </form>
      </Form>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>نغمة إتمام البيع</CardTitle>
          <CardDescription>اختر ملفًا صوتيًا لتشغيله عند إتمام عملية بيع ناجحة.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Button onClick={() => soundFileInputRef.current?.click()} variant="outline" className="w-full sm:w-auto">
              <Music className="ml-2 h-4 w-4" /> {uploadedSoundName ? "تغيير النغمة" : "اختيار ملف صوتي"}
            </Button>
            <Input 
                type="file" 
                ref={soundFileInputRef} 
                className="hidden" 
                accept="audio/*" 
                onChange={handleSoundFileChange}
            />
            {uploadedSoundName && (
              <Button onClick={handleClearSound} variant="destructive" size="sm" className="w-full sm:w-auto">
                 <Trash2 className="ml-2 h-4 w-4" /> إزالة النغمة
              </Button>
            )}
          </div>
          {uploadedSoundName && (
            <p className="text-sm text-muted-foreground">النغمة الحالية: {uploadedSoundName}</p>
          )}
          {!uploadedSoundName && (
            <p className="text-sm text-muted-foreground">لم يتم اختيار نغمة مخصصة.</p>
          )}
           <p className="text-xs text-muted-foreground pt-2">
            (الحد الأقصى لحجم الملف: 5 ميجابايت. الأنواع المدعومة: MP3, WAV, OGG, إلخ)
           </p>
        </CardContent>
      </Card>

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
