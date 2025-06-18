// src/components/products/ProductList.tsx
"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useProducts } from '@/contexts/ProductContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSales } from '@/contexts/SalesContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { PlusCircle, Search, Edit3, ShoppingCart } from 'lucide-react'; // Removed Trash2, Eye
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import type { Product } from '@/lib/types';

export default function ProductList() {
  const { products } = useProducts(); // Removed deleteProduct
  const { hasRole, currentUser } = useAuth();
  const { addSale } = useSales();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const handleQuickSell = async (product: Product) => {
    if (!currentUser) {
      toast({ title: "خطأ", description: "يجب تسجيل الدخول أولاً لإتمام عملية البيع.", variant: "destructive" });
      return;
    }
    if (product.quantity === 0) {
      toast({ title: "نفذت الكمية", description: `عفواً، لا توجد كمية متوفرة من المنتج "${product.name}".`, variant: "destructive" });
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const saleResult = await addSale([{ productId: product.id, quantity: 1 }]);
    // Toast removed as per user request
    // if (saleResult) {
    //   toast({ title: "تم البيع بنجاح", description: `تم بيع قطعة واحدة من المنتج "${product.name}".` });
    // } 
  };
  
  if (!isClient) {
    return (
      <Card>
        <CardHeader>
          <div className="h-8 w-1/2 bg-muted animate-pulse rounded-md"></div>
          <div className="h-6 w-1/3 bg-muted animate-pulse rounded-md mt-2"></div>
        </CardHeader>
        <CardContent>
          <div className="h-10 w-full bg-muted animate-pulse rounded-md mb-4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="p-0 relative aspect-[3/4] w-full bg-muted animate-pulse rounded-t-lg"></div>
                <div className="p-4">
                  <div className="h-5 w-3/4 bg-muted animate-pulse rounded-md mb-2"></div>
                  <div className="h-3 w-1/2 bg-muted animate-pulse rounded-md mb-2"></div>
                  <div className="h-5 w-1/4 bg-muted animate-pulse rounded-md"></div>
                </div>
                <div className="flex justify-around items-center p-2 border-t">
                  <div className="h-8 w-8 bg-muted animate-pulse rounded-full"></div>
                  <div className="h-8 w-8 bg-muted animate-pulse rounded-full"></div>
                  <div className="h-8 w-8 bg-muted animate-pulse rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>قائمة المنتجات</CardTitle>
            <CardDescription>إجمالي المنتجات: {products?.length || 0}</CardDescription>
          </div>
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="ابحث عن منتج..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10"
                aria-label="البحث عن منتج"
              />
            </div>
            {hasRole(['admin']) && (
              <Button asChild className="w-full md:w-auto">
                <Link href="/dashboard/products/add">
                  <PlusCircle className="ml-2 h-4 w-4" /> إضافة منتج
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
              <Link href={`/dashboard/products/${product.id}`} passHref aria-label={`عرض تفاصيل ${product.name}`}>
                <CardHeader className="p-0 relative aspect-[3/4] w-full cursor-pointer group">
                  <Image
                    src={product.imageUrl || 'https://placehold.co/300x450.png'} 
                    alt={product.name}
                    layout="fill"
                    objectFit="cover"
                    className="rounded-t-lg group-hover:opacity-90 transition-opacity"
                    data-ai-hint="abaya product item"
                  />
                </CardHeader>
              </Link>
              <CardContent className="pt-3 pb-2 px-3 flex-grow">
                <h3 className="font-semibold text-sm truncate" title={product.name}>{product.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">السعر: {product.price.toFixed(2)} ر.س</p>
                <Badge 
                  variant={product.quantity === 0 ? "destructive" : product.quantity < 10 ? "secondary" : "default"}
                  className="mt-1.5 text-xs px-2 py-0.5"
                >
                  الكمية: {product.quantity}
                </Badge>
              </CardContent>
              <CardFooter className="flex justify-around items-center p-1.5 border-t bg-muted/50">
                {hasRole(['admin']) && (
                  <Button variant="ghost" size="icon" asChild title="تعديل المنتج">
                    <Link href={`/dashboard/products/${product.id}/edit`}>
                      <Edit3 className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
                {hasRole(['admin', 'employee', 'employee_return']) && (
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => handleQuickSell(product)}
                    title="بيع قطعة واحدة" 
                    disabled={product.quantity === 0}
                    className="hover:bg-primary/10"
                  >
                    <ShoppingCart className="h-4 w-4" />
                  </Button>
                )}
                {/* Delete button and view button removed from here */}
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-20 text-muted-foreground">
            <Search size={48} className="mx-auto mb-4" />
            <p className="text-lg">لا توجد منتجات تطابق بحثك أو لم يتم إضافة منتجات بعد.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
