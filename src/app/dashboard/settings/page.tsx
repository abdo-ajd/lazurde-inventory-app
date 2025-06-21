
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
import { Save, RotateCcw, Download, Upload, Music, Trash2, Smartphone, DownloadCloud, AlertTriangle } from 'lucide-react';
import { DEFAULT_APP_SETTINGS, LOCALSTORAGE_KEYS } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import type { User, Product, Sale, AppSettings as AppSettingsType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { getImage as getImageFromDB, blobToDataUri } from '@/lib/indexedDBService';


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
  products: Product[]; // Product in backup might have imageUrl as DataURI
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

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}


export default function AppSettingsPage() {
  const { settings, updateSettings, resetToDefaults, applyTheme } = useAppSettings();
  const { users, replaceAllUsers, hasRole } = useAuth();
  const { products: productsFromContext, replaceAllProducts } = useProducts(); // Rename to avoid conflict
  const { sales, replaceAllSales } = useSales();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const successSoundInputRef = useRef<HTMLInputElement>(null);
  const [uploadedSuccessSoundName, setUploadedSuccessSoundName] = useState<string | null>(null);

  const invalidSoundInputRef = useRef<HTMLInputElement>(null);
  const [uploadedInvalidSoundName, setUploadedInvalidSoundName] = useState<string | null>(null);

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstallPWA, setCanInstallPWA] = useState(false);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);


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
        setUploadedSuccessSoundName("نغمة نجاح مخصصة");
    } else {
        setUploadedSuccessSoundName(null);
    }
     if (settings.invalidDiscountSound) {
        setUploadedInvalidSoundName("نغمة تنبيه مخصصة");
    } else {
        setUploadedInvalidSoundName(null);
    }
  }, [settings, form]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstallPWA(true);
      setIsPWAInstalled(false); 
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setCanInstallPWA(false);
      setIsPWAInstalled(true);
      toast({ title: "تم التثبيت", description: "تم تثبيت التطبيق بنجاح." });
    };
    
    if (typeof window !== 'undefined') {
        if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
            setIsPWAInstalled(true);
            setCanInstallPWA(false);
        }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [toast]);
  
  if (!hasRole(['admin'])) {
    // Logic to redirect or show access denied message if not admin
  }

  const onSubmit = (data: SettingsFormValues) => {
    updateSettings({
        storeName: data.storeName,
        themeColors: data.themeColors, 
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

  const handleCreateBackup = async () => {
    try {
      // Fetch current data directly from localStorage or context
      const productsFromStorage: Product[] = JSON.parse(localStorage.getItem(LOCALSTORAGE_KEYS.PRODUCTS) || '[]');
      const salesFromStorage: Sale[] = JSON.parse(localStorage.getItem(LOCALSTORAGE_KEYS.SALES) || '[]');
      const usersFromStorage: User[] = JSON.parse(localStorage.getItem(LOCALSTORAGE_KEYS.USERS) || '[]');
      // Settings are already available from useAppSettings hook (settings variable)

      const productsForBackup: Product[] = [];
      for (const product of productsFromStorage) {
        const productCopy = { ...product }; // Create a copy to modify for backup
        // If imageUrl is empty, it implies the image might be in IndexedDB
        // Or, if it's not a data URI and not an external http(s) link, it might also be an IDB placeholder.
        // For simplicity, we check if it's NOT a Data URI and NOT an HTTP/S link to consider fetching from IDB.
        // A truly empty imageUrl or one that was meant for IDB would be ''
        if (productCopy.imageUrl === '' || (!productCopy.imageUrl?.startsWith('data:image') && !productCopy.imageUrl?.startsWith('http'))) {
          const imageBlob = await getImageFromDB(productCopy.id);
          if (imageBlob) {
            try {
              productCopy.imageUrl = await blobToDataUri(imageBlob);
            } catch (conversionError) {
              console.error(`Error converting blob to data URI for product ${productCopy.id}:`, conversionError);
              // Keep imageUrl as empty or original non-http value if conversion fails
              productCopy.imageUrl = productCopy.imageUrl || ''; 
            }
          }
        }
        // If imageUrl is already a data URI or an external URL, it's kept as is.
        productsForBackup.push(productCopy);
      }

      const backupData: BackupData = {
        users: usersFromStorage,
        products: productsForBackup,
        sales: salesFromStorage,
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

        // replaceAll methods will handle IndexedDB migration for images if needed
        await replaceAllProducts(restoredData.products);
        replaceAllUsers(restoredData.users);
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
  
  const handleSoundFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'success' | 'invalid') => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { 
        toast({ variant: "destructive", title: "خطأ", description: "حجم الملف كبير جداً. الرجاء اختيار ملف أصغر من 5 ميجابايت." });
        if(type === 'success' && successSoundInputRef.current) successSoundInputRef.current.value = "";
        if(type === 'invalid' && invalidSoundInputRef.current) invalidSoundInputRef.current.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        if (type === 'success') {
            updateSettings({ saleSuccessSound: dataUri });
            setUploadedSuccessSoundName(file.name);
        } else {
            updateSettings({ invalidDiscountSound: dataUri });
            setUploadedInvalidSoundName(file.name);
        }
        toast({ title: "نجاح", description: `تم رفع النغمة: ${file.name}` });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearSound = (type: 'success' | 'invalid') => {
    if (type === 'success') {
        updateSettings({ saleSuccessSound: '' });
        setUploadedSuccessSoundName(null);
        if(successSoundInputRef.current) successSoundInputRef.current.value = "";
    } else {
        updateSettings({ invalidDiscountSound: '' });
        setUploadedInvalidSoundName(null);
        if(invalidSoundInputRef.current) invalidSoundInputRef.current.value = "";
    }
    toast({ title: "نجاح", description: "تمت إزالة النغمة المخصصة." });
  };


  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        // App was installed, appinstalled event will handle UI update
      } else {
        toast({ title: "ملاحظة", description: "تم إلغاء طلب التثبيت." });
      }
      setDeferredPrompt(null); 
      setCanInstallPWA(false); 
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">إعدادات التطبيق</h1>
        <p className="text-muted-foreground font-body">
          قم بتخصيص اسم المتجر، ألوان الواجهة، نغمات التنبيه، إدارة النسخ الاحتياطي، وتثبيت التطبيق.
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
            <Button onClick={() => successSoundInputRef.current?.click()} variant="outline" className="w-full sm:w-auto">
              <Music className="ml-2 h-4 w-4" /> {uploadedSuccessSoundName ? "تغيير النغمة" : "اختيار ملف صوتي"}
            </Button>
            <Input 
                type="file" 
                ref={successSoundInputRef} 
                className="hidden" 
                accept="audio/*" 
                onChange={(e) => handleSoundFileChange(e, 'success')}
            />
            {uploadedSuccessSoundName && (
              <Button onClick={() => handleClearSound('success')} variant="destructive" size="sm" className="w-full sm:w-auto">
                 <Trash2 className="ml-2 h-4 w-4" /> إزالة النغمة
              </Button>
            )}
          </div>
          {uploadedSuccessSoundName && (
            <p className="text-sm text-muted-foreground">النغمة الحالية: {uploadedSuccessSoundName}</p>
          )}
          {!uploadedSuccessSoundName && (
            <p className="text-sm text-muted-foreground">لم يتم اختيار نغمة مخصصة.</p>
          )}
           <p className="text-xs text-muted-foreground pt-2">
            (الحد الأقصى لحجم الملف: 5 ميجابايت. الأنواع المدعومة: MP3, WAV, OGG, إلخ)
           </p>
        </CardContent>
      </Card>
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" /> نغمة تنبيه الخصم غير المقبول
          </CardTitle>
          <CardDescription>اختر ملفًا صوتيًا لتشغيله عند محاولة تطبيق خصم أكبر من الربح.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Button onClick={() => invalidSoundInputRef.current?.click()} variant="outline" className="w-full sm:w-auto">
              <Music className="ml-2 h-4 w-4" /> {uploadedInvalidSoundName ? "تغيير نغمة التنبيه" : "اختيار ملف صوتي"}
            </Button>
            <Input 
                type="file" 
                ref={invalidSoundInputRef} 
                className="hidden" 
                accept="audio/*" 
                onChange={(e) => handleSoundFileChange(e, 'invalid')}
            />
            {uploadedInvalidSoundName && (
              <Button onClick={() => handleClearSound('invalid')} variant="destructive" size="sm" className="w-full sm:w-auto">
                 <Trash2 className="ml-2 h-4 w-4" /> إزالة النغمة
              </Button>
            )}
          </div>
          {uploadedInvalidSoundName && (
            <p className="text-sm text-muted-foreground">نغمة التنبيه الحالية: {uploadedInvalidSoundName}</p>
          )}
          {!uploadedInvalidSoundName && (
            <p className="text-sm text-muted-foreground">لم يتم اختيار نغمة تنبيه مخصصة.</p>
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

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>تثبيت التطبيق (Offline)</CardTitle>
          <CardDescription>
            قم بتثبيت التطبيق على جهازك لاستخدامه بدون اتصال بالإنترنت ولتجربة أسرع.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isPWAInstalled ? (
            <div className="flex items-center p-3 rounded-md bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700">
              <Smartphone className="ml-3 h-5 w-5" />
              <p>التطبيق مثبت بالفعل على هذا الجهاز.</p>
            </div>
          ) : canInstallPWA && deferredPrompt ? (
            <Button onClick={handleInstallPWA} className="w-full sm:w-auto">
              <DownloadCloud className="ml-2 h-4 w-4" /> تثبيت التطبيق الآن
            </Button>
          ) : (
             <div className="flex items-center p-3 rounded-md bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                <Smartphone className="ml-3 h-5 w-5" />
                <p>التثبيت غير متوفر حاليًا أو يتطلب متصفحًا يدعم هذه الميزة (مثل Chrome أو Edge).</p>
             </div>
          )}
          <p className="text-xs text-muted-foreground pt-1">
            إذا لم يظهر زر التثبيت، قد يكون متصفحك لا يدعم هذه الميزة، أو تم رفض طلب التثبيت سابقًا.
          </p>
        </CardContent>
      </Card>

    </div>
  );
}

    