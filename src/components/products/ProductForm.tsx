
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
import { Save, Camera, XCircle, FileImage, Barcode, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useProductImage } from '@/hooks/useProductImage'; // Import the hook

const productSchema = z.object({
  name: z.string().min(1, { message: "اسم المنتج مطلوب" }),
  price: z.coerce.number().min(0, { message: "السعر يجب أن يكون رقمًا موجبًا" }),
  quantity: z.coerce.number().int().min(0, { message: "الكمية يجب أن تكون رقمًا صحيحًا موجبًا" }),
  imageUrl: z.string().optional().or(z.literal('')), // This will store DataURI for new images, or be empty for IDB, or store external URL
  barcodeValue: z.string().optional().or(z.literal('')),
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
      imageUrl: initialData?.imageUrl || '', // Form's imageUrl holds the value to be submitted
      barcodeValue: initialData?.barcodeValue || '',
    },
  });
  const { toast } = useToast();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // For displaying existing image from IDB or initialData.imageUrl (if not a Data URI)
  const { imageUrl: existingImageUrl, isLoading: isExistingImageLoading } = useProductImage(initialData?.id, initialData?.imageUrl);
  
  // For previewing a newly selected/captured image (Data URI)
  const [newlySelectedImagePreview, setNewlySelectedImagePreview] = useState<string | null>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    // Reset form and newly selected preview if initialData changes
    form.reset({
      name: initialData?.name || '',
      price: initialData?.price || 0,
      quantity: initialData?.quantity || 0,
      imageUrl: initialData?.imageUrl || '',
      barcodeValue: initialData?.barcodeValue || '',
    });
    setNewlySelectedImagePreview(null); // Clear any new preview
  }, [initialData, form]);


  const startCamera = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        setVideoStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasCameraPermission(true);
        setIsCameraActive(true);
        setNewlySelectedImagePreview(null); // Clear any existing new preview
        form.setValue('imageUrl', ''); // Clear form value as camera will provide it
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
    // If camera is stopped without capturing, form's imageUrl should reflect initial state if any
    if (!form.getValues('imageUrl') && initialData?.imageUrl) {
        form.setValue('imageUrl', initialData.imageUrl);
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
        setNewlySelectedImagePreview(dataUri);
      }
      stopCamera();
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5 MB limit
        toast({
          variant: "destructive",
          title: "ملف كبير جدًا",
          description: "حجم الصورة يتجاوز 5 ميجابايت. الرجاء اختيار صورة أصغر.",
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = ''; 
        }
        return;
      }

      if (isCameraActive) {
        stopCamera();
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        form.setValue('imageUrl', dataUri, { shouldValidate: true, shouldDirty: true });
        setNewlySelectedImagePreview(dataUri);
      };
      reader.onerror = () => {
        toast({
          variant: "destructive",
          title: "خطأ في قراءة الملف",
          description: "لم نتمكن من قراءة ملف الصورة المحدد. حاول مرة أخرى أو اختر ملفًا آخر.",
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  const clearImage = () => {
    form.setValue('imageUrl', '', { shouldValidate: true, shouldDirty: true });
    setNewlySelectedImagePreview(null);
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

  const handleFormSubmit = async (data: ProductFormValues) => {
    await onSubmit(data);
    // No need to reset form here if it's edit mode, navigation handles it
    // For add mode, ProductContext now handles clearing form fields if desired by user
    if (!isEditMode) { // For add mode, reset the preview and file input
      setNewlySelectedImagePreview(null); 
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const currentDisplayUrl = newlySelectedImagePreview || existingImageUrl;

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
                  <FormLabel htmlFor="price">السعر (LYD)</FormLabel>
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
            <FormField
              control={form.control}
              name="barcodeValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="barcodeValue">قيمة الباركود (اختياري)</FormLabel>
                  <FormControl>
                    <div className="relative">
                       <Barcode className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                       <Input id="barcodeValue" placeholder="مثال: 1234567890123" {...field} className="pr-10" />
                    </div>
                  </FormControl>
                  <FormDescription>
                    أدخل قيمة الباركود الفريدة للمنتج إذا كانت متوفرة.
                  </FormDescription>
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
                
                {!isCameraActive && (
                  isExistingImageLoading ? (
                    <div className="w-full h-48 flex items-center justify-center border-2 border-dashed rounded-md text-muted-foreground bg-muted/50">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : currentDisplayUrl ? (
                    <div className="relative group w-full max-w-xs mx-auto">
                      <Image 
                        src={currentDisplayUrl} 
                        alt="معاينة المنتج" 
                        width={300} 
                        height={400} 
                        className="rounded-md object-contain border"
                        data-ai-hint="product abaya"
                        key={currentDisplayUrl} // Add key to force re-render if URL changes
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
                  ) : (
                      <div className="w-full h-48 flex items-center justify-center border-2 border-dashed rounded-md text-muted-foreground bg-muted/50">
                          <span>لا توجد صورة حالياً</span>
                      </div>
                  )
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Button type="button" variant="outline" onClick={startCamera} disabled={isCameraActive}>
                    <Camera className="ml-2 h-4 w-4" /> 
                    {currentDisplayUrl && !isCameraActive ? 'استبدال بالكاميرا' : 'فتح الكاميرا'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isCameraActive}>
                        <FileImage className="ml-2 h-4 w-4" />
                        {currentDisplayUrl && !isCameraActive ? 'استبدال من الجهاز' : 'اختيار من الجهاز'}
                    </Button>
                </div>
                <Input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileSelect}
                />

                 {currentDisplayUrl && !isCameraActive && (
                  <Button type="button" variant="ghost" onClick={clearImage} className="text-destructive hover:text-destructive/90 w-full sm:w-auto">
                    <XCircle className="ml-2 h-4 w-4" /> إزالة الصورة الحالية
                  </Button>
                )}
              </div>
              <FormField
                  control={form.control}
                  name="imageUrl" // This hidden field holds the DataURI if new image, or original URL/empty string
                  render={({ field }) => (
                    <Input type="hidden" {...field} />
                  )}
                />
              <FormMessage /> 
            </FormItem>
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            <Button type="submit" className="w-full sm:w-auto" disabled={isLoading || isCameraActive || isExistingImageLoading}>
              {isLoading ? (isEditMode ? 'جاري الحفظ...' : 'جاري الإضافة...') : 
                <><Save className="ml-2 h-4 w-4" /> {isEditMode ? 'حفظ التعديلات' : 'إضافة المنتج'}</>}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

