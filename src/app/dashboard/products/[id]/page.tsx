// src/app/dashboard/products/[id]/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useProducts } from '@/contexts/ProductContext';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Edit3, Package, Tag, DollarSign, Layers, CalendarDays, History } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Product } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

export default function ProductDetailsPage() {
  const { getProductById } = useProducts();
  const params = useParams();
  const router = useRouter();
  const { hasRole } = useAuth();
  const [product, setProduct] = useState<Product | null | undefined>(undefined);
  const [isFetching, setIsFetching] = useState(true);

  const productId = typeof params.id === 'string' ? params.id : '';

  useEffect(() => {
    if (productId) {
      const fetchedProduct = getProductById(productId);
      setProduct(fetchedProduct);
    }
    setIsFetching(false);
  }, [productId, getProductById]);

  if (isFetching) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-3/4" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-1/4" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center space-x-reverse space-x-3">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-6 w-1/2" />
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-24" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-10">
        <Package size={64} className="mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold">المنتج غير موجود</h1>
        <p className="text-muted-foreground mb-6">عذرًا، لم نتمكن من العثور على المنتج الذي طلبته.</p>
        <Button asChild>
          <Link href="/dashboard/products">
            <ArrowRight className="ml-2 h-4 w-4" />
            العودة إلى قائمة المنتجات
          </Link>
        </Button>
      </div>
    );
  }

  const formatDateTime = (isoString: string) => {
    if (!isoString) return 'غير متوفر';
    try {
      return new Intl.DateTimeFormat('ar-SA', { 
        dateStyle: 'medium', 
        timeStyle: 'short',
        hour12: true
      }).format(new Date(isoString));
    } catch (e) {
      return 'تاريخ غير صالح';
    }
  };

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center">
                    <Package className="mr-3 text-primary" size={32} /> {product.name}
                </h1>
                <p className="text-muted-foreground font-body">
                تفاصيل المنتج الكاملة.
                </p>
            </div>
             <Button variant="outline" asChild>
                <Link href="/dashboard/products">
                    <ArrowRight className="ml-2 h-4 w-4" />
                    العودة إلى القائمة
                </Link>
            </Button>
        </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Tag className="mr-2 text-accent" />
            معلومات المنتج
          </CardTitle>
          <CardDescription>معرف المنتج: {product.id}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="flex items-start space-x-3 space-x-reverse">
            <DollarSign className="h-5 w-5 mt-1 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">السعر</p>
              <p className="font-semibold text-lg">{product.price.toFixed(2)} ر.س</p>
            </div>
          </div>
          <div className="flex items-start space-x-3 space-x-reverse">
            <Layers className="h-5 w-5 mt-1 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">الكمية المتوفرة</p>
              <Badge variant={product.quantity === 0 ? "destructive" : product.quantity < 10 ? "secondary" : "default"} className="text-lg px-3 py-1">
                {product.quantity}
              </Badge>
            </div>
          </div>
          <div className="flex items-start space-x-3 space-x-reverse">
            <CalendarDays className="h-5 w-5 mt-1 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">تاريخ الإنشاء</p>
              <p className="font-semibold">{formatDateTime(product.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-start space-x-3 space-x-reverse">
            <History className="h-5 w-5 mt-1 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">آخر تحديث</p>
              <p className="font-semibold">{formatDateTime(product.updatedAt)}</p>
            </div>
          </div>
        </CardContent>
        {hasRole(['admin']) && (
          <CardFooter>
            <Button asChild>
              <Link href={`/dashboard/products/${product.id}/edit`}>
                <Edit3 className="ml-2 h-4 w-4" /> تعديل المنتج
              </Link>
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
