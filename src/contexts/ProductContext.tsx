
// src/contexts/ProductContext.tsx
"use client";

import type { Product } from '@/lib/types';
import { createContext, useContext, ReactNode, useCallback, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, onSnapshot, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';

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
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

// Helper to convert Data URI to Blob
const dataUriToBlob = (dataURI: string): Blob | null => {
    if (!dataURI || !dataURI.includes(',')) return null;
    try {
        const [header, base64Data] = dataURI.split(',');
        if (!header || !base64Data) return null;
        const mimeMatch = header.match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
        const byteString = atob(base64Data);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([ab], { type: mime });
    } catch (e) {
        console.error("Error converting Data URI to Blob:", e);
        return null;
    }
};

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    const productsCollectionRef = collection(db, "products");
    const unsubscribe = onSnapshot(productsCollectionRef, (snapshot) => {
      const productsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Convert Firestore Timestamps to ISO strings if they exist
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
        } as Product;
      });
      setProducts(productsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching products from Firestore:", error);
      toast({ variant: "destructive", title: "خطأ في الشبكة", description: "فشل تحميل بيانات المنتجات من السحابة." });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);
  
  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product | null> => {
    const trimmedNewName = productData.name.trim();

    if (products.find(p => p.name.trim().toLowerCase() === trimmedNewName.toLowerCase())) {
      toast({ title: "خطأ", description: "منتج بنفس الاسم موجود بالفعل.", variant: "destructive" });
      return null;
    }

    let finalImageUrl = '';
    // Handle image upload if a new image (as data URI) is provided
    if (productData.imageUrl && productData.imageUrl.startsWith('data:image')) {
      const storageRef = ref(storage, `product_images/${Date.now()}_${trimmedNewName}`);
      try {
        await uploadString(storageRef, productData.imageUrl, 'data_url');
        finalImageUrl = await getDownloadURL(storageRef);
      } catch (error) {
        console.error("Error uploading image: ", error);
        toast({ variant: "destructive", title: "خطأ", description: "فشل رفع صورة المنتج." });
        return null;
      }
    } else {
      finalImageUrl = productData.imageUrl || ''; // Keep external URL if provided
    }

    try {
      const newProductData = {
        ...productData,
        name: trimmedNewName,
        imageUrl: finalImageUrl,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(collection(db, "products"), newProductData);
      toast({ title: "نجاح", description: `تمت إضافة المنتج "${trimmedNewName}" بنجاح.` });
      
      // The product will be added to local state via the onSnapshot listener.
      return { ...newProductData, id: docRef.id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    } catch (error) {
      console.error("Error adding document: ", error);
      toast({ variant: "destructive", title: "خطأ", description: "فشل حفظ المنتج في قاعدة البيانات." });
      return null;
    }
  };

  const updateProduct = async (productId: string, updates: ProductUpdatePayload): Promise<Product | null> => {
    const productDocRef = doc(db, "products", productId);
    let finalUpdates: Partial<Product> & { updatedAt: any } = { ...updates, updatedAt: serverTimestamp() };

    try {
      // Handle image update/removal
      if (updates.imageUrl && updates.imageUrl.startsWith('data:image')) {
        const existingDoc = await getDoc(productDocRef);
        const oldImageUrl = existingDoc.data()?.imageUrl;
        if (oldImageUrl) {
          try {
            const oldImageRef = ref(storage, oldImageUrl);
            await deleteObject(oldImageRef);
          } catch (error: any) {
             if (error.code !== 'storage/object-not-found') {
                console.warn("Could not delete old image, proceeding with update.", error);
             }
          }
        }
        
        const newStorageRef = ref(storage, `product_images/${productId}_${Date.now()}`);
        await uploadString(newStorageRef, updates.imageUrl, 'data_url');
        finalUpdates.imageUrl = await getDownloadURL(newStorageRef);

      } else if (updates.imageUrl === '') { // Image removal requested
        const existingDoc = await getDoc(productDocRef);
        const oldImageUrl = existingDoc.data()?.imageUrl;
        if (oldImageUrl) {
             try {
                const oldImageRef = ref(storage, oldImageUrl);
                await deleteObject(oldImageRef);
             } catch (error: any) {
                 if (error.code !== 'storage/object-not-found') {
                    console.warn("Could not delete old image, proceeding with update.", error);
                 }
             }
        }
        finalUpdates.imageUrl = '';
      }
      
      await updateDoc(productDocRef, finalUpdates);
      toast({ title: "نجاح", description: `تم تحديث المنتج.` });
      const updatedDoc = await getDoc(productDocRef);
      return { id: updatedDoc.id, ...updatedDoc.data() } as Product;

    } catch (error) {
      console.error("Error updating product:", error);
      toast({ variant: "destructive", title: "خطأ", description: "فشل تحديث المنتج." });
      return null;
    }
  };

  const deleteProduct = async (productId: string): Promise<boolean> => {
    const productDocRef = doc(db, "products", productId);
    try {
      const docSnap = await getDoc(productDocRef);
      if (docSnap.exists()) {
        const imageUrl = docSnap.data()?.imageUrl;
        if (imageUrl) {
          const imageRef = ref(storage, imageUrl);
          await deleteObject(imageRef).catch(error => console.warn("Image delete failed, continuing doc deletion...", error));
        }
      }
      await deleteDoc(productDocRef);
      toast({ title: "نجاح", description: "تم حذف المنتج بنجاح." });
      return true;
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({ variant: "destructive", title: "خطأ", description: "فشل حذف المنتج." });
      return false;
    }
  };

  const getProductById = (productId: string): Product | undefined => {
    return products.find(p => p.id === productId);
  };

  const getProductByBarcode = (barcodeValue: string): Product | undefined => {
    return products.find(p => p.barcodeValue === barcodeValue);
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
  
  // This function is now incompatible with Firebase as the primary data source.
  // It needs to be re-implemented for Firebase if needed (e.g., via Cloud Functions).
  const replaceAllProducts = (newProducts: Product[]): void => {
    toast({
      variant: "destructive",
      title: "وظيفة غير مدعومة",
      description: "استعادة النسخ الاحتياطي من ملف لم تعد مدعومة مع التخزين السحابي."
    });
  };

  return (
    <ProductContext.Provider value={{ products, isLoading, addProduct, updateProduct, deleteProduct, getProductById, getProductByBarcode, updateProductQuantity }}>
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
