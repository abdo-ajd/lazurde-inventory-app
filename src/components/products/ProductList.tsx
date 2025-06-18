
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3">
        {[...Array(14)].map((_, i) => ( // Increased skeleton items
          <div key={i} className="rounded-lg border bg-card text-card-foreground shadow-sm animate-pulse">
            <div className="p-0 relative aspect-[3/4] w-full bg-muted rounded-t-lg"></div>
            <div className="p-2 space-y-1">
              <div className="h-4 w-3/4 bg-muted rounded-md mb-1"></div>
              <div className="h-3 w-1/2 bg-muted rounded-md mb-1"></div>
              <div className="flex justify-between items-center">
                <div className="h-4 w-1/4 bg-muted rounded-md"></div>
                <div className="h-6 w-6 bg-muted rounded-full"></div>
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="flex flex-col overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200">
              <Link href={`/dashboard/products/${product.id}`} passHref aria-label={`عرض تفاصيل ${product.name}`}>
                <CardHeader className="p-0 relative aspect-[3/4] w-full cursor-pointer group">
                  <Image
                    src={product.imageUrl || 'https://placehold.co/200x266.png'} 
                    alt={product.name}
                    layout="fill"
                    objectFit="cover"
                    className="rounded-t-lg group-hover:opacity-90 transition-opacity"
                    data-ai-hint="abaya product item"
                  />
                </CardHeader>
              </Link>
              <CardContent className="pt-2 pb-1.5 px-2 flex-grow flex flex-col">
                <h3 className="font-semibold text-xs truncate flex-grow" title={product.name}>{product.name}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">السعر: {product.price} LYD</p>
                <div className="flex justify-between items-center mt-1">
                  <Badge 
                    variant={product.quantity === 0 ? "destructive" : product.quantity < 10 ? "secondary" : "default"}
                    className="text-[10px] px-1.5 py-0 leading-tight"
                  >
                    الكمية: {product.quantity}
                  </Badge>
                  {hasRole(['admin', 'employee', 'employee_return']) && (
                    <Button 
                      variant="ghost"
                      size="icon-xs" 
                      onClick={() => handleQuickSell(product)}
                      title="بيع قطعة واحدة" 
                      disabled={product.quantity === 0}
                      className="hover:bg-primary/10 h-6 w-6 text-primary hover:text-primary/80"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
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

