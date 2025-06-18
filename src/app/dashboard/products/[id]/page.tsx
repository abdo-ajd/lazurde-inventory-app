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
          fontSize: 10, // Smaller font size for barcode text
          textMargin: 1, 
          margin: 3, 
          height: 25, // Shorter barcode height
          width: 1.5, // Thinner barcode lines
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

    const printWindow = window.open('', '_blank', 'height=250,width=350'); 
    if (printWindow) {
        printWindow.document.write('<html><head><title>طباعة باركود المنتج</title>');
        
        const styleContent = 
            '<style>' +
            'body { ' +
            '    margin: 3mm; ' +
            '    font-family: "Arial", sans-serif; ' +
            '    text-align: center; ' +
            '    display: flex; ' +
            '    flex-direction: column; ' +
            '    align-items: center; ' +
            '    justify-content: center; ' +
            '    height: calc(100vh - 6mm); ' +
            '    overflow: hidden;' +
            '}' +
            '.barcode-area { ' +
            '    display: inline-block; ' +
            '    padding: 1mm; ' + 
            '    border: 1px dashed #ccc; ' +
            '    width: 90%;' +
            '    max-width: 50mm;' + 
            '}' +
            '.product-name-print { font-size: 7pt; margin-bottom: 0.5mm; font-weight: bold; word-break: break-word; }' + 
            'svg { ' +
            '    width: 100% !important; ' +
            '    height: auto !important; ' +
            '    max-height: 15mm;' + 
            '}' +
            '@media print {' +
            '    body { margin: 0; padding: 0; width: 100%; height: 100%; }' +
            '    .barcode-area { border: none; padding:0; margin: 0 auto; page-break-after: always; width: 100%; }' +
            '}' +
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
    return (
      <div className="space-y-4"> {/* Reduced space */}
        <Skeleton className="h-8 w-3/4" /> {/* Reduced height */}
        <Skeleton className="h-80 w-full md:w-1/2 mx-auto mb-4 rounded-lg" /> {/* Reduced height and margin */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/2" /> {/* Reduced height */}
            <Skeleton className="h-3 w-1/4" /> {/* Reduced height */}
          </CardHeader>
          <CardContent className="space-y-3"> {/* Reduced space */}
            {[...Array(5)].map((_, i) => ( 
              <div key={i} className="flex items-center space-x-reverse space-x-2"> {/* Reduced space */}
                <Skeleton className="h-5 w-5 rounded-full" /> {/* Reduced size */}
                <Skeleton className="h-5 w-1/3" /> {/* Reduced height */}
                <Skeleton className="h-5 w-1/2" /> {/* Reduced height */}
              </div>
            ))}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Skeleton className="h-8 w-20" /> {/* Reduced height and width */}
            <Skeleton className="h-8 w-20" /> {/* Reduced height and width */}
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-8"> {/* Reduced padding */}
        <Package size={48} className="mx-auto text-muted-foreground mb-3" /> {/* Reduced size and margin */}
        <h1 className="text-xl font-bold">المنتج غير موجود</h1> {/* Reduced size */}
        <p className="text-sm text-muted-foreground mb-4">عذرًا، لم نتمكن من العثور على المنتج الذي طلبته.</p> {/* Reduced size and margin */}
        <Button size="sm" asChild> {/* Smaller button */}
          <Link href="/dashboard/products">
            <ArrowRight className="ml-1 h-3 w-3" /> {/* Reduced icon size */}
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
    <div className="space-y-4"> {/* Reduced space */}
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold tracking-tight font-headline flex items-center"> {/* Reduced size */}
                    <Package className="mr-2 text-primary" size={28} /> {product.name} {/* Reduced icon size */}
                </h1>
                <p className="text-xs text-muted-foreground font-body mt-0.5"> {/* Reduced size and margin */}
                تفاصيل المنتج الكاملة.
                </p>
            </div>
             <Button variant="outline" size="sm" asChild> {/* Smaller button */}
                <Link href="/dashboard/products">
                    <ArrowRight className="ml-1 h-3 w-3" /> {/* Reduced icon size */}
                    العودة إلى القائمة
                </Link>
            </Button>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> {/* Reduced gap */}
        <div className="md:col-span-1">
           <Card className="shadow-md overflow-hidden"> {/* Reduced shadow */}
             <CardHeader className="p-0 relative aspect-[4/5] w-full"> {/* Adjusted aspect ratio */}
                <Image
                    src={product.imageUrl || 'https://placehold.co/240x300.png'} // Smaller placeholder
                    alt={product.name}
                    layout="fill"
                    objectFit="cover"
                    data-ai-hint="abaya product detail"
                />
             </CardHeader>
             <CardContent className="p-3"> {/* Reduced padding */}
                <h3 className="font-semibold text-base text-center">{product.name}</h3> {/* Reduced size */}
             </CardContent>
           </Card>
        </div>

        <div className="md:col-span-2">
            <Card className="shadow-md h-full"> {/* Reduced shadow */}
                <CardHeader className="pb-3 pt-4 px-4"> {/* Reduced padding */}
                <CardTitle className="flex items-center text-lg"> {/* Reduced size */}
                    <Tag className="mr-2 text-accent h-4 w-4" /> {/* Reduced icon size */}
                    معلومات المنتج
                </CardTitle>
                </CardHeader>

                <div className="px-4 pb-2 flex flex-col items-center"> {/* Reduced padding */}
                  {product.barcodeValue ? (
                    <>
                      <svg ref={barcodeRef} className="w-full max-w-[180px] h-auto mb-1"></svg> {/* Reduced max-width and margin */}
                      <div className="flex gap-1.5 mt-1"> {/* Reduced gap and margin */}
                        <Button variant="outline" size="xs" onClick={handlePrintBarcode}> {/* Smaller button size */}
                            <Printer className="ml-1 h-3 w-3" /> طباعة
                        </Button>
                        {hasRole(['admin']) && (
                          <Button variant="outline" size="xs" asChild> {/* Smaller button size */}
                            <Link href={`/dashboard/products/${product.id}/edit`}>
                              <Edit3 className="ml-1 h-3 w-3" /> تعديل
                            </Link>
                          </Button>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-2"> {/* Reduced padding */}
                      <p className="text-xs text-muted-foreground mb-1">لم يتم تعيين باركود.</p> {/* Reduced size and margin */}
                      {hasRole(['admin']) && (
                        <Button variant="outline" size="xs" asChild> {/* Smaller button size */}
                          <Link href={`/dashboard/products/${product.id}/edit`}>
                            <Edit3 className="ml-1 h-3 w-3" /> إضافة/تعديل
                          </Link>
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                
                <CardContent className="grid gap-3 sm:grid-cols-2 pt-2 px-4 pb-3"> {/* Reduced padding, gap, and pt */}
                <div className="flex items-start space-x-2 space-x-reverse"> {/* Reduced space */}
                    <DollarSign className="h-4 w-4 mt-0.5 text-primary shrink-0" /> {/* Reduced size and margin */}
                    <div>
                    <p className="text-xs text-muted-foreground">السعر</p> {/* Reduced size */}
                    <p className="font-semibold text-base">{product.price.toFixed(2)} LYD</p> {/* Reduced size */}
                    </div>
                </div>
                <div className="flex items-start space-x-2 space-x-reverse">
                    <Layers className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <div>
                    <p className="text-xs text-muted-foreground">الكمية المتوفرة</p>
                    <Badge variant={product.quantity === 0 ? "destructive" : product.quantity < 10 ? "secondary" : "default"} className="text-sm px-2 py-0.5"> {/* Reduced size */}
                        {product.quantity}
                    </Badge>
                    </div>
                </div>
                <div className="flex items-start space-x-2 space-x-reverse">
                    <ShoppingBag className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <div>
                    <p className="text-xs text-muted-foreground">الكمية المباعة</p>
                    <p className="font-semibold text-base">{quantitySold}</p>
                    </div>
                </div>
                <div className="flex items-start space-x-2 space-x-reverse">
                    <CalendarDays className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <div>
                    <p className="text-xs text-muted-foreground">تاريخ الإنشاء</p>
                    <p className="font-semibold text-sm">{formatDateTime(product.createdAt)}</p> {/* Reduced size */}
                    </div>
                </div>
                <div className="flex items-start space-x-2 space-x-reverse">
                    <History className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <div>
                    <p className="text-xs text-muted-foreground">آخر تحديث</p>
                    <p className="font-semibold text-sm">{formatDateTime(product.updatedAt)}</p>
                    </div>
                </div>
                </CardContent>
                {hasRole(['admin']) && (
                <CardFooter className="flex justify-start gap-1.5 p-3 pt-0"> {/* Reduced padding and gap */}
                    <Button size="sm" asChild> {/* Smaller button */}
                      <Link href={`/dashboard/products/${product.id}/edit`}>
                          <Edit3 className="ml-1 h-3 w-3" /> تعديل
                      </Link>
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={isDeleting}> {/* Smaller button */}
                          <Trash2 className="ml-1 h-3 w-3" /> {isDeleting ? 'جاري...' : 'حذف'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md"> {/* Smaller dialog for consistency */}
                        <DialogHeader>
                          <DialogTitle className="text-lg">تأكيد الحذف</DialogTitle> {/* Reduced size */}
                          <ShadcnDialogDescription className="text-sm"> {/* Ensure consistent size */}
                            هل أنت متأكد أنك تريد حذف المنتج "{product.name}"؟ لا يمكن التراجع عن هذا الإجراء.
                          </ShadcnDialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-1.5 sm:justify-start"> {/* Reduced gap */}
                          <DialogClose asChild>
                            <Button type="button" variant="secondary" size="sm" disabled={isDeleting}>إلغاء</Button> {/* Smaller button */}
                          </DialogClose>
                          <Button type="button" variant="destructive" size="sm" onClick={handleDeleteProduct} disabled={isDeleting}> {/* Smaller button */}
                            {isDeleting ? 'جاري...' : 'حذف'}
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
