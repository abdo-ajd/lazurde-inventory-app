
// src/contexts/ProductContext.tsx
"use client";

import type { Product } from '@/lib/types';
import { createContext, useContext, ReactNode, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { LOCALSTORAGE_KEYS, INITIAL_PRODUCTS } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';

type ProductUpdatePayload = Partial<Pick<Product, "name" | "price" | "quantity" | "imageUrl" | "barcodeValue">>;

interface ProductContextType {
  products: Product[];
  addProduct: (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Product | null>;
  updateProduct: (productId: string, updates: ProductUpdatePayload) => Promise<Product | null>;
  deleteProduct: (productId: string) => Promise<boolean>;
  getProductById: (productId: string) => Product | undefined;
  getProductByBarcode: (barcodeValue: string) => Product | undefined;
  updateProductQuantity: (productId: string, quantityChange: number) => Promise<boolean>;
  replaceAllProducts: (newProducts: Product[]) => void;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const initialProductsCreator = useCallback(() => INITIAL_PRODUCTS, []);
  const [products, setProducts] = useLocalStorage<Product[]>(LOCALSTORAGE_KEYS.PRODUCTS, initialProductsCreator);
  const { toast } = useToast();

  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product | null> => {
    const currentProducts = products || [];

    const trimmedNewName = productData.name.trim();
    if (currentProducts.find(p => p.name.trim().toLowerCase() === trimmedNewName.toLowerCase())) {
      toast({ title: "خطأ", description: "منتج بنفس الاسم موجود بالفعل.", variant: "destructive" });
      return null;
    }
    
    const productIdTimestamp = Date.now();
    const generatedProductId = `prod_${productIdTimestamp}`;
    
    let finalBarcodeValue = String(productIdTimestamp); // Default barcode if none provided
    if (productData.barcodeValue !== undefined) {
        finalBarcodeValue = productData.barcodeValue.trim(); 
    }

    const newProductToAdd: Product = {
      ...productData,
      id: generatedProductId,
      name: trimmedNewName, // Use trimmed name
      price: productData.price, // Assuming price and quantity are validated by form
      quantity: productData.quantity,
      imageUrl: productData.imageUrl || '', 
      barcodeValue: finalBarcodeValue, 
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      setProducts(prevProducts => [...(prevProducts || []), newProductToAdd]);
      toast({ title: "نجاح", description: `تمت إضافة المنتج "${newProductToAdd.name}" بنجاح.` });
      return newProductToAdd;
    } catch (error) {
      console.error("Failed to add product:", error);
      // Error alert for localStorage quota is handled by useLocalStorage hook directly.
      // This toast is for other potential errors during add.
      if (!(error instanceof DOMException && (error.name === 'QuotaExceededError' || error.code === 22))) {
         toast({ title: "خطأ في الإضافة", description: "لم يتم حفظ المنتج بسبب خطأ غير متوقع.", variant: "destructive" });
      }
      return null;
    }
  };

  const updateProduct = async (productId: string, updates: ProductUpdatePayload): Promise<Product | null> => {
    const currentProducts = products || [];
    const productIndex = currentProducts.findIndex(p => p.id === productId);

    if (productIndex === -1) {
      toast({ title: "خطأ", description: "المنتج غير موجود لتحديثه.", variant: "destructive" });
      return null;
    }

    const productToUpdate = currentProducts[productIndex];
    const trimmedUpdateName = updates.name?.trim();

    // Check for name conflict if name is being updated and is different from original
    if (trimmedUpdateName && trimmedUpdateName.toLowerCase() !== productToUpdate.name.trim().toLowerCase()) {
      if (currentProducts.some(p => p.id !== productId && p.name.trim().toLowerCase() === trimmedUpdateName.toLowerCase())) {
        toast({ title: "خطأ", description: "منتج آخر بنفس الاسم الجديد موجود بالفعل.", variant: "destructive" });
        return productToUpdate; // Return original product as no update was made
      }
    }
    
    const updatedProduct: Product = {
      ...productToUpdate,
      name: trimmedUpdateName !== undefined ? trimmedUpdateName : productToUpdate.name,
      price: updates.price !== undefined ? updates.price : productToUpdate.price,
      quantity: updates.quantity !== undefined ? updates.quantity : productToUpdate.quantity,
      imageUrl: updates.imageUrl !== undefined ? (updates.imageUrl || '') : (productToUpdate.imageUrl || ''),
      barcodeValue: updates.barcodeValue !== undefined ? (updates.barcodeValue.trim() || '') : (productToUpdate.barcodeValue || ''),
      updatedAt: new Date().toISOString(),
    };

    try {
      setProducts(prevProducts => {
        const newProductsList = [...(prevProducts || [])]; // Create new array reference
        newProductsList[productIndex] = updatedProduct; // Replace with new object reference
        return newProductsList;
      });

      const meaningfulChange =
        updatedProduct.name !== productToUpdate.name ||
        updatedProduct.price !== productToUpdate.price ||
        updatedProduct.quantity !== productToUpdate.quantity ||
        updatedProduct.imageUrl !== productToUpdate.imageUrl ||
        updatedProduct.barcodeValue !== productToUpdate.barcodeValue;

      if (meaningfulChange) {
         toast({ title: "نجاح", description: `تم تحديث المنتج "${updatedProduct.name}".` });
      } else {
         toast({ title: "تم الحفظ", description: `تم حفظ بيانات المنتج "${updatedProduct.name}".` });
      }
      return updatedProduct;

    } catch (error) {
        console.error("Failed to update product:", error);
        // Error alert for localStorage quota is handled by useLocalStorage hook directly.
        if (!(error instanceof DOMException && (error.name === 'QuotaExceededError' || error.code === 22))) {
            toast({ title: "خطأ في التحديث", description: "لم يتم حفظ التعديلات بسبب خطأ غير متوقع.", variant: "destructive" });
        }
        return productToUpdate; 
    }
  };

  const deleteProduct = async (productId: string): Promise<boolean> => {
    const productToDelete = (products || []).find(p => p.id === productId);
    if (!productToDelete) {
      toast({ title: "خطأ", description: "المنتج غير موجود.", variant: "destructive" });
      return false;
    }
    try {
      setProducts(prevProducts => (prevProducts || []).filter(p => p.id !== productId));
      return true;
    } catch (error) {
      console.error("Failed to delete product:", error);
      if (!(error instanceof DOMException && (error.name === 'QuotaExceededError' || error.code === 22))) {
        toast({ title: "خطأ في الحذف", description: "لم يتم حذف المنتج بسبب خطأ.", variant: "destructive" });
      }
      return false;
    }
  };

  const getProductById = (productId: string): Product | undefined => {
    return (products || []).find(p => p.id === productId);
  };

  const getProductByBarcode = (barcodeValue: string): Product | undefined => {
    return (products || []).find(p => p.barcodeValue === barcodeValue);
  };

  const updateProductQuantity = async (productId: string, quantityChange: number): Promise<boolean> => {
    const product = getProductById(productId);
    if (!product) {
      // This case should ideally not be hit if UI prevents selling non-existent products
      console.error(`Product with ID ${productId} not found for quantity update.`);
      return false;
    }
    const newQuantity = product.quantity + quantityChange;
    if (newQuantity < 0) {
      // This case should ideally be prevented by UI checks (e.g., not allowing to sell more than available)
      console.error(`Attempted to set negative quantity for product ${productId}.`);
      return false; 
    }
    
    // Use the main updateProduct function to ensure consistency and proper state updates
    const result = await updateProduct(productId, { quantity: newQuantity });
    return !!result; // Returns true if updateProduct returns a product object, false if null
  };

  const replaceAllProducts = (newProducts: Product[]): void => {
    try {
      setProducts(newProducts);
    } catch (error) {
      console.error("Failed to replace all products:", error);
      if (!(error instanceof DOMException && (error.name === 'QuotaExceededError' || error.code === 22))) {
        toast({ title: "خطأ", description: "فشل استعادة بيانات المنتجات.", variant: "destructive" });
      }
    }
  };

  return (
    <ProductContext.Provider value={{ products: products || [], addProduct, updateProduct, deleteProduct, getProductById, getProductByBarcode, updateProductQuantity, replaceAllProducts }}>
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
