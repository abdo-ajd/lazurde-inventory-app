
// src/app/dashboard/products/page.tsx
"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useProducts } from '@/contexts/ProductContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, Search, Edit3, Trash2, PackageSearch, ListOrdered } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription as ShadcnDialogDescription, DialogClose } from '@/components/ui/dialog';
import type { Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useSearchParams, useRouter } from 'next/navigation';

export default function ProductsManagementPage() {
  const { products, deleteProduct } = useProducts();
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const headerSearchTerm = searchParams.get('q') || ''; // Search term from header
  
  const [localSearchTerm, setLocalSearchTerm] = useState(''); // Local search for this page
  const [isClient, setIsClient] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
    // Sync local search with header search if header search exists, otherwise use local
    setLocalSearchTerm(headerSearchTerm);
  }, [headerSearchTerm]);
  
  const handleLocalSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setLocalSearchTerm(newSearchTerm);
    // Update URL q param for header search to pick up, or to persist state
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    if (newSearchTerm.trim()) {
      current.set('q', newSearchTerm.trim());
    } else {
      current.delete('q');
    }
    const search = current.toString();
    const query = search ? `?${search}` : '';
    router.push(`/dashboard/products${query}`, { scroll: false });
  };


  const filteredProducts = useMemo(() => {
    if (!products) return [];
    const termToFilter = localSearchTerm.toLowerCase();
    return products.filter(product =>
      product.name.toLowerCase().includes(termToFilter)
    );
  }, [products, localSearchTerm]);

  const handleDeleteProduct = async (productId: string, productName: string) => {
    setIsDeleting(productId);
    const success = await deleteProduct(productId);
    setIsDeleting(null);
    if (success) {
      toast({ title: "تم الحذف", description: `تم حذف المنتج "${productName}" بنجاح.` });
    }
  };

  if (!isClient) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
            <div className="h-10 w-1/3 bg-muted animate-pulse rounded-md"></div>
            <div className="h-10 w-1/4 bg-muted animate-pulse rounded-md"></div>
        </div>
        <Card>
          <CardHeader>
            <div className="h-8 w-1/2 bg-muted animate-pulse rounded-md"></div>
            <div className="h-6 w-1/3 bg-muted animate-pulse rounded-md mt-2"></div>
          </CardHeader>
          <CardContent>
            <div className="h-10 w-full bg-muted animate-pulse rounded-md mb-4"></div>
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 w-full bg-muted animate-pulse rounded-md"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasRole(['admin'])) {
    return <p className="p-4 text-destructive">ليس لديك صلاحية الوصول لهذه الصفحة.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center">
                <ListOrdered className="mr-3 text-primary" size={32} /> إدارة المنتجات
            </h1>
            <p className="text-muted-foreground font-body">
            عرض وتعديل وحذف المنتجات من القائمة.
            </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/products/add">
            <PlusCircle className="ml-2 h-4 w-4" /> إضافة منتج جديد
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>قائمة المنتجات</CardTitle>
            <div className="relative w-full md:w-72">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="ابحث بالاسم..."
                value={localSearchTerm}
                onChange={handleLocalSearchChange}
                className="w-full pr-10"
                aria-label="البحث عن منتج"
              />
            </div>
          </div>
          <CardDescription>إجمالي المنتجات: {filteredProducts.length}</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">الصورة</TableHead>
                    <TableHead>اسم المنتج</TableHead>
                    <TableHead className="text-right">السعر</TableHead>
                    <TableHead className="text-center">الكمية</TableHead>
                    <TableHead className="text-center">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Link href={`/dashboard/products/${product.id}`} passHref>
                           <div className="relative w-16 h-20 rounded overflow-hidden border cursor-pointer hover:opacity-80 transition-opacity">
                            <Image
                                src={product.imageUrl || 'https://placehold.co/80x100.png'}
                                alt={product.name}
                                layout="fill"
                                objectFit="cover"
                                data-ai-hint="product thumbnail abaya"
                            />
                           </div>
                        </Link>
                      </TableCell>
                      <TableCell className="font-medium">
                        <Link href={`/dashboard/products/${product.id}`} className="hover:underline">
                          {product.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right">{product.price.toFixed(2)} LYD</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={product.quantity === 0 ? "destructive" : product.quantity < 10 ? "secondary" : "default"}>
                            {product.quantity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center space-x-1 space-x-reverse">
                        <Button variant="ghost" size="icon" asChild title="تعديل المنتج">
                          <Link href={`/dashboard/products/${product.id}/edit`}>
                            <Edit3 className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="destructive" size="icon" title="حذف المنتج" disabled={isDeleting === product.id}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>تأكيد الحذف</DialogTitle>
                              <ShadcnDialogDescription>
                                هل أنت متأكد أنك تريد حذف المنتج "{product.name}"؟ لا يمكن التراجع عن هذا الإجراء.
                              </ShadcnDialogDescription>
                            </DialogHeader>
                            <DialogFooter className="gap-2 sm:justify-start">
                              <DialogClose asChild>
                                <Button type="button" variant="secondary" disabled={isDeleting === product.id}>إلغاء</Button>
                              </DialogClose>
                              <Button
                                type="button"
                                variant="destructive"
                                onClick={() => handleDeleteProduct(product.id, product.name)}
                                disabled={isDeleting === product.id}
                              >
                                {isDeleting === product.id ? 'جاري الحذف...' : 'حذف'}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <PackageSearch size={48} className="mx-auto mb-2" />
              <p>
                {localSearchTerm
                  ? "لا توجد منتجات تطابق بحثك."
                  : products.length === 0 ? "لم يتم إضافة منتجات بعد. قم بإضافة منتج جديد للبدء." : "لا توجد منتجات."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
