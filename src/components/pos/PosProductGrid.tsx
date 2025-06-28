// src/components/pos/PosProductGrid.tsx
"use client";

import { useState, useMemo, useRef, useEffect, KeyboardEvent } from 'react';
import { useProducts } from '@/contexts/ProductContext';
import { usePos } from '@/contexts/PosContext';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, PackageSearch, Barcode as BarcodeIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function PosProductGrid() {
  const { products, getProductByBarcode } = useProducts();
  const { addItemToCart } = usePos();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [scannedBarcode, setScannedBarcode] = useState('');
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  const handleBarcodeScan = () => {
    if (!scannedBarcode.trim()) return;

    const product = getProductByBarcode(scannedBarcode.trim());
    if (product) {
      addItemToCart(product);
    } else {
      toast({
        variant: "destructive",
        title: "لم يتم العثور على المنتج",
        description: "الباركود المدخل غير صحيح أو المنتج غير موجود.",
      });
    }
    setScannedBarcode('');
    barcodeInputRef.current?.focus();
  };

  const handleBarcodeKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleBarcodeScan();
    }
  };

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) && product.quantity > 0
    );
  }, [products, searchTerm]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 md:flex-none md:w-60">
          <BarcodeIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            ref={barcodeInputRef}
            type="text"
            placeholder="امسح باركود..."
            value={scannedBarcode}
            onChange={(e) => setScannedBarcode(e.target.value)}
            onKeyDown={handleBarcodeKeyDown}
            className="w-full pr-10"
            aria-label="امسح باركود المنتج"
          />
        </div>
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="أو ابحث عن منتج بالاسم..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10"
            aria-label="ابحث عن منتج"
          />
        </div>
      </div>
      
      {filteredProducts.length > 0 ? (
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <Card 
                key={product.id} 
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => addItemToCart(product)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && addItemToCart(product)}
                tabIndex={0}
              >
                <CardContent className="p-4 text-center">
                  <h3 className="font-semibold text-sm truncate">{product.name}</h3>
                  <p className="text-muted-foreground text-xs mt-1">{product.price} LYD</p>
                  <Badge variant="secondary" className="mt-2 text-xs">
                    المتوفر: {product.quantity}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
          <PackageSearch size={48} className="mb-2" />
          <p>لا توجد منتجات مطابقة.</p>
        </div>
      )}
    </div>
  );
}
