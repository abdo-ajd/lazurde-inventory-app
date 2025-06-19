
// src/contexts/ProductContext.tsx
"use client";

import type { Product } from '@/lib/types';
import { createContext, useContext, ReactNode, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { LOCALSTORAGE_KEYS, INITIAL_PRODUCTS } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { saveImage as saveImageToDB, deleteImage as deleteImageFromDB, getImage as getImageFromDB, dataUriToBlob, blobToDataUri } from '@/lib/indexedDBService';

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
    
    const productIdTimestamp = Date.now(); // Timestamp for ID and potential barcode
    const generatedProductId = `prod_${productIdTimestamp}`;
    
    // Barcode logic: Use provided if not empty, otherwise generate from timestamp
    let finalBarcodeValue = productData.barcodeValue?.trim(); // Get trimmed value or undefined
    if (!finalBarcodeValue) { // If undefined, null, or empty string after trim
        finalBarcodeValue = String(productIdTimestamp);
    }

    let imageToSaveInDB = productData.imageUrl || '';

    const newProductToAdd: Product = {
      ...productData,
      id: generatedProductId,
      name: trimmedNewName,
      price: productData.price,
      quantity: productData.quantity,
      imageUrl: '', 
      barcodeValue: finalBarcodeValue, 
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      if (imageToSaveInDB && imageToSaveInDB.startsWith('data:image')) {
        const blob = dataUriToBlob(imageToSaveInDB);
        if (blob) {
          await saveImageToDB(newProductToAdd.id, blob);
        } else {
          console.warn(`Could not convert data URI to Blob for product ${newProductToAdd.id}. Image not saved to IndexedDB.`);
          newProductToAdd.imageUrl = imageToSaveInDB; 
        }
      } else if (imageToSaveInDB) {
        newProductToAdd.imageUrl = imageToSaveInDB;
      }

      setProducts(prevProducts => [newProductToAdd, ...(prevProducts || [])]);
      toast({ title: "نجاح", description: `تمت إضافة المنتج "${newProductToAdd.name}" بنجاح.` });
      return newProductToAdd;
    } catch (error) {
      console.error("Failed to add product:", error);
      if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.code === 22)) {
         // Alert handled by useLocalStorage
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

    const originalProduct = currentProducts[productIndex];
    let productChanged = false;
    
    // Create a mutable copy for building the updated product
    const updatedProductData = { ...originalProduct };

    if (updates.name !== undefined && updates.name.trim() !== updatedProductData.name) {
        const trimmedUpdateName = updates.name.trim();
        if (currentProducts.some(p => p.id !== productId && p.name.trim().toLowerCase() === trimmedUpdateName.toLowerCase())) {
            toast({ title: "خطأ", description: "منتج آخر بنفس الاسم الجديد موجود بالفعل.", variant: "destructive" });
            return originalProduct; 
        }
        updatedProductData.name = trimmedUpdateName;
        productChanged = true;
    }
    if (updates.price !== undefined && updates.price !== updatedProductData.price) {
        updatedProductData.price = updates.price;
        productChanged = true;
    }
    if (updates.quantity !== undefined && updates.quantity !== updatedProductData.quantity) {
        updatedProductData.quantity = updates.quantity;
        productChanged = true;
    }
    
    const newBarcodeValue = updates.barcodeValue?.trim();
    if (newBarcodeValue !== undefined && newBarcodeValue !== (updatedProductData.barcodeValue || '')) {
        updatedProductData.barcodeValue = newBarcodeValue;
        productChanged = true;
    } else if (updates.barcodeValue !== undefined && newBarcodeValue === '' && updatedProductData.barcodeValue) {
        // If user explicitly clears barcode, set it to empty string
        updatedProductData.barcodeValue = '';
        productChanged = true;
    }


    if (updates.imageUrl !== undefined) {
        productChanged = true;
        if (updates.imageUrl.startsWith('data:image')) {
            const blob = dataUriToBlob(updates.imageUrl);
            if (blob) {
                try {
                    await saveImageToDB(productId, blob);
                    updatedProductData.imageUrl = ''; 
                } catch (e) {
                    console.error("Failed to save updated image to IndexedDB", e);
                    updatedProductData.imageUrl = updates.imageUrl; 
                    toast({variant: "destructive", title: "خطأ في حفظ الصورة", description: "لم يتم حفظ الصورة الجديدة في قاعدة البيانات المحلية."});
                }
            } else {
                 console.warn(`Could not convert new data URI to Blob for product ${productId}.`);
                 updatedProductData.imageUrl = updates.imageUrl; 
            }
        } else if (updates.imageUrl === '') { 
            try {
                await deleteImageFromDB(productId);
                updatedProductData.imageUrl = '';
            } catch (e) {
                console.error("Failed to delete image from IndexedDB", e);
                updatedProductData.imageUrl = ''; 
            }
        } else { 
            updatedProductData.imageUrl = updates.imageUrl;
            try { await deleteImageFromDB(productId); } catch (e) { /* ignore */ }
        }
    }
    
    if (!productChanged) {
        toast({ title: "تم الحفظ", description: `لم يتم العثور على تغييرات لـ "${originalProduct.name}".` });
        return originalProduct;
    }

    updatedProductData.updatedAt = new Date().toISOString();
    
    try {
      const finalUpdatedProduct = { ...updatedProductData }; 
      setProducts(prevProducts => {
        const newProductsList = (prevProducts || []).map(p => p.id === productId ? finalUpdatedProduct : p);
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
      return originalProduct; 
    }
  };

  const deleteProduct = async (productId: string): Promise<boolean> => {
    const productToDelete = (products || []).find(p => p.id === productId);
    if (!productToDelete) {
      toast({ title: "خطأ", description: "المنتج غير موجود.", variant: "destructive" });
      return false;
    }
    try {
      await deleteImageFromDB(productId); 
      setProducts(prevProducts => (prevProducts || []).filter(p => p.id !== productId));
      return true;
    } catch (error) {
      console.error("Failed to delete product or its image:", error);
       if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.code === 22)) {
         // Alert handled by useLocalStorage
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
        const productCopy = { ...product }; 
        if (productCopy.imageUrl && productCopy.imageUrl.startsWith('data:image')) {
          const blob = dataUriToBlob(productCopy.imageUrl);
          if (blob) {
            try {
              await saveImageToDB(productCopy.id, blob);
              productCopy.imageUrl = ''; 
            } catch (e) {
              console.warn(`Failed to migrate image to IndexedDB for product ${productCopy.id} during restore. Keeping Data URI.`, e);
            }
          } else {
            console.warn(`Could not convert Data URI to Blob for product ${productCopy.id} during restore. Keeping Data URI.`);
          }
        }
        productsForLocalStorage.push(productCopy);
      }
      setProducts(productsForLocalStorage);
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

