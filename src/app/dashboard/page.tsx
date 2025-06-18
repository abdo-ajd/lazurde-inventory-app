// src/app/dashboard/page.tsx
"use client";
import ProductList from '@/components/products/ProductList';
import { useSearchParams } from 'next/navigation'; 

export default function DashboardHomePage() {
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get('q') || '';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">المنتجات (صور)</h1>
      </div>
      
      <ProductList searchTerm={searchTerm} />
    </div>
  );
}
