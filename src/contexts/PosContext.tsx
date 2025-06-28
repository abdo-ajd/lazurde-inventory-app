
// src/contexts/PosContext.tsx
"use client";

import type { Product, SaleItem } from '@/lib/types';
import { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useProducts } from './ProductContext';
import { usePathname } from 'next/navigation';

interface PosContextType {
  cartItems: SaleItem[];
  addItemToCart: (product: Product) => void;
  updateItemQuantity: (productId: string, newQuantity: number) => void;
  removeItemFromCart: (productId: string) => void;
  clearCart: () => void;
  cartTotal: number;
  posSearchTerm: string;
  setPosSearchTerm: (term: string) => void;
}

const PosContext = createContext<PosContextType | undefined>(undefined);

export const PosProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<SaleItem[]>([]);
  const [posSearchTerm, setPosSearchTerm] = useState('');
  const { getProductById } = useProducts(); 
  const { toast } = useToast();
  const pathname = usePathname();

  const clearCart = useCallback(() => {
    setCartItems([]);
    setPosSearchTerm('');
  }, []);

  useEffect(() => {
    if (pathname !== '/dashboard/pos') {
      if (cartItems.length > 0 || posSearchTerm) {
        clearCart();
      }
    }
  }, [pathname, cartItems, posSearchTerm, clearCart]);


  const addItemToCart = (product: Product) => {
    if (product.quantity <= 0) {
        toast({ variant: 'destructive', title: "نفذت الكمية", description: `المنتج "${product.name}" غير متوفر.` });
        return;
    }
    
    setCartItems(prevItems => {
        const existingItem = prevItems.find(item => item.productId === product.id);
        
        if (existingItem) {
            const productInSystem = getProductById(product.id);
            if (productInSystem && existingItem.quantity >= productInSystem.quantity) {
                toast({ variant: 'destructive', title: "الكمية لا تسمح", description: `لا يمكن إضافة المزيد من المنتج "${product.name}".`});
                return prevItems;
            }
            return prevItems.map(item => 
                item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
            );
        } else {
            const newItem: SaleItem = {
                productId: product.id,
                productName: product.name,
                pricePerUnit: product.price,
                quantity: 1,
                returnedQuantity: 0,
            };
            return [...prevItems, newItem];
        }
    });

    try {
        const audio = new Audio('/sounds/add-to-cart.mp3');
        audio.play().catch(error => console.warn("Error playing add to cart sound:", error));
    } catch (error) {
        console.warn("Could not play add to cart sound:", error);
    }
  };

  const updateItemQuantity = (productId: string, newQuantity: number) => {
    const product = getProductById(productId);
    if (!product) return;

    if (newQuantity <= 0) {
      removeItemFromCart(productId);
      return;
    }

    if (newQuantity > product.quantity) {
        toast({ variant: 'destructive', title: "الكمية لا تسمح", description: `الكمية المتوفرة للمنتج "${product.name}" هي ${product.quantity}.`});
        return;
    }
    
    setCartItems(prevItems => prevItems.map(item => 
        item.productId === productId ? { ...item, quantity: newQuantity } : item
    ));
  };
  
  const removeItemFromCart = (productId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.productId !== productId));
  };

  const cartTotal = cartItems.reduce((total, item) => total + (item.pricePerUnit * item.quantity), 0);
  
  return (
    <PosContext.Provider value={{ cartItems, addItemToCart, updateItemQuantity, removeItemFromCart, clearCart, cartTotal, posSearchTerm, setPosSearchTerm }}>
      {children}
    </PosContext.Provider>
  );
};

export const usePos = () => {
  const context = useContext(PosContext);
  if (context === undefined) {
    throw new Error('usePos must be used within a PosProvider');
  }
  return context;
};
