// src/components/products/ProductList.tsx
"use client";

import { useState, useMemo, useEffect }fsrom 'react';
import Link from 'next/link';
import { useProducts } from '@/contexts/ProductContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSales } from '@/contexts/SalesContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, Search, Edit3, Trash2, ShoppingCart, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function ProductList() {
  const { products, deleteProduct } = useProducts();
  const { hasRole, currentUser } = useAuth();
  const { addSale } = useSales();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [selectedProductForSale, setSelectedProductForSale] = useState<typeof products[0] | null>(null);
  const [saleQuantity, setSaleQuantity] = useState(1);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);


  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const handleSellProduct = (product: typeof products[0]) => {
    setSelectedProductForSale(product);
    setSaleQuantity(1); // Reset quantity
    setSellDialogOpen(true);
  };

  const confirmSale = async () => {
    if (!selectedProductForSale || !currentUser) return;
    if (saleQuantity <= 0) {
      toast({ title: "خطأ", description: "الكمية يجب أن تكون أكبر من صفر.", variant: "destructive" });
      return;
    }
    if (saleQuantity > selectedProductForSale.quantity) {
      toast({ title: "خطأ", description: `الكمية المطلوبة (${saleQuantity}) أكبر من المتوفر (${selectedProductForSale.quantity}).`, variant: "destructive" });
      return;
    }

    const saleResult = await addSale([{ productId: selectedProductForSale.id, quantity: saleQuantity }]);
    if (saleResult) {
      toast({ title: "تم البيع", description: `تم بيع ${saleQuantity} من ${selectedProductForSale.name}.` });
      setSellDialogOpen(false);
    }
  };
  
  const handleDeleteProduct = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (confirm(`هل أنت متأكد أنك تريد حذف المنتج "${product?.name}"؟ هذا الإجراء لا يمكن التراجع عنه.`)) {
      await deleteProduct(productId);
    }
  };

  if (!isClient) {
    return (
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
    );
  }


  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <CardTitle>قائمة المنتجات</CardTitle>
          <CardDescription>إجمالي المنتجات: {products?.length || 0}</CardDescription>
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
      <CardContent>
        {filteredProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم المنتج</TableHead>
                  <TableHead className="text-center">السعر</TableHead>
                  <TableHead className="text-center">الكمية</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-center">{product.price.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                       <Badge variant={product.quantity === 0 ? "destructive" : product.quantity < 10 ? "secondary" : "default"}>
                         {product.quantity}
                       </Badge>
                    </TableCell>
                    <TableCell className="text-center space-x-1 space-x-reverse">
                      <Button variant="ghost" size="icon" asChild title="عرض التفاصيل">
                        <Link href={`/dashboard/products/${product.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      {hasRole(['admin']) && (
                        <Button variant="ghost" size="icon" asChild title="تعديل المنتج">
                          <Link href={`/dashboard/products/${product.id}/edit`}>
                            <Edit3 className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                      {hasRole(['admin', 'employee', 'employee_return']) && (
                        <Button variant="outline" size="icon" onClick={() => handleSellProduct(product)} title="بيع المنتج" disabled={product.quantity === 0}>
                          <ShoppingCart className="h-4 w-4" />
                        </Button>
                      )}
                      {hasRole(['admin']) && (
                         <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="destructive" size="icon" title="حذف المنتج">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>تأكيد الحذف</DialogTitle>
                                <DialogDescription>
                                  هل أنت متأكد أنك تريد حذف المنتج "{product.name}"؟ لا يمكن التراجع عن هذا الإجراء.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter className="gap-2 sm:justify-start">
                                <DialogClose asChild>
                                  <Button type="button" variant="secondary">إلغاء</Button>
                                </DialogClose>
                                <Button type="button" variant="destructive" onClick={() => handleDeleteProduct(product.id)}>حذف</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            <Search size={48} className="mx-auto mb-2" />
            <p>لا توجد منتجات تطابق بحثك أو لم يتم إضافة منتجات بعد.</p>
          </div>
        )}
      </CardContent>

      {selectedProductForSale && (
        <Dialog open={sellDialogOpen} onOpenChange={setSellDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>بيع المنتج: {selectedProductForSale.name}</DialogTitle>
              <DialogDescription>
                الكمية المتوفرة: {selectedProductForSale.quantity} | السعر: {selectedProductForSale.price.toFixed(2)} للوحدة
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Label htmlFor="saleQuantity" className="whitespace-nowrap">الكمية المباعة:</Label>
                <Input
                  id="saleQuantity"
                  type="number"
                  value={saleQuantity}
                  onChange={(e) => setSaleQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  min="1"
                  max={selectedProductForSale.quantity}
                  className="w-full"
                />
              </div>
              <p className="text-lg font-semibold">الإجمالي: {(saleQuantity * selectedProductForSale.price).toFixed(2)}</p>
            </div>
            <DialogFooter className="gap-2 sm:justify-start">
               <DialogClose asChild>
                <Button type="button" variant="outline">إلغاء</Button>
               </DialogClose>
              <Button onClick={confirmSale} disabled={saleQuantity <= 0 || saleQuantity > selectedProductForSale.quantity}>تأكيد البيع</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
