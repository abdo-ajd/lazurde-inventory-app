// src/components/products/ProductForm.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import type { Product } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription as ShadcnCardDescription } from '@/components/ui/card';
import { Save, Camera, XCircle } from 'lucide-react';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

const productSchema = z.object({
  name: z.string().min(1, { message: "اسم المنتج مطلوب" }),
  price: z.coerce.number().min(0, { message: "السعر يجب أن يكون رقمًا موجبًا" }),
  quantity: z.coerce.number().int().min(0, { message: "الكمية يجب أن تكون رقمًا صحيحًا موجبًا" }),
  imageUrl: z.string().optional().or(z.literal('')), // Can be a data URI or empty
});

export type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  onSubmit: (data: ProductFormValues) => Promise<void>;
  initialData?: Product | null;
  isEditMode?: boolean;
  isLoading?: boolean;
}

export default function ProductForm({ onSubmit, initialData, isEditMode = false, isLoading = false }: ProductFormProps) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name || '',
      price: initialData?.price || 0,
      quantity: initialData?.quantity || 0,
      imageUrl: initialData?.imageUrl || '',
    },
  });
  const { toast } = useToast();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.imageUrl || null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    // Update preview if initialData changes
    setImagePreview(initialData?.imageUrl || null);
    form.setValue('imageUrl', initialData?.imageUrl || '');
  }, [initialData?.imageUrl, form]);

  const startCamera = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setVideoStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasCameraPermission(true);
        setIsCameraActive(true);
        setImagePreview(null); // Clear existing preview when camera opens
        form.setValue('imageUrl', ''); // Clear form value for image
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
    // If an image was previously set (e.g. initialData), restore it.
    // Or, if user cancels without taking a new photo, they might expect the old one.
    // For now, we keep it cleared or let them re-upload/re-capture.
    // If form.getValues('imageUrl') is empty and initialData.imageUrl exists, they might want it back.
    // This logic can be refined based on desired UX.
    const currentFormUrl = form.getValues('imageUrl');
    if (!currentFormUrl && initialData?.imageUrl) {
      setImagePreview(initialData.imageUrl);
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
        form.setValue('imageUrl', dataUri, { shouldValidate: true, shouldDirty: true });
        setImagePreview(dataUri);
      }
      stopCamera();
    }
  };
  
  const clearImage = () => {
    form.setValue('imageUrl', '', { shouldValidate: true, shouldDirty: true });
    setImagePreview(null);
    if (isCameraActive) {
      stopCamera();
    }
  };

  useEffect(() => {
    // Cleanup: stop camera when component unmounts or camera is no longer active
    return () => {
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [videoStream]);


  const handleFormSubmit = async (data: ProductFormValues) => {
    await onSubmit(data);
    if (!isEditMode) {
      form.reset(); 
      setImagePreview(null); // Clear preview on successful add
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? 'تعديل المنتج' : 'إضافة منتج جديد'}</CardTitle>
        <ShadcnCardDescription>
          {isEditMode ? 'قم بتحديث تفاصيل المنتج أدناه.' : 'أدخل تفاصيل المنتج الجديد ليتم إضافته إلى المخزون.'}
        </ShadcnCardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="name">اسم المنتج</FormLabel>
                  <FormControl>
                    <Input id="name" placeholder="مثال: عباية سوداء كلاسيكية" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="price">السعر</FormLabel>
                  <FormControl>
                    <Input id="price" type="number" placeholder="مثال: 350.00" {...field} step="0.01" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="quantity">الكمية المتوفرة</FormLabel>
                  <FormControl>
                    <Input id="quantity" type="number" placeholder="مثال: 10" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormItem>
              <FormLabel>صورة المنتج</FormLabel>
              <div className="space-y-4">
                {isCameraActive && hasCameraPermission && (
                  <div className="border rounded-md p-4 space-y-3">
                    <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted playsInline />
                    <Button type="button" onClick={captureImage} className="w-full">
                      <Camera className="ml-2 h-4 w-4" /> التقاط صورة
                    </Button>
                    <Button type="button" variant="outline" onClick={stopCamera} className="w-full">
                      إلغاء الكاميرا
                    </Button>
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
                  <div className="relative group w-full max-w-xs mx-auto">
                    <Image 
                      src={imagePreview} 
                      alt="معاينة المنتج" 
                      width={300} 
                      height={400} 
                      className="rounded-md object-contain border"
                      data-ai-hint="product abaya"
                    />
                     <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={clearImage}
                        className="absolute top-2 right-2 opacity-70 group-hover:opacity-100 transition-opacity"
                        aria-label="إزالة الصورة"
                      >
                        <XCircle className="h-5 w-5" />
                      </Button>
                  </div>
                )}

                {!isCameraActive && !imagePreview && (
                    <div className="w-full h-48 flex items-center justify-center border-2 border-dashed rounded-md text-muted-foreground bg-muted/50">
                        <span>لا توجد صورة حالياً</span>
                    </div>
                )}

                <Button type="button" variant="outline" onClick={startCamera} disabled={isCameraActive}>
                  <Camera className="ml-2 h-4 w-4" /> 
                  {imagePreview ? 'استبدال الصورة بالكاميرا' : 'إضافة صورة بالكاميرا'}
                </Button>
                 {imagePreview && !isCameraActive && (
                  <Button type="button" variant="ghost" onClick={clearImage} className="text-destructive hover:text-destructive/90">
                    <XCircle className="ml-2 h-4 w-4" /> إزالة الصورة الحالية
                  </Button>
                )}
              </div>
              <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    // This input is hidden, its value is controlled by camera/clear buttons
                    <Input type="hidden" {...field} />
                  )}
                />
              <FormMessage /> {/* For imageUrl field errors if any */}
            </FormItem>
            <canvas ref={canvasRef} style={{ display: 'none' }} />


            <Button type="submit" className="w-full sm:w-auto" disabled={isLoading || isCameraActive}>
              {isLoading ? (isEditMode ? 'جاري الحفظ...' : 'جاري الإضافة...') : 
                <><Save className="ml-2 h-4 w-4" /> {isEditMode ? 'حفظ التعديلات' : 'إضافة المنتج'}</>}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
