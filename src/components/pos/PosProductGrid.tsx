
// src/components/pos/PosProductGrid.tsx
"use client";

import { useMemo } from 'react';
import { useProducts } from '@/contexts/ProductContext';
import { usePos } from '@/contexts/PosContext';
import { Card, CardContent } from '@/components/ui/card';
import { PackageSearch } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Product } from '@/lib/types';

export default function PosProductGrid() {
  const { products } = useProducts();
  const { addItemToCart, posSearchTerm } = usePos();
  
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(product =>
      product.name.toLowerCase().includes(posSearchTerm.toLowerCase()) && product.quantity > 0
    );
  }, [products, posSearchTerm]);

  return (
    <div className="flex flex-col h-full">
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
