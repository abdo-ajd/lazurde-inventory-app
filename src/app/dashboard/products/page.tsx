// src/app/dashboard/products/page.tsx
"use client";
import ProductList from '@/components/products/ProductList';

export default function ProductsPage() {
  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">إدارة المنتجات</h1>
        <p className="text-muted-foreground font-body">
          عرض، إضافة، تعديل، وحذف المنتجات في المخزون.
        </p>
      </div>
      <ProductList />
    </div>
  );
}
