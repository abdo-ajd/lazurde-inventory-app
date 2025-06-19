// src/contexts/SalesContext.tsx
"use client";

import type { Sale, SaleItem } from '@/lib/types';
import { createContext, useContext, ReactNode } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { LOCALSTORAGE_KEYS, INITIAL_SALES } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { useProducts } from './ProductContext';
import { useAuth } from './AuthContext';
import { useAppSettings } from './AppSettingsContext';

interface SalesContextType {
  sales: Sale[];
  addSale: (items: Omit<SaleItem, 'productName' | 'pricePerUnit'>[], discountInput?: number) => Promise<Sale | null>;
  returnSale: (saleId: string) => Promise<boolean>;
  getSaleById: (saleId: string) => Sale | undefined;
  replaceAllSales: (newSales: Sale[]) => void;
}

const SalesContext = createContext<SalesContextType | undefined>(undefined);

export const SalesProvider = ({ children }: { children: ReactNode }) => {
  const [sales, setSales] = useLocalStorage<Sale[]>(LOCALSTORAGE_KEYS.SALES, INITIAL_SALES);
  const { toast } = useToast();
  const { getProductById, updateProductQuantity } = useProducts();
  const { currentUser } = useAuth();
  const { settings } = useAppSettings();

  const addSale = async (rawItems: Omit<SaleItem, 'productName' | 'pricePerUnit'>[], discountInput: number = 0): Promise<Sale | null> => {
    if (!currentUser) {
      toast({ title: "خطأ", description: "يجب تسجيل الدخول لتسجيل عملية بيع.", variant: "destructive" });
      return null;
    }

    const saleItems: SaleItem[] = [];
    let currentOriginalTotalAmount = 0;

    for (const rawItem of rawItems) {
      const product = getProductById(rawItem.productId);
      if (!product) {
        toast({ title: "خطأ", description: `المنتج بالمعرف ${rawItem.productId} غير موجود.`, variant: "destructive" });
        return null;
      }
      if (product.quantity < rawItem.quantity) {
        toast({ title: "خطأ", description: `كمية غير كافية من المنتج "${product.name}". المتوفر: ${product.quantity}`, variant: "destructive" });
        return null;
      }
      saleItems.push({
        productId: product.id,
        productName: product.name,
        quantity: rawItem.quantity,
        pricePerUnit: product.price,
      });
      currentOriginalTotalAmount += product.price * rawItem.quantity;
    }

    const discountValue = Math.max(0, discountInput); // Ensure discount is not negative
    const finalTotalAmount = Math.max(0, currentOriginalTotalAmount - discountValue); // Ensure total is not negative

    if (discountValue > currentOriginalTotalAmount) {
        toast({ title: "تنبيه", description: "قيمة الخصم أكبر من إجمالي الفاتورة. تم تطبيق خصم بقيمة الفاتورة.", variant: "default" });
    }


    for (const item of saleItems) {
      const success = await updateProductQuantity(item.productId, -item.quantity);
      if (!success) {
        toast({ title: "خطأ فادح", description: "فشل تحديث كمية المنتج. تم إلغاء البيع.", variant: "destructive" });
        // Optionally, revert any previously updated quantities here if needed
        return null;
      }
    }
    
    const newSale: Sale = {
      id: `sale_${Date.now()}`,
      items: saleItems,
      originalTotalAmount: currentOriginalTotalAmount,
      discountAmount: discountValue,
      totalAmount: finalTotalAmount,
      saleDate: new Date().toISOString(),
      sellerId: currentUser.id,
      sellerUsername: currentUser.username,
      status: 'active',
    };

    setSales(prevSales => [newSale, ...(prevSales || [])]);
    let toastMessage = `تم تسجيل البيع بنجاح. الإجمالي: ${finalTotalAmount}`;
    if (discountValue > 0) {
        toastMessage += ` (بعد خصم ${discountValue})`;
    }
    toast({ title: "نجاح", description: toastMessage });

    if (settings.saleSuccessSound && settings.saleSuccessSound.startsWith('data:audio')) {
      try {
        const audio = new Audio(settings.saleSuccessSound);
        audio.play().catch(error => console.warn("Error playing custom sale sound:", error));
      } catch (error) {
        console.warn("Could not play custom sale sound:", error);
      }
    }

    return newSale;
  };

  const returnSale = async (saleId: string): Promise<boolean> => {
    const currentSales = sales || [];
    const saleToReturn = currentSales.find(s => s.id === saleId);
    if (!saleToReturn) {
      toast({ title: "خطأ", description: "عملية البيع غير موجودة.", variant: "destructive" });
      return false;
    }
    if (saleToReturn.status === 'returned') {
      toast({ title: "معلومة", description: "عملية البيع هذه تم إرجاعها بالفعل."});
      return false;
    }

    for (const item of saleToReturn.items) {
      const success = await updateProductQuantity(item.productId, item.quantity);
      if (!success) {
        toast({ title: "خطأ فادح", description: `فشل تحديث كمية المنتج "${item.productName}" أثناء الإرجاع.`, variant: "destructive" });
      }
    }

    setSales(prevSales =>
      (prevSales || []).map(s =>
        s.id === saleId ? { ...s, status: 'returned', returnedDate: new Date().toISOString() } : s
      )
    );
    toast({ title: "نجاح", description: `تم إرجاع عملية البيع بنجاح.` });
    return true;
  };

  const getSaleById = (saleId: string): Sale | undefined => {
    return (sales || []).find(s => s.id === saleId);
  };

  const replaceAllSales = (newSales: Sale[]): void => {
    setSales(newSales);
  };

  return (
    <SalesContext.Provider value={{ sales: sales || [], addSale, returnSale, getSaleById, replaceAllSales }}>
      {children}
    </SalesContext.Provider>
  );
};

export const useSales = () => {
  const context = useContext(SalesContext);
  if (context === undefined) {
    throw new Error('useSales must be used within a SalesProvider');
  }
  return context;
};
