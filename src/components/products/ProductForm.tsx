// src/components/products/ProductForm.tsx
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import type { Product } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription as ShadcnCardDescription } from '@/components/ui/card';
import { Save } from 'lucide-react';

const productSchema = z.object({
  name: z.string().min(1, { message: "اسم المنتج مطلوب" }),
  price: z.coerce.number().min(0, { message: "السعر يجب أن يكون رقمًا موجبًا" }),
  quantity: z.coerce.number().int().min(0, { message: "الكمية يجب أن تكون رقمًا صحيحًا موجبًا" }),
  imageUrl: z.string().url({ message: "الرجاء إدخال رابط صورة صالح" }).optional().or(z.literal('')),
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

  const handleFormSubmit = async (data: ProductFormValues) => {
    await onSubmit(data);
    if (!isEditMode) {
      form.reset(); // Reset form only if it's for adding a new product
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
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="name">اسم المنتج</FormLabel>
                  <FormControl>
                    <Input id="name" placeholder="مثال: قميص قطني" {...field} />
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
                    <Input id="price" type="number" placeholder="مثال: 150.00" {...field} step="0.01" />
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
                    <Input id="quantity" type="number" placeholder="مثال: 50" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="imageUrl">رابط صورة المنتج</FormLabel>
                  <FormControl>
                    <Input id="imageUrl" placeholder="https://example.com/image.png" {...field} />
                  </FormControl>
                  <FormDescription>
                    ضع رابطًا لصورة المنتج. يمكنك استخدام <code className="font-code">https://placehold.co/600x400.png</code> كصورة مؤقتة.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
              {isLoading ? (isEditMode ? 'جاري الحفظ...' : 'جاري الإضافة...') : 
                <><Save className="ml-2 h-4 w-4" /> {isEditMode ? 'حفظ التعديلات' : 'إضافة المنتج'}</>}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
