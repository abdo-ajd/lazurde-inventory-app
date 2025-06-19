// src/app/dashboard/products/[id]/edit/page.tsx
"use client";

import { useState, useEffect } from 'react';
import ProductForm, { type ProductFormValues } from '@/components/products/ProductForm';
import { useProducts } from '@/contexts/ProductContext';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import type { Product } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function EditProductPage() {
  const { getProductById, updateProduct, products: allProducts } = useProducts(); // Destructure allProducts
  const router = useRouter();
  const params = useParams();
  const { hasRole } = useAuth();
  
  const [product, setProduct] = useState<Product | null | undefined>(undefined); // undefined for loading, null if not found
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingProduct, setIsFetchingProduct] = useState(true);

  const productId = typeof params.id === 'string' ? params.id : '';

  useEffect(() => {
    if (productId) {
      const fetchedProduct = getProductById(productId);
      setProduct(fetchedProduct);
      setIsFetchingProduct(false);
    } else {
        setIsFetchingProduct(false);
        setProduct(null); // No ID, so product not found
    }
  }, [productId, getProductById, allProducts]); // Added allProducts to dependency array

  if (!hasRole(['admin'])) {
    // router.replace('/dashboard');
    // return <p className="p-4">ليس لديك صلاحية الوصول لهذه الصفحة.</p>;
  }

  const handleSubmit = async (data: ProductFormValues) => {
    if (!product) return;
    setIsLoading(true);
    const updatedProduct = await updateProduct(product.id, data);
    setIsLoading(false);
    if (updatedProduct) {
      // After successful update, the useEffect above should re-fetch the product
      // due to `allProducts` changing in the context, which updates the local `product` state,
      // which in turn updates `initialData` for `ProductForm`.
      // Optionally, navigate away or confirm update.
      // For now, staying on the page to see the updated form is fine.
      // router.push(`/dashboard/products/${product.id}`); // This would navigate away
    }
  };

  if (isFetchingProduct) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-8 w-1/3" />
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    );
  }

  if (product === null) { // Explicitly null means product not found
    return (
       <div className="space-y-6 text-center py-10">
         <h1 className="text-3xl font-bold">المنتج غير موجود</h1>
         <p className="text-muted-foreground">لم نتمكن من العثور على المنتج الذي تبحث عنه.</p>
         <Button asChild>
            <Link href="/dashboard/products">العودة إلى قائمة المنتجات</Link>
         </Button>
       </div>
    );
  }
  
  // product is defined here
  if (product) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">تعديل المنتج: {product.name}</h1>
                <p className="text-muted-foreground font-body">
                قم بتحديث تفاصيل المنتج أدناه.
                </p>
            </div>
            <Button variant="outline" asChild>
            <Link href={`/dashboard/products/${product.id}`}>
                <ArrowRight className="ml-2 h-4 w-4" />
                العودة إلى تفاصيل المنتج
            </Link>
            </Button>
        </div>
        <ProductForm onSubmit={handleSubmit} initialData={product} isEditMode isLoading={isLoading} />
      </div>
    );
  }
  
  // Fallback for safety, though logic above should cover states
  return <p>جاري تحميل بيانات المنتج...</p>;
}
