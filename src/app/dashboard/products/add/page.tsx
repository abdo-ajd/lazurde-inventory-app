// src/app/dashboard/products/add/page.tsx
"use client";

import { useState } from 'react';
import ProductForm, { type ProductFormValues } from '@/components/products/ProductForm';
import { useProducts } from '@/contexts/ProductContext';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AddProductPage() {
  const { addProduct } = useProducts();
  const router = useRouter();
  const { hasRole } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  if (!hasRole(['admin'])) {
    // This should ideally be handled by a higher-level route guard in layout
    // or middleware, but can be a fallback.
    // router.replace('/dashboard'); 
    // return <p className="p-4">ليس لديك صلاحية الوصول لهذه الصفحة.</p>;
    // For now, assume layout handles this.
  }

  const handleSubmit = async (data: ProductFormValues) => {
    setIsLoading(true);
    const newProduct = await addProduct(data);
    setIsLoading(false);
    if (newProduct) {
      router.push('/dashboard'); // Navigate to the main product image listing page
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">إضافة منتج جديد</h1>
            <p className="text-muted-foreground font-body">
            املأ النموذج أدناه لإضافة منتج جديد إلى مخزونك.
            </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/products">
            <ArrowRight className="ml-2 h-4 w-4" />
            العودة إلى قائمة المنتجات
          </Link>
        </Button>
      </div>
      <ProductForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
}

