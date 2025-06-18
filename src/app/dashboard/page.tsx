// src/app/dashboard/page.tsx
"use client";
import ProductList from '@/components/products/ProductList';
import { useSearchParams } from 'next/navigation'; // Import useSearchParams

export default function DashboardHomePage() {
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get('q') || '';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">قائمة المنتجات</h1>
      </div>
      
      {/* Search and Add Product button are now in the Header */}
      {/* The div that contained them is removed */}

      <ProductList searchTerm={searchTerm} />
    </div>
  );
}
