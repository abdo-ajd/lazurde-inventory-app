// src/app/dashboard/products/page.tsx
"use client";
import ProductList from '@/components/products/ProductList';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, Search } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function ProductsPage() {
  const { hasRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">إدارة المنتجات</h1>
        {/* النص الوصفي تم إزالته */}
      </div>

      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
             {/* CardTitle and CardDescription for total products count will be handled within ProductList or a summary component */}
          </div>
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="ابحث عن منتج..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10"
                aria-label="البحث عن منتج"
              />
            </div>
            {hasRole(['admin']) && (
              <Button asChild className="w-full md:w-auto">
                <Link href="/dashboard/products/add">
                  <PlusCircle className="ml-2 h-4 w-4" /> إضافة منتج
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      <ProductList searchTerm={searchTerm} />
    </div>
  );
}
