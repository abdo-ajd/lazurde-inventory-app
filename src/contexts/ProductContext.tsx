
// src/contexts/ProductContext.tsx
"use client";

import type { Product } from '@/lib/types';
import { createContext, useContext, ReactNode } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { LOCALSTORAGE_KEYS, INITIAL_PRODUCTS } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { saveImage, deleteImage, dataUriToBlob, clearImages } from '@/lib/indexedDBService';

type ProductUpdatePayload = Partial<Pick<Product, "name" | "price" | "quantity" | "imageUrl" | "barcodeValue" | "costPrice">>;

interface ProductContextType {
  products: Product[];
  isLoading: boolean;
  addProduct: (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Product | null>;
  updateProduct: (productId: string, updates: ProductUpdatePayload) => Promise<Product | null>;
  deleteProduct: (productId: string) => Promise<boolean>;
  getProductById: (productId: string) => Product | undefined;
  getProductByBarcode: (barcodeValue: string) => Product | undefined;
  updateProductQuantity: (productId: string, quantityChange: number) => Promise<boolean>;
  replaceAllProducts: (newProducts: Product[]) => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useLocalStorage<Product[]>(LOCALSTORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  const { toast } = useToast();

  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product | null> => {
    const currentProducts = products || [];
    if (currentProducts.find(p => p.name.trim().toLowerCase() === productData.name.trim().toLowerCase())) {
      toast({ title: "خطأ", description: "منتج بنفس الاسم موجود بالفعل.", variant: "destructive" });
      return null;
    }

    const newProductId = `prod_${Date.now()}`;
    let finalImageUrl = productData.imageUrl;

    if (finalImageUrl && finalImageUrl.startsWith('data:image')) {
      const imageBlob = dataUriToBlob(finalImageUrl);
      if (imageBlob) {
        try {
          await saveImage(newProductId, imageBlob);
          finalImageUrl = ''; // Image is stored in IndexedDB, so we clear the URL field
        } catch (error) {
          toast({ variant: "destructive", title: "خطأ", description: "فشل حفظ صورة المنتج في قاعدة البيانات المحلية." });
          finalImageUrl = '';
        }
      } else {
        finalImageUrl = '';
      }
    }

    const newProduct: Product = {
      id: newProductId,
      ...productData,
      imageUrl: finalImageUrl || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setProducts(prev => [...(prev || []), newProduct]);
    toast({ title: "نجاح", description: `تمت إضافة المنتج "${newProduct.name}" بنجاح.` });
    return newProduct;
  };

  const updateProduct = async (productId: string, updates: ProductUpdatePayload): Promise<Product | null> => {
    let finalImageUrl = updates.imageUrl;

    // Handle new image upload
    if (finalImageUrl && finalImageUrl.startsWith('data:image')) {
      const imageBlob = dataUriToBlob(finalImageUrl);
      if (imageBlob) {
        await saveImage(productId, imageBlob);
        finalImageUrl = ''; // Image now in IDB
      }
    } else if (finalImageUrl === '') { // Image removal
      await deleteImage(productId).catch(e => console.warn(e)); // Ignore errors if not found
    }
    // If finalImageUrl is an external URL or undefined, it will be handled below

    let updatedProduct: Product | undefined;
    setProducts(prev =>
      prev.map(p => {
        if (p.id === productId) {
          updatedProduct = {
            ...p,
            ...updates,
            imageUrl: finalImageUrl !== undefined ? finalImageUrl : p.imageUrl,
            updatedAt: new Date().toISOString(),
          };
          return updatedProduct;
        }
        return p;
      })
    );
    
    if (updatedProduct) {
      toast({ title: "نجاح", description: `تم تحديث المنتج.` });
      return updatedProduct;
    }
    
    toast({ variant: "destructive", title: "خطأ", description: "فشل تحديث المنتج." });
    return null;
  };

  const deleteProduct = async (productId: string): Promise<boolean> => {
    await deleteImage(productId).catch(e => console.warn(e)); // Try to delete image, ignore if not found
    setProducts(prev => prev.filter(p => p.id !== productId));
    toast({ title: "نجاح", description: "تم حذف المنتج بنجاح." });
    return true;
  };

  const getProductById = (productId: string): Product | undefined => {
    return (products || []).find(p => p.id === productId);
  };
  
  const getProductByBarcode = (barcodeValue: string): Product | undefined => {
    return (products || []).find(p => p.barcodeValue === barcodeValue);
  };

  const updateProductQuantity = async (productId: string, quantityChange: number): Promise<boolean> => {
    const product = getProductById(productId);
    if (!product) return false;

    const newQuantity = product.quantity + quantityChange;
    if (newQuantity < 0) return false;

    setProducts(prev =>
      prev.map(p =>
        p.id === productId ? { ...p, quantity: newQuantity, updatedAt: new Date().toISOString() } : p
      )
    );
    return true;
  };
  
  const replaceAllProducts = async (newProducts: Product[]): Promise<void> => {
    // This is part of the restore from backup flow.
    // The backup contains products with imageUrls as data URIs if they had local images.
    await clearImages(); // Clear all old images from IndexedDB
    const productsForLocalStorage: Product[] = [];

    for (const p of newProducts) {
      if (p.imageUrl && p.imageUrl.startsWith('data:image')) {
        const blob = dataUriToBlob(p.imageUrl);
        if (blob) {
          await saveImage(p.id, blob);
        }
        // Save product to localStorage without the large data URI
        productsForLocalStorage.push({ ...p, imageUrl: '' });
      } else {
        // Product has an external URL or no image
        productsForLocalStorage.push(p);
      }
    }
    setProducts(productsForLocalStorage);
  };

  return (
    <ProductContext.Provider value={{ products: products || [], isLoading: false, addProduct, updateProduct, deleteProduct, getProductById, getProductByBarcode, updateProductQuantity, replaceAllProducts }}>
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
