// src/components/pos/PosProductGrid.tsx
"use client";

import { useState, useMemo } from 'react';
import { useProducts } from '@/contexts/ProductContext';
import { usePos } from '@/contexts/PosContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, PackageSearch } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Product } from '@/lib/types';

export default function PosProductGrid() {
  const { products } = useProducts();
  const { addItemToCart } = usePos();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) && product.quantity > 0
    );
  }, [products, searchTerm]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="ابحث عن منتج..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10"
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
