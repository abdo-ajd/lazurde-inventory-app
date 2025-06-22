
// src/components/products/ProductList.tsx
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useProducts } from '@/contexts/ProductContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSales } from '@/contexts/SalesContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ShoppingCart, PackageSearch, Loader2, CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Product } from '@/lib/types';
import { useProductImage } from '@/hooks/useProductImage'; // Import the hook
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAppSettings } from '@/contexts/AppSettingsContext';

interface ProductListProps {
  searchTerm: string;
}

interface ProductCardImageProps {
  productId: string;
  productName: string;
  fallbackImageUrl: string | undefined | null;
}

const ProductCardImage: React.FC<ProductCardImageProps> = ({ productId, productName, fallbackImageUrl }) => {
  const { imageUrl: resolvedImageUrl, isLoading } = useProductImage(productId, fallbackImageUrl);

  if (isLoading) {
    return <div className="p-0 relative aspect-[3/4] w-full bg-muted rounded-t-lg animate-pulse"></div>;
  }

  return (
    <Image
      src={resolvedImageUrl || 'https://placehold.co/200x266.png'} // Use placeholder if resolved is null
      alt={productName}
      layout="fill"
      objectFit="cover"
      className="rounded-t-lg group-hover:opacity-90 transition-opacity"
      data-ai-hint="abaya product item"
      key={resolvedImageUrl || productId} // Add key to force re-render if URL changes
    />
  );
};


export default function ProductList({ searchTerm }: ProductListProps) {
  const { products } = useProducts();
  const { hasRole, currentUser } = useAuth();
  const { addSale } = useSales();
  const { settings } = useAppSettings();

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

  const handleSale = async (product: Product, paymentMethod?: string) => {
    if (!currentUser || product.quantity === 0) {
      return;
    }
    await addSale([{ productId: product.id, quantity: 1 }], paymentMethod);
  };
  
  if (!isClient) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12 gap-3">
        {[...Array(24)].map((_, i) => ( 
          <div key={i} className="rounded-lg border bg-card text-card-foreground shadow-sm animate-pulse">
            <div className="p-0 relative aspect-[3/4] w-full bg-muted rounded-t-lg"></div>
            <div className="p-3 space-y-2">
              <div className="h-5 w-3/4 bg-muted rounded-md"></div>
              <div className="h-4 w-1/2 bg-muted rounded-md"></div>
              <div className="flex justify-between items-center mt-1">
                <div className="h-5 w-1/4 bg-muted rounded-md"></div>
                <div className="h-8 w-8 bg-muted rounded-full"></div>
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
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12 gap-3">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="flex flex-col overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200">
              <Link href={`/dashboard/products/${product.id}`} passHref aria-label={`عرض تفاصيل ${product.name}`}>
                <CardHeader className="p-0 relative aspect-[3/4] w-full cursor-pointer group">
                  <ProductCardImage 
                    productId={product.id} 
                    productName={product.name} 
                    fallbackImageUrl={product.imageUrl} 
                  />
                </CardHeader>
              </Link>
              <CardContent className="p-3 flex-grow flex flex-col justify-between">
                <h3 className="font-semibold text-sm truncate" title={product.name}>{product.name}</h3>
                <div className="flex justify-between items-center mt-2">
                  <p className="font-semibold text-sm">{product.price} LYD</p>
                  
                  <div className="flex items-center gap-1">
                    <Badge 
                        variant={product.quantity === 0 ? "destructive" : product.quantity < 10 ? "secondary" : "default"}
                        className="text-[10px] px-1.5 py-0 leading-tight"
                        title={`الكمية: ${product.quantity}`}
                    >
                        {product.quantity}
                    </Badge>
                  
                    {hasRole(['admin', 'employee', 'employee_return']) && (
                      <div className="flex items-center">
                        <Button 
                          variant="ghost"
                          size="icon-sm" 
                          onClick={() => handleSale(product)}
                          title="بيع نقدي" 
                          disabled={product.quantity === 0}
                          className="hover:bg-primary/10 text-primary hover:text-primary/80"
                        >
                          <ShoppingCart className="h-4 w-4" />
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title="بيع بخدمة مصرفية"
                              disabled={product.quantity === 0 || !settings.bankServices || settings.bankServices.length === 0}
                              className="hover:bg-primary/10 text-primary hover:text-primary/80"
                            >
                              <CreditCard className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {(settings.bankServices || []).map(service => (
                              <DropdownMenuItem key={service.name} onSelect={() => handleSale(product, service.name)}>
                                {service.name}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
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
