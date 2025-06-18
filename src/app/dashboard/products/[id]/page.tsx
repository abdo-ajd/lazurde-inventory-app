
// src/app/dashboard/products/[id]/page.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useProducts } from '@/contexts/ProductContext';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Edit3, Package, Tag, DollarSign, Layers, CalendarDays, History, Trash2, ShoppingBag } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Product } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as ShadcnDialogDescription, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useSales } from '@/contexts/SalesContext'; // Import useSales

export default function ProductDetailsPage() {
  const { getProductById, deleteProduct } = useProducts();
  const { sales } = useSales(); // Get sales data
  const params = useParams();
  const router = useRouter();
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null | undefined>(undefined);
  const [isFetching, setIsFetching] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const productId = typeof params.id === 'string' ? params.id : '';

  useEffect(() => {
    if (productId) {
      const fetchedProduct = getProductById(productId);
      setProduct(fetchedProduct);
    }
    setIsFetching(false);
  }, [productId, getProductById]);

  const quantitySold = useMemo(() => {
    if (!product || !sales) return 0;
    return sales.reduce((total, sale) => {
      if (sale.status === 'active') { // Consider only active sales for sold quantity
        sale.items.forEach(item => {
          if (item.productId === product.id) {
            total += item.quantity;
          }
        });
      }
      return total;
    }, 0);
  }, [product, sales]);

  const handleDeleteProduct = async () => {
    if (!product) return;
    setIsDeleting(true);
    const success = await deleteProduct(product.id);
    setIsDeleting(false);
    if (success) {
      toast({title: "تم الحذف", description: `تم حذف المنتج "${product.name}" بنجاح.`});
      router.push('/dashboard/products');
    } else {
      // Error toast is handled by deleteProduct in context
    }
  };

  if (isFetching) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-96 w-full md:w-1/2 mx-auto mb-6 rounded-lg" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-1/4" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(5)].map((_, i) => ( // Increased to 5 for the new field
              <div key={i} className="flex items-center space-x-reverse space-x-3">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-6 w-1/2" />
              </div>
            ))}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Skeleton className="h-10 w-24" />
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
    if (!isoString) return 'N/A';
    try {
      return new Intl.DateTimeFormat('en-GB', { 
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric',
        hour12: true 
      }).format(new Date(isoString));
    } catch (e) {
      return 'Invalid Date';
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
           <Card className="shadow-lg overflow-hidden">
             <CardHeader className="p-0 relative aspect-[3/4] w-full">
                <Image
                    src={product.imageUrl || 'https://placehold.co/300x450.png'}
                    alt={product.name}
                    layout="fill"
                    objectFit="cover"
                    data-ai-hint="abaya product detail"
                />
             </CardHeader>
             <CardContent className="p-4">
                <h3 className="font-semibold text-lg text-center">{product.name}</h3>
             </CardContent>
           </Card>
        </div>

        <div className="md:col-span-2">
            <Card className="shadow-lg h-full">
                <CardHeader>
                <CardTitle className="flex items-center">
                    <Tag className="mr-2 text-accent" />
                    معلومات المنتج
                </CardTitle>
                <CardDescription>معرف المنتج: {product.id}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 sm:grid-cols-2">
                <div className="flex items-start space-x-3 space-x-reverse">
                    <DollarSign className="h-5 w-5 mt-1 text-primary shrink-0" />
                    <div>
                    <p className="text-sm text-muted-foreground">السعر</p>
                    <p className="font-semibold text-lg">{product.price.toFixed(2)} LYD</p>
                    </div>
                </div>
                <div className="flex items-start space-x-3 space-x-reverse">
                    <Layers className="h-5 w-5 mt-1 text-primary shrink-0" />
                    <div>
                    <p className="text-sm text-muted-foreground">الكمية المتوفرة</p>
                    <Badge variant={product.quantity === 0 ? "destructive" : product.quantity < 10 ? "secondary" : "default"} className="text-lg px-3 py-1">
                        {product.quantity}
                    </Badge>
                    </div>
                </div>
                <div className="flex items-start space-x-3 space-x-reverse">
                    <ShoppingBag className="h-5 w-5 mt-1 text-primary shrink-0" />
                    <div>
                    <p className="text-sm text-muted-foreground">الكمية المباعة</p>
                    <p className="font-semibold text-lg">{quantitySold}</p>
                    </div>
                </div>
                <div className="flex items-start space-x-3 space-x-reverse">
                    <CalendarDays className="h-5 w-5 mt-1 text-primary shrink-0" />
                    <div>
                    <p className="text-sm text-muted-foreground">تاريخ الإنشاء</p>
                    <p className="font-semibold">{formatDateTime(product.createdAt)}</p>
                    </div>
                </div>
                <div className="flex items-start space-x-3 space-x-reverse">
                    <History className="h-5 w-5 mt-1 text-primary shrink-0" />
                    <div>
                    <p className="text-sm text-muted-foreground">آخر تحديث</p>
                    <p className="font-semibold">{formatDateTime(product.updatedAt)}</p>
                    </div>
                </div>
                </CardContent>
                {hasRole(['admin']) && (
                <CardFooter className="flex justify-start gap-2">
                    <Button asChild>
                      <Link href={`/dashboard/products/${product.id}/edit`}>
                          <Edit3 className="ml-2 h-4 w-4" /> تعديل المنتج
                      </Link>
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="destructive" disabled={isDeleting}>
                          <Trash2 className="ml-2 h-4 w-4" /> {isDeleting ? 'جاري الحذف...' : 'حذف المنتج'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>تأكيد الحذف</DialogTitle>
                          <ShadcnDialogDescription>
                            هل أنت متأكد أنك تريد حذف المنتج "{product.name}"؟ لا يمكن التراجع عن هذا الإجراء.
                          </ShadcnDialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-2 sm:justify-start">
                          <DialogClose asChild>
                            <Button type="button" variant="secondary" disabled={isDeleting}>إلغاء</Button>
                          </DialogClose>
                          <Button type="button" variant="destructive" onClick={handleDeleteProduct} disabled={isDeleting}>
                            {isDeleting ? 'جاري الحذف...' : 'حذف'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                </CardFooter>
                )}
            </Card>
        </div>
      </div>
    </div>
  );
}

