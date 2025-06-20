
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

const MAX_IMAGE_WIDTH = 800;
const MAX_IMAGE_HEIGHT = 800;
const IMAGE_QUALITY = 0.7; // For JPEG compression (0.0 to 1.0)
const MAX_FILE_SIZE_MB = 5;


// Utility function to resize and compress image
const resizeAndCompressImage = (imageSrc: string, maxWidth: number, maxHeight: number, quality: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Could not get canvas context'));
      }
      ctx.drawImage(img, 0, 0, width, height);
      // Convert to JPEG for better compression for photos
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = (errEvent: Event | string) => {
        // Handle error more gracefully
        const errorMessage = typeof errEvent === 'string' ? errEvent : (errEvent as ErrorEvent).message;
        console.error("Image load error in resize function:", errorMessage);
        reject(new Error('Failed to load image for resizing: ' + errorMessage));
    };
    img.src = imageSrc;
  });
};


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
  const canvasRef = useRef<HTMLCanvasElement>(null); // This canvas is for direct capture, not resizing
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { imageUrl: existingImageUrl, isLoading: isExistingImageLoading } = useProductImage(initialData?.id, initialData?.imageUrl);
  
  const [newlySelectedImagePreview, setNewlySelectedImagePreview] = useState<string | null>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);


  useEffect(() => {
    form.reset({
      name: initialData?.name || '',
      price: initialData?.price || 0,
      quantity: initialData?.quantity || 0,
      imageUrl: initialData?.imageUrl || '',
      barcodeValue: initialData?.barcodeValue || '',
    });
    setNewlySelectedImagePreview(null);
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
        setNewlySelectedImagePreview(null); 
        form.setValue('imageUrl', ''); 
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
    if (!form.getValues('imageUrl') && initialData?.imageUrl) {
        form.setValue('imageUrl', initialData.imageUrl);
    }
  };

  const captureImage = async () => {
    if (videoRef.current && canvasRef.current) { // canvasRef here is for initial capture
      setIsProcessingImage(true);
      const video = videoRef.current;
      const captureCanvas = canvasRef.current; // Use the dedicated canvas for capture
      captureCanvas.width = video.videoWidth;
      captureCanvas.height = video.videoHeight;
      const context = captureCanvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);
        const rawDataUri = captureCanvas.toDataURL('image/png'); // Capture as PNG first for quality
        try {
          const resizedDataUri = await resizeAndCompressImage(rawDataUri, MAX_IMAGE_WIDTH, MAX_IMAGE_HEIGHT, IMAGE_QUALITY);
          form.setValue('imageUrl', resizedDataUri, { shouldValidate: true, shouldDirty: true });
          setNewlySelectedImagePreview(resizedDataUri);
          toast({ title: "تم التقاط الصورة", description: "تم التقاط الصورة وتجهيزها." });
        } catch (error) {
          console.error("Error resizing captured image:", error);
          toast({ variant: "destructive", title: "خطأ في معالجة الصورة", description: "لم نتمكن من معالجة الصورة الملتقطة." });
          form.setValue('imageUrl', rawDataUri); // Fallback to raw if resize fails
          setNewlySelectedImagePreview(rawDataUri);
        }
      }
      stopCamera();
      setIsProcessingImage(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) { 
        toast({
          variant: "destructive",
          title: "ملف كبير جدًا",
          description: `حجم الصورة يتجاوز ${MAX_FILE_SIZE_MB} ميجابايت. الرجاء اختيار صورة أصغر.`,
        });
        if (fileInputRef.current) fileInputRef.current.value = ''; 
        return;
      }

      if (isCameraActive) stopCamera();
      setIsProcessingImage(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const rawDataUri = reader.result as string;
        try {
          const resizedDataUri = await resizeAndCompressImage(rawDataUri, MAX_IMAGE_WIDTH, MAX_IMAGE_HEIGHT, IMAGE_QUALITY);
          form.setValue('imageUrl', resizedDataUri, { shouldValidate: true, shouldDirty: true });
          setNewlySelectedImagePreview(resizedDataUri);
          toast({ title: "تم اختيار الصورة", description: "تم اختيار الصورة وتجهيزها." });
        } catch (error) {
          console.error("Error resizing selected image:", error);
          toast({ variant: "destructive", title: "خطأ في معالجة الصورة", description: "لم نتمكن من معالجة الصورة المختارة." });
           form.setValue('imageUrl', rawDataUri); // Fallback to raw if resize fails
           setNewlySelectedImagePreview(rawDataUri);
        } finally {
          setIsProcessingImage(false);
        }
      };
      reader.onerror = () => {
        toast({
          variant: "destructive",
          title: "خطأ في قراءة الملف",
          description: "لم نتمكن من قراءة ملف الصورة المحدد. حاول مرة أخرى أو اختر ملفًا آخر.",
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
        setIsProcessingImage(false);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const clearImage = () => {
    form.setValue('imageUrl', '', { shouldValidate: true, shouldDirty: true });
    setNewlySelectedImagePreview(null);
    if (isCameraActive) stopCamera();
    if (fileInputRef.current) fileInputRef.current.value = '';
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
    if (!isEditMode) {
      setNewlySelectedImagePreview(null); 
      if (fileInputRef.current) fileInputRef.current.value = '';
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
                    <Input id="name" placeholder="مثال: عباية سوداء كلاسيكية" {...field} disabled={isProcessingImage} />
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
                    <Input id="price" type="number" placeholder="مثال: 350.00" {...field} step="0.01" disabled={isProcessingImage} />
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
                    <Input id="quantity" type="number" placeholder="مثال: 10" {...field} disabled={isProcessingImage} />
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
                       <Input id="barcodeValue" placeholder="مثال: 1234567890123" {...field} className="pr-10" disabled={isProcessingImage} />
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
                        <Button type="button" onClick={captureImage} className="w-full" disabled={isProcessingImage}>
                        {isProcessingImage ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Camera className="ml-2 h-4 w-4" />}
                         {isProcessingImage ? 'جاري المعالجة...' : 'التقاط صورة'}
                        </Button>
                        <Button type="button" variant="outline" onClick={stopCamera} className="w-full" disabled={isProcessingImage}>
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
                  isExistingImageLoading || isProcessingImage ? (
                    <div className="w-full h-48 flex items-center justify-center border-2 border-dashed rounded-md text-muted-foreground bg-muted/50">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                       <span className="ml-2">{isProcessingImage ? "جاري معالجة الصورة..." : "جاري تحميل الصورة الحالية..."}</span>
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
                        key={currentDisplayUrl}
                      />
                       <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={clearImage}
                          className="absolute top-2 right-2 opacity-70 group-hover:opacity-100 transition-opacity"
                          aria-label="إزالة الصورة"
                          disabled={isProcessingImage}
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
                    <Button type="button" variant="outline" onClick={startCamera} disabled={isCameraActive || isProcessingImage}>
                    <Camera className="ml-2 h-4 w-4" /> 
                    {currentDisplayUrl && !isCameraActive ? 'استبدال بالكاميرا' : 'فتح الكاميرا'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isCameraActive || isProcessingImage}>
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
                    disabled={isProcessingImage}
                />

                 {currentDisplayUrl && !isCameraActive && (
                  <Button type="button" variant="ghost" onClick={clearImage} className="text-destructive hover:text-destructive/90 w-full sm:w-auto" disabled={isProcessingImage}>
                    <XCircle className="ml-2 h-4 w-4" /> إزالة الصورة الحالية
                  </Button>
                )}
              </div>
              <FormField
                  control={form.control}
                  name="imageUrl" 
                  render={({ field }) => (
                    <Input type="hidden" {...field} />
                  )}
                />
              <FormMessage /> 
            </FormItem>
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            <Button type="submit" className="w-full sm:w-auto" disabled={isLoading || isCameraActive || isExistingImageLoading || isProcessingImage}>
              {isLoading || isProcessingImage ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Save className="ml-2 h-4 w-4" />}
              {isLoading ? (isEditMode ? 'جاري الحفظ...' : 'جاري الإضافة...') : isProcessingImage ? 'جاري معالجة الصورة...' : (isEditMode ? 'حفظ التعديلات' : 'إضافة المنتج')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
