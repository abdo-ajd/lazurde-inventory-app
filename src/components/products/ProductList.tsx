// src/components/products/ProductList.tsx
"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useProducts } from '@/contexts/ProductContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSales } from '@/contexts/SalesContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ShoppingCart, PackageSearch } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Product } from '@/lib/types';

interface ProductListProps {
  searchTerm: string;
}

export default function ProductList({ searchTerm }: ProductListProps) {
  const { products } = useProducts();
  const { hasRole, currentUser } = useAuth();
  const { addSale } = useSales();

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
      return;
    }
    if (product.quantity === 0) {
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const saleResult = await addSale([{ productId: product.id, quantity: 1 }]);
    // Toast after quick sell removed as per request
  };
  
  if (!isClient) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-lg border bg-card text-card-foreground shadow-sm animate-pulse">
            <div className="p-0 relative aspect-[3/4] w-full bg-muted rounded-t-lg"></div>
            <div className="p-3 space-y-1">
              <div className="h-5 w-3/4 bg-muted rounded-md mb-1"></div>
              <div className="h-3 w-1/2 bg-muted rounded-md mb-1"></div>
              <div className="flex justify-between items-center">
                <div className="h-5 w-1/4 bg-muted rounded-md"></div>
                <div className="h-7 w-7 bg-muted rounded-full"></div> {/* Placeholder for moved sell icon */}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
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
              <CardContent className="pt-3 pb-2 px-3 flex-grow flex flex-col">
                <h3 className="font-semibold text-sm truncate flex-grow" title={product.name}>{product.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">السعر: {product.price.toFixed(2)} ر.س</p>
                <div className="flex justify-between items-center mt-1.5">
                  <Badge 
                    variant={product.quantity === 0 ? "destructive" : product.quantity < 10 ? "secondary" : "default"}
                    className="text-xs px-2 py-0.5"
                  >
                    الكمية: {product.quantity}
                  </Badge>
                  {hasRole(['admin', 'employee', 'employee_return']) && (
                    <Button 
                      variant="ghost"
                      size="icon" 
                      onClick={() => handleQuickSell(product)}
                      title="بيع قطعة واحدة" 
                      disabled={product.quantity === 0}
                      className="hover:bg-primary/10 h-7 w-7 text-primary hover:text-primary/80"
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
              {/* CardFooter (toolbox) removed */}
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
