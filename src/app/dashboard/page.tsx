// src/app/dashboard/page.tsx
"use client";
import ProductList from '@/components/products/ProductList';
import { useSearchParams } from 'next/navigation'; 
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, Barcode as BarcodeIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState, KeyboardEvent } from 'react';
import { useProducts } from '@/contexts/ProductContext';
import { useSales } from '@/contexts/SalesContext';
import { useToast } from '@/hooks/use-toast';

export default function DashboardHomePage() {
  const searchParams = useSearchParams();
  const { hasRole, currentUser } = useAuth();
  const { getProductByBarcode } = useProducts();
  const { addSale } = useSales();
  const { toast } = useToast();

  const searchTerm = searchParams.get('q') || '';
  const [scannedBarcode, setScannedBarcode] = useState('');

  const handleBarcodeScan = async () => {
    if (!scannedBarcode.trim()) return;

    const product = getProductByBarcode(scannedBarcode.trim());

    if (product) {
      if (product.quantity > 0) {
        if (currentUser) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const saleResult = await addSale([{ productId: product.id, quantity: 1 }]);
          // Toast for successful sale is handled by addSale now
        } else {
          toast({ variant: "destructive", title: "خطأ", description: "يجب تسجيل الدخول لإتمام عملية البيع." });
        }
      } else {
        toast({ variant: "destructive", title: "نفذت الكمية", description: `المنتج "${product.name}" غير متوفر حالياً.` });
      }
    } else {
      toast({ variant: "destructive", title: "لم يتم العثور على المنتج", description: "الباركود المدخل غير صحيح أو المنتج غير موجود." });
    }
    setScannedBarcode(''); // Clear input after processing
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault(); // Prevent form submission if it's part of a form
      handleBarcodeScan();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">المنتجات (صور)</h1>
        </div>
        {/* Barcode Scan Input - Moved to be more prominent for scan-to-sell */}
        {hasRole(['admin', 'employee', 'employee_return']) && (
          <div className="relative w-full md:w-auto md:flex-grow md:max-w-xs">
            <BarcodeIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="امسح الباركود للبيع السريع..."
              value={scannedBarcode}
              onChange={(e) => setScannedBarcode(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full pr-10 pl-4 py-2 h-10 text-sm"
              aria-label="إدخال الباركود للبيع"
            />
          </div>
        )}
        {/* "Add Product" button for this page remains in the header */}
      </div>
      
      <ProductList searchTerm={searchTerm} />
    </div>
  );
}
