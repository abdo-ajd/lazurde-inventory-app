
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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { PackageSearch, ShoppingCart, Trash2, Plus, Minus, X, CreditCard, HandCoins, FileText } from 'lucide-react';
import { useProductImage } from '@/hooks/useProductImage';
import type { Product } from '@/lib/types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
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
  const {
    settings
  } = useAppSettings();
  const {
    invoice,
    addToInvoice,
    removeFromInvoice,
    updateInvoiceQuantity,
    clearInvoice,
    confirmInvoiceSale,
    currentDiscount,
    setCurrentDiscount,
  } = useSales();

  const [isClient, setIsClient] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const handleAddToInvoice = (product: Product) => {
    addToInvoice(product);
    setIsInvoiceOpen(true);
  };
  
  const handleConfirmSale = async (paymentMethod?: string) => {
    const sale = await confirmInvoiceSale(paymentMethod);
    if (sale) {
        setIsInvoiceOpen(false); // Close sheet on successful sale
    }
  };

  const invoiceSubtotal = useMemo(() => {
    return invoice.reduce((total, item) => total + item.pricePerUnit * item.quantity, 0);
  }, [invoice]);

  const finalTotal = useMemo(() => {
    return Math.max(0, invoiceSubtotal - currentDiscount);
  }, [invoiceSubtotal, currentDiscount]);

  if (!isClient) {
    return (
      <div className="space-y-6">
        <div className="flex justify-start">
            <div className="h-10 w-32 bg-muted animate-pulse rounded-md"></div>
        </div>
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
    <>
      <Sheet open={isInvoiceOpen} onOpenChange={setIsInvoiceOpen}>
        <SheetContent className="flex flex-col sm:max-w-md">
            <SheetHeader>
                <SheetTitle>فاتورة مبيعات</SheetTitle>
            </SheetHeader>
            {invoice.length > 0 ? (
                <>
                <ScrollArea className="flex-grow pr-4 -mr-6">
                    <div className="space-y-4">
                    {invoice.map(item => (
                        <div key={item.productId} className="flex items-center gap-4">
                        <div className="flex-grow">
                            <p className="font-medium text-sm">{item.productName}</p>
                            <p className="text-xs text-muted-foreground">{item.quantity} x {item.pricePerUnit} LYD</p>
                        </div>
                        <div className="flex items-center gap-1 border rounded-md">
                             <Button variant="ghost" size="icon-xs" onClick={() => updateInvoiceQuantity(item.productId, item.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                             <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
                             <Button variant="ghost" size="icon-xs" onClick={() => updateInvoiceQuantity(item.productId, item.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                        </div>
                         <Button variant="ghost" size="icon-xs" className="text-destructive" onClick={() => removeFromInvoice(item.productId)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                    ))}
                    </div>
                </ScrollArea>
                <SheetFooter className="flex flex-col space-y-4 pt-4 mt-auto border-t">
                     <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">المجموع الفرعي</span>
                        <span className="font-semibold">{invoiceSubtotal.toFixed(2)} LYD</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <label htmlFor="discount" className="text-muted-foreground">الخصم</label>
                        <Input 
                            id="discount"
                            type="number"
                            value={currentDiscount > 0 ? currentDiscount : ''}
                            onChange={(e) => setCurrentDiscount(parseFloat(e.target.value) || 0)}
                            className="w-24 h-8 text-right"
                            placeholder="0.00"
                        />
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center text-lg font-bold">
                        <span>الإجمالي</span>
                        <span>{finalTotal.toFixed(2)} LYD</span>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Button className="w-full" onClick={() => handleConfirmSale('نقدي')}>
                            <HandCoins className="ml-2 h-4 w-4" /> تأكيد البيع نقداً
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button className="w-full" variant="outline" disabled={!settings.bankServices || settings.bankServices.length === 0}>
                                    <CreditCard className="ml-2 h-4 w-4" /> بيع بخدمة مصرفية
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width)]">
                                {(settings.bankServices || []).map(service => (
                                    <DropdownMenuItem key={service.name} onSelect={() => handleConfirmSale(service.name)}>
                                        {service.name}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button className="w-full" variant="destructive" onClick={clearInvoice}>
                            <X className="ml-2 h-4 w-4" /> إلغاء الفاتورة
                        </Button>
                    </div>
                </SheetFooter>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                    <FileText size={48} className="mb-4" />
                    <p className="text-lg font-semibold">الفاتورة فارغة</p>
                    <p className="text-sm">أضف منتجات من القائمة لبدء فاتورة جديدة.</p>
                </div>
            )}
        </SheetContent>
      </Sheet>

      <div className="space-y-4">
        {hasRole(['admin', 'employee', 'employee_return']) && (
        <div className="flex justify-start">
            <Button onClick={() => {
                 if (invoice.length > 0) {
                     // If there's an invoice, just open it
                     setIsInvoiceOpen(true);
                 } else {
                     // If no invoice, clear any residual discount and open
                     clearInvoice();
                     setIsInvoiceOpen(true);
                 }
             }}>
                <ShoppingCart className="ml-2 h-4 w-4" />
                {invoice.length > 0 ? `عرض الفاتورة (${invoice.length})` : 'فاتورة جديدة'}
            </Button>
        </div>
        )}

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
                    <h3 className="font-semibold text-xs truncate" title={product.name}>{product.name}</h3>
                    <p className="text-xs font-normal text-foreground mt-1">
                        <span className="text-muted-foreground">السعر: </span>{product.price} LYD
                    </p>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                    <Badge 
                        variant={product.quantity === 0 ? "destructive" : product.quantity < 10 ? "secondary" : "default"}
                        className="text-[10px] px-1.5 py-0 leading-tight"
                        title={`الكمية: ${product.quantity}`}
                    >
                        {product.quantity}
                    </Badge>
                    
                    {hasRole(['admin', 'employee', 'employee_return']) && (
                        <Button 
                            variant="outline"
                            size="icon"
                            onClick={() => handleAddToInvoice(product)}
                            title="إضافة للفاتورة" 
                            disabled={product.quantity === 0}
                            className="h-8 w-8"
                        >
                            <ShoppingCart className="h-4 w-4" />
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
      </div>
    </>
  );
}
