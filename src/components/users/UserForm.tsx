// src/components/users/UserForm.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import type { User, UserRole } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription as ShadcnCardDescription } from '@/components/ui/card';
import { Save, Camera, XCircle, FileImage } from 'lucide-react';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

const roles: UserRole[] = ['admin', 'employee', 'employee_return'];
const roleTranslations: Record<UserRole, string> = {
  admin: 'مدير',
  employee: 'موظف',
  employee_return: 'موظف إرجاع',
};

const userSchemaBase = {
  username: z.string().min(3, { message: "اسم المستخدم يجب أن يكون 3 أحرف على الأقل" }),
  role: z.enum(roles, { errorMap: () => ({ message: "الرجاء اختيار دور صالح" }) }),
  avatarUrl: z.string().optional().or(z.literal('')),
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
  const { toast } = useToast();
  
  const form = useForm<UserFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: initialData?.username || '',
      password: '', 
      role: initialData?.role || 'employee',
      avatarUrl: initialData?.avatarUrl || '',
    },
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.avatarUrl || null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    setImagePreview(initialData?.avatarUrl || null);
    form.setValue('avatarUrl', initialData?.avatarUrl || '');
  }, [initialData, form]);

  const startCamera = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } }); // "user" for front camera
        setVideoStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasCameraPermission(true);
        setIsCameraActive(true);
        setImagePreview(null); 
        form.setValue('avatarUrl', ''); 
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'فشل الوصول للكاميرا',
          description: 'يرجى التأكد من أنك سمحت بالوصول للكاميرا في إعدادات المتصفح.',
        });
        setIsCameraActive(false);
      }
    } else {
      toast({ variant: 'destructive', title: 'الكاميرا غير مدعومة', description: 'متصفحك لا يدعم الوصول للكاميرا.' });
    }
  };

  const stopCamera = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
    }
    setVideoStream(null);
    setIsCameraActive(false);
    const currentFormUrl = form.getValues('avatarUrl');
    if (!currentFormUrl && initialData?.avatarUrl) {
      setImagePreview(initialData.avatarUrl);
    } else if (currentFormUrl) {
      setImagePreview(currentFormUrl);
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/png');
        form.setValue('avatarUrl', dataUri, { shouldValidate: true, shouldDirty: true });
        setImagePreview(dataUri);
      }
      stopCamera();
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (isCameraActive) {
        stopCamera();
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        form.setValue('avatarUrl', dataUri, { shouldValidate: true, shouldDirty: true });
        setImagePreview(dataUri);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const clearImage = () => {
    form.setValue('avatarUrl', '', { shouldValidate: true, shouldDirty: true });
    setImagePreview(null);
    if (isCameraActive) {
      stopCamera();
    }
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    return () => {
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [videoStream]);


  const handleFormSubmit = async (data: UserFormValues) => {
    const dataToSubmit: any = { ...data };
    if (isEditMode && (data.password === '' || data.password === undefined)) {
      delete dataToSubmit.password;
    }
    await onSubmit(dataToSubmit);
    if (!isEditMode) {
      form.reset({ username: '', password: '', role: 'employee', avatarUrl: '' });
      setImagePreview(null); 
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}</CardTitle>
        <ShadcnCardDescription>
          {isEditMode ? 'قم بتحديث تفاصيل المستخدم أدناه.' : 'أدخل تفاصيل المستخدم الجديد وصلاحياته وصورته الشخصية.'}
        </ShadcnCardDescription>
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
                      {roles.map(roleValue => (
                        <SelectItem key={roleValue} value={roleValue}>
                          {roleTranslations[roleValue]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>الصورة الشخصية (اختياري)</FormLabel>
              <div className="space-y-4">
                {isCameraActive && hasCameraPermission && (
                  <div className="border rounded-md p-4 space-y-3">
                    <video ref={videoRef} className="w-full aspect-square max-w-xs mx-auto rounded-md bg-muted" autoPlay muted playsInline />
                    <div className="grid grid-cols-2 gap-2">
                        <Button type="button" onClick={captureImage} className="w-full">
                        <Camera className="ml-2 h-4 w-4" /> التقاط صورة
                        </Button>
                        <Button type="button" variant="outline" onClick={stopCamera} className="w-full">
                        إلغاء الكاميرا
                        </Button>
                    </div>
                  </div>
                )}

                {hasCameraPermission === false && !isCameraActive && (
                   <Alert variant="destructive">
                    <AlertTitle>فشل الوصول للكاميرا</AlertTitle>
                    <AlertDescription>
                      يرجى السماح بالوصول للكاميرا في إعدادات المتصفح ثم حاول مرة أخرى.
                    </AlertDescription>
                  </Alert>
                )}
                
                {!isCameraActive && imagePreview && (
                  <div className="relative group w-32 h-32 mx-auto">
                    <Image 
                      src={imagePreview} 
                      alt="معاينة الصورة الشخصية" 
                      width={128} 
                      height={128} 
                      className="rounded-full object-cover border"
                      data-ai-hint="user avatar"
                    />
                     <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={clearImage}
                        className="absolute top-0 right-0 opacity-70 group-hover:opacity-100 transition-opacity h-7 w-7"
                        aria-label="إزالة الصورة"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                  </div>
                )}

                {!isCameraActive && !imagePreview && (
                    <div className="w-32 h-32 flex items-center justify-center border-2 border-dashed rounded-full text-muted-foreground bg-muted/50 mx-auto">
                        <span>لا توجد صورة</span>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Button type="button" variant="outline" onClick={startCamera} disabled={isCameraActive}>
                    <Camera className="ml-2 h-4 w-4" /> 
                    {imagePreview && !isCameraActive ? 'استبدال بالكاميرا' : 'فتح الكاميرا'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isCameraActive}>
                        <FileImage className="ml-2 h-4 w-4" />
                        {imagePreview && !isCameraActive ? 'استبدال من الجهاز' : 'اختيار من الجهاز'}
                    </Button>
                </div>
                <Input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileSelect}
                />
                 {imagePreview && !isCameraActive && (
                  <Button type="button" variant="ghost" onClick={clearImage} className="text-destructive hover:text-destructive/90 w-full sm:w-auto">
                    <XCircle className="ml-2 h-4 w-4" /> إزالة الصورة الحالية
                  </Button>
                )}
              </div>
              <FormField
                  control={form.control}
                  name="avatarUrl"
                  render={({ field }) => (
                    <Input type="hidden" {...field} />
                  )}
                />
              <FormMessage /> 
            </FormItem>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            
            <Button type="submit" className="w-full sm:w-auto" disabled={isLoading || isCameraActive}>
              {isLoading ? (isEditMode ? 'جاري الحفظ...' : 'جاري الإضافة...') : 
                <><Save className="ml-2 h-4 w-4" /> {isEditMode ? 'حفظ التعديلات' : 'إضافة المستخدم'}</>}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
