// src/contexts/PosContext.tsx
"use client";

import type { Product, SaleItem } from '@/lib/types';
import { createContext, useContext, ReactNode, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useProducts } from './ProductContext'; // Import hook

interface PosContextType {
  cartItems: SaleItem[];
  addItemToCart: (product: Product) => void;
  updateItemQuantity: (productId: string, newQuantity: number) => void;
  removeItemFromCart: (productId: string) => void;
  clearCart: () => void;
  cartTotal: number;
}

const PosContext = createContext<PosContextType | undefined>(undefined);

export const PosProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<SaleItem[]>([]);
  const { getProductById } = useProducts(); // Get product context functions
  const { toast } = useToast();

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
            // Increment quantity
            return prevItems.map(item => 
                item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
            );
        } else {
            // Add new item
            const newItem: SaleItem = {
                productId: product.id,
                productName: product.name,
                pricePerUnit: product.price,
                quantity: 1,
            };
            return [...prevItems, newItem];
        }
    });
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
  
  const clearCart = () => {
    setCartItems([]);
  };

  const cartTotal = cartItems.reduce((total, item) => total + (item.pricePerUnit * item.quantity), 0);
  
  return (
    <PosContext.Provider value={{ cartItems, addItemToCart, updateItemQuantity, removeItemFromCart, clearCart, cartTotal }}>
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
