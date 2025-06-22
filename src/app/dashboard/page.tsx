
// src/app/dashboard/page.tsx
"use client";
import ProductList from '@/components/products/ProductList';
import { useSearchParams } from 'next/navigation'; 
// import { Input } from '@/components/ui/input'; // No longer needed here
// import { Button } from '@/components/ui/button'; // No longer needed here for Add Product
// import Link from 'next/link'; // No longer needed here for Add Product
// import { PlusCircle, Barcode as BarcodeIcon } from 'lucide-react'; // No longer needed here
// import { useAuth } from '@/contexts/AuthContext'; // No longer needed here for barcode roles
// import { useState, KeyboardEvent } from 'react'; // No longer needed here for barcode state/handler
// import { useProducts } from '@/contexts/ProductContext'; // No longer needed here for barcode
// import { useSales } from '@/contexts/SalesContext'; // No longer needed here for barcode
// import { useToast } from '@/hooks/use-toast'; // No longer needed here for barcode

export default function DashboardHomePage() {
  const searchParams = useSearchParams();
  // const { hasRole, currentUser } = useAuth(); // Moved to Header for barcode
  // const { getProductByBarcode } = useProducts(); // Moved to Header
  // aconst { addSale } = useSales(); // Moved to Header
  // const { toast } = useToast(); // Moved to Header

  const searchTerm = searchParams.get('q') || '';
  // const [scannedBarcode, setScannedBarcode] = useState(''); // Moved to Header

  // const handleBarcodeScan = async () => { ... }; // Moved to Header
  // const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => { ... }; // Moved to Header

  return (
    <div>
      {/* Title has been removed as requested */}
      <ProductList searchTerm={searchTerm} />
    </div>
  );
}
