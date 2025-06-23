
// src/components/products/ProductList.tsx
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useProducts } from '@/contexts/ProductContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSales } from '@/contexts/SalesContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PackageSearch, CreditCard, HandCoins } from 'lucide-react';
import { useProductImage } from '@/hooks/useProductImage';
import type { Product } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


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
      src={resolvedImageUrl || 'https://placehold.co/200x266.png'}
      alt={productName}
      layout="fill"
      objectFit="cover"
      className="rounded-t-lg group-hover:opacity-90 transition-opacity"
      data-ai-hint="abaya product item"
      key={resolvedImageUrl || productId}
    />
  );
};


export default function ProductList({ searchTerm }: ProductListProps) {
  const { products } = useProducts();
  const { hasRole } = useAuth();
  const { settings } = useAppSettings();
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

  const handleSale = async (product: Product, paymentMethod: string) => {
    if (product.quantity > 0) {
      await addSale([{ productId: product.id, quantity: 1 }], paymentMethod);
    }
  };
  

  if (!isClient) {
    return (
      <div className="space-y-6">
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
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
              <CardContent className="p-3 flex-grow flex flex-col">
                <div className="flex-grow">
                  <h3 className="font-semibold text-sm truncate" title={product.name}>{product.name}</h3>
                  <div className="flex justify-between items-center mt-1">
                      <p className="text-xs font-normal text-foreground">
                        السعر: {product.price}
                      </p>
                      <Badge 
                        variant={product.quantity === 0 ? "destructive" : product.quantity < 10 ? "secondary" : "default"}
                        className="text-[10px] px-1.5 py-0 leading-tight"
                        title={`الكمية: ${product.quantity}`}
                      >
                        {product.quantity}
                      </Badge>
                  </div>
                </div>
                <div className="flex justify-center items-center mt-2 gap-2">
                  {hasRole(['admin', 'employee', 'employee_return']) && (
                    <>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="outline"
                            size="default"
                            disabled={product.quantity === 0 || !settings.bankServices || settings.bankServices.length === 0}
                            className="border-secondary text-secondary-foreground hover:bg-secondary/80 flex-1 h-auto p-2"
                            title="بيع بخدمة مصرفية"
                          >
                            <CreditCard className="h-5 w-5"/>
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
                      <Button 
                        variant="outline"
                        size="default"
                        onClick={() => handleSale(product, 'نقدي')}
                        title="بيع نقدي"
                        disabled={product.quantity === 0}
                        className="flex-1 h-auto p-2"
                      >
                        <HandCoins className="h-5 w-5"/>
                      </Button>
                    </>
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
    </div>
  );
}
