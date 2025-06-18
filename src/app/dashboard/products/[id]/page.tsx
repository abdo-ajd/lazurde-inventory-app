
// src/app/dashboard/products/[id]/page.tsx
"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import JsBarcode from 'jsbarcode';
import { useProducts } from '@/contexts/ProductContext';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Edit3, Package, Tag, DollarSign, Layers, CalendarDays, History, Trash2, ShoppingBag, Printer } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Product } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as ShadcnDialogDescription, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useSales } from '@/contexts/SalesContext'; 

export default function ProductDetailsPage() {
  const { getProductById, deleteProduct } = useProducts();
  const { sales } = useSales(); 
  const params = useParams();
  const router = useRouter();
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null | undefined>(undefined);
  const [isFetching, setIsFetching] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const barcodeRef = useRef<SVGSVGElement>(null);

  const productId = typeof params.id === 'string' ? params.id : '';

  useEffect(() => {
    if (productId) {
      const fetchedProduct = getProductById(productId);
      setProduct(fetchedProduct);
    }
    setIsFetching(false);
  }, [productId, getProductById]);

  useEffect(() => {
    if (product && product.id && barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, product.id, {
          format: "CODE128",
          displayValue: true, 
          fontSize: 16,
          textMargin: 5,
          margin: 10,
          height: 70, 
          width: 1.8, 
        });
      } catch (e) {
        console.error("Barcode generation failed:", e);
        toast({ variant: "destructive", title: "فشل توليد الباركود", description: "حدث خطأ أثناء محاولة إنشاء الباركود." });
      }
    }
  }, [product, toast]);

  const quantitySold = useMemo(() => {
    if (!product || !sales) return 0;
    return sales.reduce((total, sale) => {
      if (sale.status === 'active') { 
        sale.items.forEach(item => {
          if (item.productId === product.id) {
            total += item.quantity;
          }
        });
      }
      return total;
    }, 0);
  }, [product, sales]);

  const handleDeleteProduct = async () => {
    if (!product) return;
    setIsDeleting(true);
    const success = await deleteProduct(product.id);
    setIsDeleting(false);
    if (success) {
      toast({title: "تم الحذف", description: `تم حذف المنتج "${product.name}" بنجاح.`});
      router.push('/dashboard/products');
    } else {
      // Error toast is handled by deleteProduct in context
    }
  };

  const handlePrintBarcode = () => {
    if (!barcodeRef.current || !product) return;

    const svgString = new XMLSerializer().serializeToString(barcodeRef.current);

    const printWindow = window.open('', '_blank', 'height=350,width=450');
    if (printWindow) {
        printWindow.document.write('<html><head><title>طباعة باركود المنتج</title>');
        printWindow.document.write(\`
            <style>
                body { 
                    margin: 5mm; 
                    font-family: 'Arial', sans-serif; 
                    text-align: center; 
                    display: flex; 
                    flex-direction: column; 
                    align-items: center; 
                    justify-content: center; 
                    height: calc(100vh - 10mm); 
                    overflow: hidden;
                }
                .barcode-area { 
                    display: inline-block; 
                    padding: 3mm; 
                    border: 1px dashed #ccc; 
                    width: 90%; /* Adjust width as needed for label */
                    max-width: 70mm; /* Max width for typical label */
                }
                .product-name-print { font-size: 10pt; margin-bottom: 2mm; font-weight: bold; word-break: break-word; }
                svg { 
                    width: 100% !important; /* Ensure SVG scales to container */
                    height: auto !important; 
                    max-height: 40mm; /* Adjust height as needed */
                }
                @media print {
                    body { margin: 0; padding: 0; width: 100%; height: 100%; }
                    .barcode-area { border: none; padding:0; margin: 0 auto; page-break-after: always; width: 100%; }
                }
            </style>
        \`);
        printWindow.document.write('</head><body>');
        printWindow.document.write('<div class="barcode-area">');
        if (product.name) {
            printWindow.document.write(\`<div class="product-name-print">\${product.name}</div>\`);
        }
        printWindow.document.write(svgString);
        printWindow.document.write('</div>');
        printWindow.document.write('</body></html>');
        printWindow.document.close();

        printWindow.onload = function() {
            printWindow.focus();
            printWindow.print();
            // printWindow.close(); // Let user close manually
        };
    } else {
        toast({
            variant: "destructive",
            title: "فشل الطباعة",
            description: "لم يتمكن المتصفح من فتح نافذة الطباعة. يرجى التحقق من إعدادات مانع النوافذ المنبثقة."
        });
    }
  };


  if (isFetching) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-96 w-full md:w-1/2 mx-auto mb-6 rounded-lg" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-1/4" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(5)].map((_, i) => ( 
              <div key={i} className="flex items-center space-x-reverse space-x-3">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-6 w-1/2" />
              </div>
            ))}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-10">
        <Package size={64} className="mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold">المنتج غير موجود</h1>
        <p className="text-muted-foreground mb-6">عذرًا، لم نتمكن من العثور على المنتج الذي طلبته.</p>
        <Button asChild>
          <Link href="/dashboard/products">
            <ArrowRight className="ml-2 h-4 w-4" />
            العودة إلى قائمة المنتجات
          </Link>
        </Button>
      </div>
    );
  }

  const formatDateTime = (isoString: string) => {
    if (!isoString) return 'N/A';
    try {
      return new Intl.DateTimeFormat('en-GB', { 
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric',
        hour12: true 
      }).format(new Date(isoString));
    } catch (e) {
      return 'Invalid Date';
    }
  };

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center">
                    <Package className="mr-3 text-primary" size={32} /> {product.name}
                </h1>
                <p className="text-muted-foreground font-body">
                تفاصيل المنتج الكاملة.
                </p>
            </div>
             <Button variant="outline" asChild>
                <Link href="/dashboard/products">
                    <ArrowRight className="ml-2 h-4 w-4" />
                    العودة إلى القائمة
                </Link>
            </Button>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
           <Card className="shadow-lg overflow-hidden">
             <CardHeader className="p-0 relative aspect-[3/4] w-full">
                <Image
                    src={product.imageUrl || 'https://placehold.co/300x450.png'}
                    alt={product.name}
                    layout="fill"
                    objectFit="cover"
                    data-ai-hint="abaya product detail"
                />
             </CardHeader>
             <CardContent className="p-4">
                <h3 className="font-semibold text-lg text-center">{product.name}</h3>
             </CardContent>
           </Card>
        </div>

        <div className="md:col-span-2">
            <Card className="shadow-lg h-full">
                <CardHeader>
                <CardTitle className="flex items-center">
                    <Tag className="mr-2 text-accent" />
                    معلومات المنتج
                </CardTitle>
                {/* Product ID text removed, barcode will be below */}
                </CardHeader>

                <div className="px-6 pb-4 flex flex-col items-center">
                  <svg ref={barcodeRef} className="w-full max-w-sm h-auto mb-2"></svg>
                  <Button variant="outline" size="sm" onClick={handlePrintBarcode} className="mt-2">
                      <Printer className="ml-2 h-4 w-4" /> طباعة الباركود
                  </Button>
                </div>
                
                <CardContent className="grid gap-6 sm:grid-cols-2 pt-0">
                <div className="flex items-start space-x-3 space-x-reverse">
                    <DollarSign className="h-5 w-5 mt-1 text-primary shrink-0" />
                    <div>
                    <p className="text-sm text-muted-foreground">السعر</p>
                    <p className="font-semibold text-lg">{product.price.toFixed(2)} LYD</p>
                    </div>
                </div>
                <div className="flex items-start space-x-3 space-x-reverse">
                    <Layers className="h-5 w-5 mt-1 text-primary shrink-0" />
                    <div>
                    <p className="text-sm text-muted-foreground">الكمية المتوفرة</p>
                    <Badge variant={product.quantity === 0 ? "destructive" : product.quantity < 10 ? "secondary" : "default"} className="text-lg px-3 py-1">
                        {product.quantity}
                    </Badge>
                    </div>
                </div>
                <div className="flex items-start space-x-3 space-x-reverse">
                    <ShoppingBag className="h-5 w-5 mt-1 text-primary shrink-0" />
                    <div>
                    <p className="text-sm text-muted-foreground">الكمية المباعة</p>
                    <p className="font-semibold text-lg">{quantitySold}</p>
                    </div>
                </div>
                <div className="flex items-start space-x-3 space-x-reverse">
                    <CalendarDays className="h-5 w-5 mt-1 text-primary shrink-0" />
                    <div>
                    <p className="text-sm text-muted-foreground">تاريخ الإنشاء</p>
                    <p className="font-semibold">{formatDateTime(product.createdAt)}</p>
                    </div>
                </div>
                <div className="flex items-start space-x-3 space-x-reverse">
                    <History className="h-5 w-5 mt-1 text-primary shrink-0" />
                    <div>
                    <p className="text-sm text-muted-foreground">آخر تحديث</p>
                    <p className="font-semibold">{formatDateTime(product.updatedAt)}</p>
                    </div>
                </div>
                </CardContent>
                {hasRole(['admin']) && (
                <CardFooter className="flex justify-start gap-2">
                    <Button asChild>
                      <Link href={`/dashboard/products/${product.id}/edit`}>
                          <Edit3 className="ml-2 h-4 w-4" /> تعديل المنتج
                      </Link>
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="destructive" disabled={isDeleting}>
                          <Trash2 className="ml-2 h-4 w-4" /> {isDeleting ? 'جاري الحذف...' : 'حذف المنتج'}
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
                            <Button type="button" variant="secondary" disabled={isDeleting}>إلغاء</Button>
                          </DialogClose>
                          <Button type="button" variant="destructive" onClick={handleDeleteProduct} disabled={isDeleting}>
                            {isDeleting ? 'جاري الحذف...' : 'حذف'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                </CardFooter>
                )}
            </Card>
        </div>
      </div>
    </div>
  );
}

