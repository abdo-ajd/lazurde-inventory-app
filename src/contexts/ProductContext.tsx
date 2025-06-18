// src/contexts/ProductContext.tsx
"use client";

import type { Product } from '@/lib/types';
import { createContext, useContext, ReactNode } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { LOCALSTORAGE_KEYS, INITIAL_PRODUCTS } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';

interface ProductContextType {
  products: Product[];
  addProduct: (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Product | null>;
  updateProduct: (productId: string, updates: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<Product | null>;
  deleteProduct: (productId: string) => Promise<boolean>;
  getProductById: (productId: string) => Product | undefined;
  updateProductQuantity: (productId: string, quantityChange: number) => Promise<boolean>; // Positive for adding, negative for subtracting
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useLocalStorage<Product[]>(LOCALSTORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  const { toast } = useToast();

  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product | null> => {
    if (products.find(p => p.name.trim().toLowerCase() === productData.name.trim().toLowerCase())) {
      toast({ title: "خطأ", description: "منتج بنفس الاسم موجود بالفعل.", variant: "destructive" });
      return null;
    }
    const newProduct: Product = {
      ...productData,
      id: `prod_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProducts(prevProducts => [...prevProducts, newProduct]);
    toast({ title: "نجاح", description: `تمت إضافة المنتج "${newProduct.name}" بنجاح.` });
    return newProduct;
  };

  const updateProduct = async (productId: string, updates: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Product | null> => {
    let updatedProduct: Product | null = null;
    setProducts(prevProducts =>
      prevProducts.map(p => {
        if (p.id === productId) {
          // Check for name conflict if name is being updated
          if (updates.name && updates.name !== p.name && prevProducts.some(op => op.id !== productId && op.name.trim().toLowerCase() === updates.name!.trim().toLowerCase())) {
             toast({ title: "خطأ", description: "منتج آخر بنفس الاسم الجديد موجود بالفعل.", variant: "destructive" });
             updatedProduct = p; // keep original product to indicate no update
             return p; 
          }
          updatedProduct = { ...p, ...updates, updatedAt: new Date().toISOString() };
          return updatedProduct;
        }
        return p;
      })
    );
    if (updatedProduct && updatedProduct.id === productId) { // Check if update actually happened
         if (JSON.stringify(products.find(p => p.id === productId)) !== JSON.stringify(updatedProduct)) { // Check if something actually changed
            toast({ title: "نجاح", description: `تم تحديث المنتج "${updatedProduct.name}".` });
         }
    }
    return updatedProduct;
  };

  const deleteProduct = async (productId: string): Promise<boolean> => {
    const productToDelete = products.find(p => p.id === productId);
    if (!productToDelete) {
      toast({ title: "خطأ", description: "المنتج غير موجود.", variant: "destructive" });
      return false;
    }
    setProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
    toast({ title: "نجاح", description: `تم حذف المنتج "${productToDelete.name}".` });
    return true;
  };

  const getProductById = (productId: string): Product | undefined => {
    return products.find(p => p.id === productId);
  };

  const updateProductQuantity = async (productId: string, quantityChange: number): Promise<boolean> => {
    const product = getProductById(productId);
    if (!product) {
      toast({ title: "خطأ", description: "المنتج غير موجود.", variant: "destructive" });
      return false;
    }
    const newQuantity = product.quantity + quantityChange;
    if (newQuantity < 0) {
      toast({ title: "خطأ", description: `لا توجد كمية كافية من المنتج "${product.name}". الكمية المتوفرة: ${product.quantity}`, variant: "destructive" });
      return false;
    }
    
    await updateProduct(productId, { quantity: newQuantity });
    // Toast for quantity update is handled by updateProduct or specific sale/return logic
    return true;
  };

  return (
    <ProductContext.Provider value={{ products, addProduct, updateProduct, deleteProduct, getProductById, updateProductQuantity }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};
