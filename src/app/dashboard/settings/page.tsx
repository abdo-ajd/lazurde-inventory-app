
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
import { Save, RotateCcw, Download, Upload, Trash2, Smartphone, DownloadCloud, AlertTriangle, CreditCard, Edit } from 'lucide-react';
import { DEFAULT_APP_SETTINGS, LOCALSTORAGE_KEYS, DEFAULT_ADMIN_USER } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import type { User, Product, Sale, AppSettings as AppSettingsType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { getImage as getImageFromDB, blobToDataUri } from '@/lib/indexedDBService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as ShadcnDialogDescription, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';


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

const PREDEFINED_SERVICE_COLORS: { name: string, value: string }[] = [
    { name: 'أزرق', value: 'hsl(221, 83%, 53%)' },
    { name: 'أخضر', value: 'hsl(142, 71%, 45%)' },
    { name: 'برتقالي', value: 'hsl(24, 94%, 53%)' },
    { name: 'بنفسجي', value: 'hsl(262, 83%, 62%)' },
    { name: 'وردي', value: 'hsl(340, 82%, 52%)' },
    { name: 'سماوي', value: 'hsl(188, 83%, 45%)' },
    { name: 'رمادي', value: 'hsl(215, 14%, 47%)' },
    { name: 'أحمر', value: 'hsl(0, 72%, 51%)' },
    { name: 'أصفر', value: 'hsl(45, 100%, 51%)' },
    { name: 'تركواز', value: 'hsl(170, 75%, 41%)' },
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
  const { users, replaceAllUsers, hasRole, currentUser } = useAuth();
  const { products: productsFromContext, replaceAllProducts } = useProducts(); // Rename to avoid conflict
  const { sales, replaceAllSales } = useSales();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceColor, setNewServiceColor] = useState<string>(PREDEFINED_SERVICE_COLORS[0]?.value || '');
  
  const [serviceToEdit, setServiceToEdit] = useState<{ name: string; color: string } | null>(null);

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstallPWA, setCanInstallPWA] = useState(false);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);

  const isDefaultAdmin = currentUser?.id === DEFAULT_ADMIN_USER.id;


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
  
  const handleAddBankService = () => {
    const name = newServiceName.trim();
    if (name === '') return;
    if (newServiceColor === '') {
        toast({ variant: "destructive", title: "مطلوب", description: "الرجاء اختيار لون للخدمة." });
        return;
    }
    
    const currentServices = settings.bankServices || [];
    if (currentServices.map(s => s.name.toLowerCase()).includes(name.toLowerCase())) {
        toast({ variant: "destructive", title: "موجود بالفعل", description: "هذه الخدمة المصرفية موجودة بالفعل." });
        return;
    }
    const updatedServices = [...currentServices, { name, color: newServiceColor }];
    updateSettings({ bankServices: updatedServices });
    setNewServiceName('');
  };

  const handleDeleteBankService = (serviceNameToDelete: string) => {
    const updatedServices = (settings.bankServices || []).filter(s => s.name !== serviceNameToDelete);
    updateSettings({ bankServices: updatedServices });
  };

  const handleUpdateServiceColor = () => {
    if (!serviceToEdit) return;
    const updatedServices = (settings.bankServices || []).map(s =>
        s.name === serviceToEdit.name ? { ...s, color: serviceToEdit.color } : s
    );
    updateSettings({ bankServices: updatedServices });
    toast({ title: "تم التحديث", description: `تم تحديث لون خدمة "${serviceToEdit.name}".` });
    setServiceToEdit(null);
  };
  
  const handleBackup = async () => {
    toast({ title: "جاري التحضير...", description: "يتم تجميع بيانات النسخة الاحتياطية." });

    // Fetch images from IndexedDB and embed them as data URIs
    const productsWithImages = await Promise.all(
      (productsFromContext || []).map(async (p) => {
        // An empty imageUrl implies the image might be in IndexedDB
        if (!p.imageUrl) { 
          try {
            const imageBlob = await getImageFromDB(p.id);
            if (imageBlob) {
              const dataUri = await blobToDataUri(imageBlob);
              return { ...p, imageUrl: dataUri };
            }
          } catch (error) {
            console.error(`Failed to get image for product ${p.id} from IndexedDB`, error);
          }
        }
        // Return product as is if it has an external URL or no image at all
        return p;
      })
    );
    
    const backupData: BackupData = {
      users: users || [],
      products: productsWithImages,
      sales: sales || [],
      settings: settings,
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lazurde_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "اكتمل", description: "تم تنزيل ملف النسخة الاحتياطية." });
  };

  const handleRestoreChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const jsonString = e.target?.result as string;
          if (!jsonString) {
             throw new Error("الملف فارغ.");
          }
          await handleRestore(jsonString);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "صيغة الملف غير صحيحة.";
          toast({ variant: "destructive", title: "خطأ في الاستعادة", description: errorMessage });
        } finally {
          // Reset file input to allow re-uploading the same file
          if(fileInputRef.current) fileInputRef.current.value = "";
        }
      };
      reader.readAsText(file);
    }
  };
  
  const handleRestore = async (jsonString: string) => {
    const data: BackupData = JSON.parse(jsonString);
    // Basic validation
    if (!data.users || !data.products || !data.sales || !data.settings) {
      throw new Error("ملف النسخة الاحتياطية غير مكتمل أو تالف.");
    }
    
    replaceAllUsers(data.users);
    await replaceAllProducts(data.products);
    replaceAllSales(data.sales);
    updateSettings(data.settings); // This will also apply theme and icon

    toast({ title: "نجاح", description: "تم استعادة البيانات بنجاح!" });
  };



  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">إعدادات التطبيق</h1>
        <p className="text-muted-foreground font-body">
          قم بتخصيص اسم المتجر، ألوان الواجهة، إدارة النسخ الاحتياطي، وتثبيت التطبيق.
        </p>
      </div>

      <Dialog open={!!serviceToEdit} onOpenChange={(isOpen) => !isOpen && setServiceToEdit(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>تعديل لون خدمة: {serviceToEdit?.name}</DialogTitle>
                <ShadcnDialogDescription>اختر لونًا جديدًا للخدمة المصرفية.</ShadcnDialogDescription>
            </DialogHeader>
            <div className="py-4">
                <Select
                    value={serviceToEdit?.color}
                    onValueChange={(newColor) => {
                        if (serviceToEdit) {
                            setServiceToEdit({ ...serviceToEdit, color: newColor });
                        }
                    }}
                    dir="rtl"
                >
                    <SelectTrigger>
                        <SelectValue placeholder="اختر لونًا" />
                    </SelectTrigger>
                    <SelectContent>
                        {PREDEFINED_SERVICE_COLORS.map(color => (
                            <SelectItem key={color.value} value={color.value}>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color.value }} />
                                    <span>{color.name}</span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <DialogFooter className="gap-2 sm:justify-start">
                <DialogClose asChild>
                    <Button type="button" variant="secondary">إلغاء</Button>
                </DialogClose>
                <Button type="button" onClick={handleUpdateServiceColor}>حفظ التغييرات</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {isDefaultAdmin && (
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
          )}

          <Card className={isDefaultAdmin ? "mt-6" : ""}>
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
      
      {hasRole(['admin']) && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              الخدمات المصرفية
            </CardTitle>
            <CardDescription>إدارة قائمة الخدمات المصرفية وألوانها المميزة في التقارير.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                placeholder="اسم خدمة مصرفية جديدة..."
                className="flex-grow"
                onKeyDown={(e) => e.key === 'Enter' && handleAddBankService()}
              />
              <Select value={newServiceColor} onValueChange={setNewServiceColor} dir="rtl">
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="اختر لونًا" />
                </SelectTrigger>
                <SelectContent>
                    {PREDEFINED_SERVICE_COLORS.map(color => (
                        <SelectItem key={color.value} value={color.value}>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color.value }} />
                                <span>{color.name}</span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAddBankService} className="w-full sm:w-auto">إضافة</Button>
            </div>
            <div className="space-y-2">
              {(settings.bankServices || []).length > 0 ? (
                (settings.bankServices || []).map(service => (
                  <div key={service.name} className="flex items-center justify-between rounded-md border p-2 bg-muted/50">
                    <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full" style={{ backgroundColor: service.color }} />
                        <span className="font-medium">{service.name}</span>
                    </div>
                    <div className="flex items-center">
                        <Button variant="ghost" size="icon" onClick={() => setServiceToEdit(service)} title="تعديل اللون">
                            <Edit className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteBankService(service.name)} title="حذف الخدمة">
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">لا توجد خدمات مصرفية مضافة.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}


      <Card className="mt-6">
        <CardHeader>
            <CardTitle>النسخ الاحتياطي والاستعادة</CardTitle>
            <CardDescription>
                قم بإنشاء نسخة احتياطية من جميع بياناتك (منتجات، صور، مبيعات، إعدادات) في ملف واحد، أو قم باستعادة بياناتك من ملف نسخة احتياطية.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={handleBackup} className="w-full sm:w-auto">
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
                onChange={handleRestoreChange}
            />
            </div>
            <p className="text-xs text-muted-foreground">
                تحذير: استعادة نسخة احتياطية سيقوم بمسح جميع البيانات الحالية واستبدالها بالبيانات الموجودة في الملف.
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

    