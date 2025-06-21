
// src/contexts/SalesContext.tsx
"use client";

import type { Sale, SaleItem } from '@/lib/types';
import { createContext, useContext, ReactNode, useState } from 'react'; // Added useState
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { LOCALSTORAGE_KEYS, INITIAL_SALES } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { useProducts } from './ProductContext';
import { useAuth } from './AuthContext';
import { useAppSettings } from './AppSettingsContext';

interface SalesContextType {
  sales: Sale[];
  addSale: (items: Omit<SaleItem, 'productName' | 'pricePerUnit'>[]) => Promise<Sale | null>;
  returnSale: (saleId: string) => Promise<boolean>;
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
  const { currentUser } = useAuth();
  const { settings } = useAppSettings();
  const [currentDiscount, setCurrentDiscount] = useState<number>(0);
  
  const formatNumber = (num: number) => {
    // Check if the number has any decimal part
    if (num % 1 !== 0) {
      return parseFloat(num.toFixed(2));
    }
    // If it's a whole number, return it as is
    return num;
  };


  const addSale = async (rawItems: Omit<SaleItem, 'productName' | 'pricePerUnit'>[]): Promise<Sale | null> => {
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
      });
      currentOriginalTotalAmount += product.price * rawItem.quantity;
      totalCostPrice += (product.costPrice || 0) * rawItem.quantity;
    }
    
    const totalProfit = currentOriginalTotalAmount - totalCostPrice;
    const discountToApply = Math.max(0, currentDiscount);
    
    // New validation: check if discount exceeds profit
    if (discountToApply > totalProfit) {
      toast({
        variant: "destructive",
        title: "خصم غير مقبول",
        description: "الخصم المطلوب يتجاوز الحد المسموح به لهذه العملية.",
      });

      if (settings.invalidDiscountSound && settings.invalidDiscountSound.startsWith('data:audio')) {
        try {
          const audio = new Audio(settings.invalidDiscountSound);
          audio.play().catch(error => console.warn("Error playing invalid discount sound:", error));
        } catch (error) {
          console.warn("Could not play invalid discount sound:", error);
        }
      }
      setCurrentDiscount(0); // Reset discount on rejected sale
      return null; // Block the sale
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
    };

    setSales(prevSales => [newSale, ...(prevSales || [])]);
    let toastMessage = `تم تسجيل البيع بنجاح. الإجمالي: ${newSale.totalAmount}`;
    if (discountToApply > 0) {
        toastMessage += ` (بعد خصم ${newSale.discountAmount})`;
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
    
    setCurrentDiscount(0); // Reset discount after successful sale

    return newSale;
  };

  const returnSale = async (saleId: string): Promise<boolean> => {
    const currentSalesData = sales || [];
    const saleToReturn = currentSalesData.find(s => s.id === saleId);
    if (!saleToReturn) {
      toast({ title: "خطأ", description: "عملية البيع غير موجودة.", variant: "destructive" });
      return false;
    }
    if (saleToReturn.status === 'returned') {
      toast({ title: "معلومة", description: "عملية البيع هذه تم إرجاعها بالفعل."});
      return false;
    }

    for (const item of saleToReturn.items) {
      const success = await updateProductQuantity(item.productId, item.quantity); // Return items to stock
      if (!success) {
        // Even if one item fails, proceed to mark sale as returned but log error or notify
        toast({ title: "خطأ في الإرجاع", description: `فشل تحديث كمية المنتج "${item.productName}"، ولكن سيتم إكمال عملية الإرجاع.`, variant: "destructive" });
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

  const replaceAllSales = (newSalesData: Sale[]): void => {
    setSales(newSalesData);
  };

  return (
    <SalesContext.Provider value={{ sales: sales || [], addSale, returnSale, getSaleById, replaceAllSales, currentDiscount, setCurrentDiscount }}>
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
