// src/components/products/ProductList.tsx
"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useProducts } from '@/contexts/ProductContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSales } from '@/contexts/SalesContext';
import { Button } from '@/components/ui/button';
// Input, PlusCircle, Search are removed as they are now in the parent page components
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Edit3, ShoppingCart, PackageSearch } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import type { Product } from '@/lib/types';

interface ProductListProps {
  searchTerm: string;
}

export default function ProductList({ searchTerm }: ProductListProps) {
  const { products } = useProducts();
  const { hasRole, currentUser } = useAuth();
  const { addSale } = useSales();
  const { toast } = useToast();

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
  };
  
  if (!isClient) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-lg border bg-card text-card-foreground shadow-sm animate-pulse">
            <div className="p-0 relative aspect-[3/4] w-full bg-muted rounded-t-lg"></div>
            <div className="p-3">
              <div className="h-5 w-3/4 bg-muted rounded-md mb-2"></div>
              <div className="h-3 w-1/2 bg-muted rounded-md mb-2"></div>
              <div className="h-5 w-1/4 bg-muted rounded-md"></div>
            </div>
            <div className="flex justify-around items-center p-1.5 border-t bg-muted/50">
              <div className="h-8 w-8 bg-muted rounded-full"></div>
              <div className="h-8 w-8 bg-muted rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Card with title and search/add button is now moved to parent pages */}
      {/* We can add a small summary card here if needed, e.g., total products found */}
      {filteredProducts.length > 0 && products && products.length > 0 && (
         <Card className="mb-6">
            <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                    تم العثور على {filteredProducts.length} منتج من إجمالي {products.length} منتجات.
                </p>
            </CardContent>
        </Card>
      )}


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
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-20 text-muted-foreground">
            <PackageSearch size={64} className="mx-auto mb-4" />
            <p className="text-lg font-semibold">لم يتم العثور على منتجات</p>
            <p className="text-sm">
                {searchTerm ? "لا توجد منتجات تطابق بحثك." : "لم يتم إضافة منتجات بعد. قم بإضافة منتج جديد للبدء."}
            </p>
          </CardContent>
        </Card>
      )}
    </>
  );
}

