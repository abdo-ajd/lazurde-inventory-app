// src/components/pos/PosProductGrid.tsx
"use client";

import { useMemo, useState, useEffect } from 'react';
import { useProducts } from '@/contexts/ProductContext';
import { usePos } from '@/contexts/PosContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PackageSearch, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Product } from '@/lib/types';
import { hexToRgba, cn } from '@/lib/utils'; // Import the new utility

// Helper function to determine if a hex color is dark
function isColorDark(hexColor?: string): boolean {
  if (!hexColor || !hexColor.startsWith('#')) return false;
  try {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    // Using the HSP (Highly Sensitive Poo) luminance formula
    const hsp = Math.sqrt(
      0.299 * (r * r) +
      0.587 * (g * g) +
      0.114 * (b * b)
    );
    // hsp > 127.5 is considered light, <= 127.5 is considered dark
    return hsp <= 127.5;
  } catch (e) {
    return false; // Return false if color is invalid
  }
}

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
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {filteredProducts.map((product) => {
              const isDark = isColorDark(product.color);
              const bgColor = product.color ? hexToRgba(product.color, 0.4) : undefined;

              return (
                <Card 
                  key={product.id} 
                  className="cursor-pointer hover:border-primary transition-all duration-200"
                  onClick={() => addItemToCart(product)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && addItemToCart(product)}
                  tabIndex={0}
                  style={bgColor ? { backgroundColor: bgColor } : {}}
                >
                  <CardContent className="p-4 text-center">
                    <h3 
                      className="font-semibold text-sm truncate"
                      style={isDark ? { color: 'white' } : {}}
                    >
                      {product.name}
                    </h3>
                    <p 
                      className="text-xs mt-1"
                      style={isDark ? { color: 'rgba(255,255,255,0.8)' } : { color: 'hsl(var(--muted-foreground))' }}
                    >
                      {product.price} LYD
                    </p>
                    <Badge 
                      variant={isDark ? 'outline' : 'secondary'} 
                      className="mt-2 text-xs"
                      style={isDark ? { borderColor: 'rgba(255,255,255,0.5)', color: 'white' } : {}}
                    >
                      المتوفر: {product.quantity}
                    </Badge>
                  </CardContent>
                </Card>
              )
            })}
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
