
// src/contexts/SalesContext.tsx
"use client";

import type { Product, Sale, SaleItem } from '@/lib/types';
import { createContext, useContext, ReactNode, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { LOCALSTORAGE_KEYS, INITIAL_SALES } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { useProducts } from './ProductContext';
import { useAuth } from './AuthContext';

interface SalesContextType {
  sales: Sale[];
  addSale: (items: Omit<SaleItem, 'productName' | 'pricePerUnit' | 'returnedQuantity'>[], paymentMethod?: string) => Promise<Sale | null>;
  processReturn: (saleId: string, itemsToReturn: { productId: string; quantity: number }[]) => Promise<boolean>;
  getSaleById: (saleId: string) => Sale | undefined;
  replaceAllSales: (newSales: Sale[]) => void;
  currentDiscount: number;
  setCurrentDiscount: (value: number) => void;
}

const SalesContext = createContext<SalesContextType | undefined>(undefined);

export const SalesProvider = ({ children }: { children: ReactNode }) => {
  const [sales, setSales] = useLocalStorage<Sale[]>(LOCALSTORAGE_KEYS.SALES, INITIAL_SALES);
  const { toast } = useToast();
  const { getProductById, updateProductQuantity } = useProducts();
  const { currentUser, hasRole } = useAuth();
  const [currentDiscount, setCurrentDiscount] = useState<number>(0);

  const formatNumber = (num: number) => {
    return num % 1 !== 0 ? parseFloat(num.toFixed(2)) : num;
  };

  const addSale = async (rawItems: Omit<SaleItem, 'productName' | 'pricePerUnit' | 'returnedQuantity'>[], paymentMethod: string = 'نقدي'): Promise<Sale | null> => {
    if (!currentUser) {
      toast({ title: "خطأ", description: "يجب تسجيل الدخول لتسجيل عملية بيع.", variant: "destructive" });
      return null;
    }
    const saleItems: SaleItem[] = [];
    let currentOriginalTotalAmount = 0;
    let totalCostPrice = 0;

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
        returnedQuantity: 0,
      });
      currentOriginalTotalAmount += product.price * rawItem.quantity;
      if (hasRole(['admin'])) {
        totalCostPrice += (product.costPrice || 0) * rawItem.quantity;
      }
    }
    
    let totalProfit = 0;
    if (hasRole(['admin'])) {
      totalProfit = currentOriginalTotalAmount - totalCostPrice;
    }

    const discountToApply = Math.max(0, currentDiscount);
    
    if (hasRole(['admin']) && discountToApply > totalProfit && totalProfit > 0) {
      toast({
        variant: "destructive",
        title: "خصم غير مقبول",
        description: "الخصم المطلوب يتجاوز الحد المسموح به لهذه العملية.",
      });
      setCurrentDiscount(0);
      return null;
    }

    const finalTotalAmount = Math.max(0, currentOriginalTotalAmount - discountToApply);

    if (discountToApply > 0 && discountToApply > currentOriginalTotalAmount) {
        toast({ title: "تنبيه", description: "قيمة الخصم أكبر من إجمالي الفاتورة. تم تطبيق خصم بقيمة الفاتورة.", variant: "default" });
    }

    for (const item of saleItems) {
      const success = await updateProductQuantity(item.productId, -item.quantity);
      if (!success) {
        toast({ title: "خطأ فادح", description: "فشل تحديث كمية المنتج. تم إلغاء البيع.", variant: "destructive" });
        return null;
      }
    }
    
    const newSale: Sale = {
      id: `sale_${Date.now()}`,
      items: saleItems,
      originalTotalAmount: formatNumber(currentOriginalTotalAmount),
      discountAmount: formatNumber(discountToApply),
      totalAmount: formatNumber(finalTotalAmount),
      saleDate: new Date().toISOString(),
      sellerId: currentUser.id,
      sellerUsername: currentUser.username,
      status: 'active',
      paymentMethod: paymentMethod,
    };

    setSales(prevSales => [newSale, ...(prevSales || [])]);
    let toastMessage = `تم تسجيل البيع بنجاح. الإجمالي: ${newSale.totalAmount}`;
    if (discountToApply > 0) {
        toastMessage += ` (بعد خصم ${newSale.discountAmount})`;
    }
    toast({ title: "نجاح", description: toastMessage });

    try {
      // Play the hardcoded sound for a successful sale
      const audio = new Audio('/sounds/sale-success.mp3');
      audio.play().catch(error => console.warn("Error playing sale success sound:", error));
    } catch (error) {
      console.warn("Could not play sale success sound:", error);
    }
    
    setCurrentDiscount(0); // Reset discount after successful sale

    return newSale;
  };
  
  const processReturn = async (saleId: string, itemsToReturn: { productId: string; quantity: number }[]): Promise<boolean> => {
    const currentSales = sales || [];
    const saleIndex = currentSales.findIndex(s => s.id === saleId);
    if (saleIndex === -1) {
      toast({ title: "خطأ", description: "عملية البيع غير موجودة.", variant: "destructive" });
      return false;
    }
    
    const originalSale = currentSales[saleIndex];
    if (originalSale.status === 'returned') {
        toast({ title: "معلومة", description: "لا يمكن تعديل عملية بيع مرتجعة بالكامل."});
        return false;
    }
    
    // Create a mutable copy to work with
    const saleToUpdate = JSON.parse(JSON.stringify(originalSale));
    let somethingWasReturned = false;

    for (const itemToReturn of itemsToReturn) {
        if (itemToReturn.quantity <= 0) continue;

        const saleItem = saleToUpdate.items.find((i: SaleItem) => i.productId === itemToReturn.productId);
        if (!saleItem) continue;

        const maxReturnable = saleItem.quantity - (saleItem.returnedQuantity || 0);
        const actualReturnQty = Math.min(itemToReturn.quantity, maxReturnable);

        if (actualReturnQty > 0) {
            saleItem.returnedQuantity = (saleItem.returnedQuantity || 0) + actualReturnQty;
            somethingWasReturned = true;
            await updateProductQuantity(itemToReturn.productId, actualReturnQty); // Add stock back
        }
    }

    if (!somethingWasReturned) {
        toast({ title: "لم يتم الإرجاع", description: "لم يتم تحديد كميات صالحة للإرجاع." });
        return false;
    }

    // Recalculate totals based on net quantities sold
    const newOriginalTotalAmount = saleToUpdate.items.reduce((sum: number, item: SaleItem) => {
        const netQuantity = item.quantity - item.returnedQuantity;
        return sum + (netQuantity * item.pricePerUnit);
    }, 0);
    
    // Pro-rate the discount
    const originalTotalBeforeReturn = saleToUpdate.items.reduce((sum: number, item: SaleItem) => sum + item.quantity * item.pricePerUnit, 0);
    const discountRatio = originalTotalBeforeReturn > 0 ? saleToUpdate.discountAmount / originalTotalBeforeReturn : 0;
    const newDiscountAmount = newOriginalTotalAmount * discountRatio;
    
    saleToUpdate.totalAmount = formatNumber(newOriginalTotalAmount - newDiscountAmount);
    
    // Check if the whole sale is now returned
    const allItemsReturned = saleToUpdate.items.every((item: SaleItem) => (item.returnedQuantity || 0) === item.quantity);
    if (allItemsReturned) {
        saleToUpdate.status = 'returned';
        saleToUpdate.returnedDate = new Date().toISOString();
        saleToUpdate.totalAmount = 0; // If all items are returned, net total is 0.
    }

    const newSales = [...currentSales];
    newSales[saleIndex] = saleToUpdate;
    setSales(newSales);
    
    toast({ title: "نجاح", description: "تم تحديث عملية البيع وإرجاع المنتجات." });
    return true;
  };


  const getSaleById = (saleId: string): Sale | undefined => {
    return (sales || []).find(s => s.id === saleId);
  };

  const replaceAllSales = (newSalesData: Sale[]): void => {
    setSales(newSalesData);
  };

  return (
    <SalesContext.Provider value={{ sales: sales || [], addSale, processReturn, getSaleById, replaceAllSales, currentDiscount, setCurrentDiscount }}>
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
