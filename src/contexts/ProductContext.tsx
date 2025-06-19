
// src/contexts/ProductContext.tsx
"use client";

import type { Product } from '@/lib/types';
import { createContext, useContext, ReactNode, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { LOCALSTORAGE_KEYS, INITIAL_PRODUCTS } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { saveImage as saveImageToDB, deleteImage as deleteImageFromDB, dataUriToBlob } from '@/lib/indexedDBService';

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
    
    let finalBarcodeValue = String(productIdTimestamp);
    if (productData.barcodeValue !== undefined) {
        finalBarcodeValue = productData.barcodeValue.trim(); 
    }

    let imageToSaveInDB = productData.imageUrl || ''; // Keep original value for now

    const newProductToAdd: Product = {
      ...productData,
      id: generatedProductId,
      name: trimmedNewName,
      price: productData.price,
      quantity: productData.quantity,
      imageUrl: '', // Will be empty in localStorage if image goes to IDB
      barcodeValue: finalBarcodeValue, 
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      if (imageToSaveInDB && imageToSaveInDB.startsWith('data:image')) {
        const blob = dataUriToBlob(imageToSaveInDB);
        if (blob) {
          await saveImageToDB(newProductToAdd.id, blob);
          // newProductToAdd.imageUrl is already set to ''
        } else {
          console.warn(`Could not convert data URI to Blob for product ${newProductToAdd.id}. Image not saved to IndexedDB.`);
          newProductToAdd.imageUrl = imageToSaveInDB; // Keep original Data URI if conversion fails
        }
      } else if (imageToSaveInDB) {
        // If it's not a data URI, it might be a placeholder or external URL. Keep it.
        newProductToAdd.imageUrl = imageToSaveInDB;
      }


      setProducts(prevProducts => [newProductToAdd, ...(prevProducts || [])]);
      toast({ title: "نجاح", description: `تمت إضافة المنتج "${newProductToAdd.name}" بنجاح.` });
      return newProductToAdd;
    } catch (error) {
      console.error("Failed to add product:", error);
      if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.code === 22)) {
        // Alert is handled by useLocalStorage
      } else {
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

    const productToUpdate = { ...currentProducts[productIndex] }; // Create a copy
    let productChanged = false;

    if (updates.name !== undefined && updates.name.trim() !== productToUpdate.name) {
        const trimmedUpdateName = updates.name.trim();
        if (currentProducts.some(p => p.id !== productId && p.name.trim().toLowerCase() === trimmedUpdateName.toLowerCase())) {
            toast({ title: "خطأ", description: "منتج آخر بنفس الاسم الجديد موجود بالفعل.", variant: "destructive" });
            return productToUpdate; 
        }
        productToUpdate.name = trimmedUpdateName;
        productChanged = true;
    }
    if (updates.price !== undefined && updates.price !== productToUpdate.price) {
        productToUpdate.price = updates.price;
        productChanged = true;
    }
    if (updates.quantity !== undefined && updates.quantity !== productToUpdate.quantity) {
        productToUpdate.quantity = updates.quantity;
        productChanged = true;
    }
    if (updates.barcodeValue !== undefined && updates.barcodeValue.trim() !== (productToUpdate.barcodeValue || '')) {
        productToUpdate.barcodeValue = updates.barcodeValue.trim();
        productChanged = true;
    }

    // Image handling
    if (updates.imageUrl !== undefined) {
        productChanged = true; // Image change is considered a change
        if (updates.imageUrl.startsWith('data:image')) { // New image data URI
            const blob = dataUriToBlob(updates.imageUrl);
            if (blob) {
                try {
                    await saveImageToDB(productId, blob);
                    productToUpdate.imageUrl = ''; // Clear from localStorage version
                } catch (e) {
                    console.error("Failed to save updated image to IndexedDB", e);
                    // Keep old image ref or new data URI if save fails? For now, assume it might fail, keep new URI.
                    productToUpdate.imageUrl = updates.imageUrl; 
                    toast({variant: "destructive", title: "خطأ في حفظ الصورة", description: "لم يتم حفظ الصورة الجديدة في قاعدة البيانات المحلية."});
                }
            } else {
                 console.warn(`Could not convert new data URI to Blob for product ${productId}.`);
                 productToUpdate.imageUrl = updates.imageUrl; // Keep new Data URI if conversion fails
            }
        } else if (updates.imageUrl === '') { // Image cleared by user
            try {
                await deleteImageFromDB(productId);
                productToUpdate.imageUrl = '';
            } catch (e) {
                console.error("Failed to delete image from IndexedDB", e);
                // If deletion fails, the image might still be in IDB. localStorage version is cleared.
                productToUpdate.imageUrl = ''; 
            }
        } else { // It's a placeholder or external URL
            productToUpdate.imageUrl = updates.imageUrl;
             // If it was previously in IDB, delete it
            try { await deleteImageFromDB(productId); } catch (e) { /* ignore */ }
        }
    }
    
    if (!productChanged) {
        toast({ title: "تم الحفظ", description: `لم يتم العثور على تغييرات لـ "${productToUpdate.name}".` });
        return productToUpdate;
    }

    productToUpdate.updatedAt = new Date().toISOString();
    
    try {
      const finalUpdatedProduct = { ...productToUpdate }; // Ensure a new object reference for the specific product
      setProducts(prevProducts => {
        const newProductsList = [...(prevProducts || [])];
        newProductsList[productIndex] = finalUpdatedProduct;
        return newProductsList;
      });
      toast({ title: "نجاح", description: `تم تحديث المنتج "${finalUpdatedProduct.name}".` });
      return finalUpdatedProduct;
    } catch (error) {
      console.error("Failed to update product in localStorage:", error);
      if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.code === 22)) {
         // Alert handled by useLocalStorage
      } else {
        toast({ title: "خطأ في التحديث", description: "لم يتم حفظ التعديلات بسبب خطأ غير متوقع.", variant: "destructive" });
      }
      return currentProducts[productIndex]; // Return original if update fails
    }
  };

  const deleteProduct = async (productId: string): Promise<boolean> => {
    const productToDelete = (products || []).find(p => p.id === productId);
    if (!productToDelete) {
      toast({ title: "خطأ", description: "المنتج غير موجود.", variant: "destructive" });
      return false;
    }
    try {
      await deleteImageFromDB(productId); // Delete image from IDB first
      setProducts(prevProducts => (prevProducts || []).filter(p => p.id !== productId));
      // Toast is shown by the calling component after success
      return true;
    } catch (error) {
      console.error("Failed to delete product or its image:", error);
       if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.code === 22)) {
         // Alert handled by useLocalStorage if it was during setProducts
       } else {
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
      console.error(`Product with ID ${productId} not found for quantity update.`);
      return false;
    }
    const newQuantity = product.quantity + quantityChange;
    if (newQuantity < 0) {
      console.error(`Attempted to set negative quantity for product ${productId}.`);
      return false; 
    }
    const result = await updateProduct(productId, { quantity: newQuantity });
    return !!result;
  };

  const replaceAllProducts = async (newProductsFromBackup: Product[]): Promise<void> => {
    try {
      const productsForLocalStorage: Product[] = [];
      for (const product of newProductsFromBackup) {
        const productCopy = { ...product }; // Work on a copy
        if (productCopy.imageUrl && productCopy.imageUrl.startsWith('data:image')) {
          const blob = dataUriToBlob(productCopy.imageUrl);
          if (blob) {
            try {
              await saveImageToDB(productCopy.id, blob);
              productCopy.imageUrl = ''; // Clear DataURI from localStorage version
            } catch (e) {
              console.warn(`Failed to migrate image to IndexedDB for product ${productCopy.id} during restore. Keeping Data URI.`, e);
              // Keep productCopy.imageUrl as DataURI if IDB save fails
            }
          } else {
            console.warn(`Could not convert Data URI to Blob for product ${productCopy.id} during restore. Keeping Data URI.`);
            // Keep productCopy.imageUrl as DataURI if conversion fails
          }
        }
        productsForLocalStorage.push(productCopy);
      }
      setProducts(productsForLocalStorage);
      // Toast for restore success is usually handled in AppSettingsPage
    } catch (error) {
      console.error("Failed to replace all products:", error);
      if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.code === 22)) {
         // Alert handled by useLocalStorage
      } else {
        toast({ title: "خطأ", description: "فشل استعادة بيانات المنتجات.", variant: "destructive" });
      }
    }
  };

  return (
    <ProductContext.Provider value={{ products: products || [], addProduct, updateProduct, deleteProduct, getProductById, getProductByBarcode, updateProductQuantity, replaceAllProducts: replaceAllProducts }}>
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
