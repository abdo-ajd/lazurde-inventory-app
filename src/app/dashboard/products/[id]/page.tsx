
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
    if (product && product.barcodeValue && barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, product.barcodeValue, {
          format: "CODE128",
          displayValue: true,
          fontSize: 10, // Kept from "صغر كل شي"
          textMargin: 0, // Kept
          margin: 2,     // Kept
          height: 30,    // Reverted from extreme shortening, this was from "صغر كل شي"
          width: 2,      // Kept
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
    }
  };

  const handlePrintBarcode = () => {
    if (!barcodeRef.current || !product || !product.barcodeValue) return;
    const svgString = new XMLSerializer().serializeToString(barcodeRef.current);
    const printWindow = window.open('', '_blank', 'height=150,width=250');
    if (printWindow) {
        printWindow.document.write('<html><head><title>طباعة باركود المنتج</title>');
        const styleContent =
            '<style>' +
            'body { margin: 1mm; font-family: "Arial", sans-serif; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; height: calc(100vh - 2mm); overflow: hidden;}' +
            '.barcode-area { display: inline-block; padding: 0.25mm; border: 0.25px dashed #ccc; width: 98%; max-width: 40mm;}' +
            '.product-name-print { font-size: 6pt; margin-bottom: 0.1mm; font-weight: bold; word-break: break-word; }' + // font-size was 8pt, reduced to 6pt
            'svg { width: 100% !important; height: auto !important; max-height: 10mm; }' + // max-height was 20mm, reduced to 10mm
            '@media print { body { margin: 0; padding: 0; width: 100%; height: 100%; } .barcode-area { border: none; padding:0; margin: 0 auto; page-break-after: always; width: 100%; }}' +
            '</style>';
        printWindow.document.write(styleContent);
        printWindow.document.write('</head><body>');
        printWindow.document.write('<div class="barcode-area">');
        if (product.name) {
            printWindow.document.write(`<div class="product-name-print">${product.name}</div>`);
        }
        printWindow.document.write(svgString);
        printWindow.document.write('</div>');
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.onload = function() {
            printWindow.focus();
            printWindow.print();
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
    // Skeletons from "صغر كل شي" version
    return (
      <div className="space-y-1.5">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-40 w-full md:w-1/3 mx-auto mb-1.5 rounded-sm" />
        <Card className="shadow-sm">
          <CardHeader className="p-1.5">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-1.5 w-1/4 mt-0.5" />
          </CardHeader>
          <CardContent className="space-y-1 p-1.5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-reverse space-x-0.5">
                <Skeleton className="h-2.5 w-2.5 rounded-full" />
                <Skeleton className="h-2.5 w-1/5" />
                <Skeleton className="h-2.5 w-2/5" />
              </div>
            ))}
          </CardContent>
          <CardFooter className="flex justify-between p-1.5">
            <Skeleton className="h-5 w-10" />
            <Skeleton className="h-5 w-10" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!product) {
     // Sizes from "صغر كل شي" version
    return (
      <div className="text-center py-3">
        <Package size={28} className="mx-auto text-muted-foreground mb-0.5" />
        <h1 className="text-sm font-bold">المنتج غير موجود</h1>
        <p className="text-[10px] text-muted-foreground mb-1.5">عذرًا، لم نتمكن من العثور على المنتج الذي طلبته.</p>
        <Button size="xs" className="h-6 px-1.5 text-[10px]" asChild>
          <Link href="/dashboard/products">
            <span className="flex items-center">
                <ArrowRight className="ml-0.5 h-2 w-2" />
                العودة إلى قائمة المنتجات
            </span>
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

  // Main layout from "صغر كل شي" version
  return (
    <div className="space-y-1.5">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-sm font-bold tracking-tight font-headline flex items-center">
                    <Package className="mr-1 text-primary" size={14} /> {product.name}
                </h1>
                <p className="text-[8px] text-muted-foreground font-body mt-0">
                تفاصيل المنتج الكاملة.
                </p>
            </div>
             <Button variant="outline" size="xs" asChild className="h-5 px-1 text-[9px]">
                <Link href="/dashboard/products">
                  <span className="flex items-center">
                    <ArrowRight className="ml-0.5 h-2 w-2" />
                    للقائمة
                  </span>
                </Link>
            </Button>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5">
        <div className="md:col-span-1">
           <Card className="shadow-sm overflow-hidden">
             <CardHeader className="p-0 relative aspect-[3/4] w-full">
                <Image
                    src={product.imageUrl || 'https://placehold.co/200x266.png'}
                    alt={product.name}
                    layout="fill"
                    objectFit="cover"
                    data-ai-hint="abaya product detail"
                />
             </CardHeader>
             <CardContent className="p-0.5"> {/* Further reduced padding for image card content */}
                <h3 className="font-semibold text-[9px] text-center truncate" title={product.name}>{product.name}</h3> {/* Further reduced font size */}
             </CardContent>
           </Card>
        </div>

        <div className="md:col-span-2">
            <Card className="shadow-sm h-full"> {/* This is the "toolbox" */}
                <CardHeader className="pb-0 pt-1 px-1"> {/* Further reduced padding */}
                <CardTitle className="flex items-center text-[10px]"> {/* Further reduced font size */}
                    <Tag className="mr-0.5 text-accent h-2 w-2" /> {/* Further reduced icon size & margin */}
                    معلومات المنتج
                </CardTitle>
                </CardHeader>

                <div className="px-1 pb-0 flex flex-col items-center mb-0.25"> {/* Further reduced padding and margin */}
                  {product.barcodeValue ? (
                    <>
                      <svg ref={barcodeRef} className="w-full max-w-[70px] h-auto mb-0"></svg> {/* Further reduced max-width */}
                      <div className="flex gap-px mt-0"> {/* Reduced gap */}
                        <Button variant="outline" size="icon-xs" onClick={handlePrintBarcode} className="h-3.5 w-3.5"> {/* Further reduced button size */}
                            <Printer className="h-1.5 w-1.5" /> {/* Further reduced icon size */}
                        </Button>
                        {hasRole(['admin']) && (
                          <Button variant="outline" size="icon-xs" asChild className="h-3.5 w-3.5"> {/* Further reduced button size */}
                            <Link href={`/dashboard/products/${product.id}/edit`}>
                              <span className="flex items-center">
                                <Edit3 className="h-1.5 w-1.5" /> {/* Further reduced icon size */}
                               </span>
                            </Link>
                          </Button>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-0.25"> {/* Further reduced padding */}
                      <p className="text-[7px] text-muted-foreground mb-0.25">لم يتم تعيين باركود.</p> {/* Further reduced font size */}
                      {hasRole(['admin']) && (
                        <Button variant="outline" size="xs" asChild className="h-3.5 px-0.5 text-[7px]"> {/* Further reduced button size and text */}
                          <Link href={`/dashboard/products/${product.id}/edit`}>
                            <span className="flex items-center">
                                <Edit3 className="ml-0.5 h-1 w-1" /> إضافة/تعديل {/* Further reduced icon size */}
                            </span>
                          </Link>
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                <CardContent className="grid gap-px sm:grid-cols-2 pt-0.25 px-1 pb-0.5"> {/* Further reduced padding and gap */}
                <div className="flex items-start space-x-0.5 space-x-reverse">
                    <DollarSign className="h-2 w-2 mt-px text-primary shrink-0" /> {/* Further reduced icon size */}
                    <div>
                    <p className="text-[7px] text-muted-foreground">السعر</p> {/* Further reduced font size */}
                    <p className="font-semibold text-[9px]">{product.price.toFixed(2)} LYD</p> {/* Further reduced font size */}
                    </div>
                </div>
                <div className="flex items-start space-x-0.5 space-x-reverse">
                    <Layers className="h-2 w-2 mt-px text-primary shrink-0" />
                    <div>
                    <p className="text-[7px] text-muted-foreground">الكمية المتوفرة</p>
                    <Badge variant={product.quantity === 0 ? "destructive" : product.quantity < 10 ? "secondary" : "default"} className="text-[8px] px-1 py-0 font-normal"> {/* Further reduced font size */}
                        {product.quantity}
                    </Badge>
                    </div>
                </div>
                <div className="flex items-start space-x-0.5 space-x-reverse">
                    <ShoppingBag className="h-2 w-2 mt-px text-primary shrink-0" />
                    <div>
                    <p className="text-[7px] text-muted-foreground">الكمية المباعة</p>
                    <p className="font-semibold text-[9px]">{quantitySold}</p>
                    </div>
                </div>
                <div className="flex items-start space-x-0.5 space-x-reverse">
                    <CalendarDays className="h-2 w-2 mt-px text-primary shrink-0" />
                    <div>
                    <p className="text-[7px] text-muted-foreground">تاريخ الإنشاء</p>
                    <p className="font-semibold text-[8px]">{formatDateTime(product.createdAt)}</p> {/* Further reduced font size */}
                    </div>
                </div>
                <div className="flex items-start space-x-0.5 space-x-reverse">
                    <History className="h-2 w-2 mt-px text-primary shrink-0" />
                    <div>
                    <p className="text-[7px] text-muted-foreground">آخر تحديث</p>
                    <p className="font-semibold text-[8px]">{formatDateTime(product.updatedAt)}</p>
                    </div>
                </div>
                </CardContent>
                {hasRole(['admin']) && (
                <CardFooter className="flex justify-start gap-0.5 p-0.5 pt-0"> {/* Further reduced padding */}
                    <Button size="xs" asChild className="h-4 px-0.5 text-[8px]"> {/* Further reduced button size and text */}
                      <Link href={`/dashboard/products/${product.id}/edit`}>
                          <span className="flex items-center">
                            <Edit3 className="ml-0.5 h-1 w-1" /> تعديل {/* Further reduced icon size */}
                          </span>
                      </Link>
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="destructive" size="xs" className="h-4 px-0.5 text-[8px]" disabled={isDeleting}> {/* Further reduced button size and text */}
                          <Trash2 className="ml-0.5 h-1 w-1" /> {isDeleting ? '...' : 'حذف'} {/* Further reduced icon size */}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[300px]"> {/* Further reduced max-width */}
                        <DialogHeader>
                          <DialogTitle className="text-[10px]">تأكيد الحذف</DialogTitle> {/* Further reduced font size */}
                          <ShadcnDialogDescription className="text-[9px]"> {/* Further reduced font size */}
                            هل أنت متأكد أنك تريد حذف المنتج "{product.name}"؟ لا يمكن التراجع عن هذا الإجراء.
                          </ShadcnDialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-0.5 sm:justify-start">
                          <DialogClose asChild>
                            <Button type="button" variant="secondary" size="xs" className="h-4 px-0.5 text-[8px]" disabled={isDeleting}>إلغاء</Button> {/* Further reduced button size and text */}
                          </DialogClose>
                          <Button type="button" variant="destructive" size="xs" className="h-4 px-0.5 text-[8px]" onClick={handleDeleteProduct} disabled={isDeleting}> {/* Further reduced button size and text */}
                            {isDeleting ? '...' : 'حذف'}
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
