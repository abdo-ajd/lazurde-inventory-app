// src/app/dashboard/page.tsx
"use client";
import ProductList from '@/components/products/ProductList';

export default function DashboardHomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">قائمة المنتجات</h1>
        <p className="text-muted-foreground font-body">
          عرض وإدارة المنتجات في المخزون.
        </p>
      </div>
      <ProductList />
    </div>
  );
}
