
// src/app/dashboard/sales/report/page.tsx
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useSales } from '@/contexts/SalesContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption, TableFooter } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CalendarIcon, Undo2, Search, MinusCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO, startOfDay, endOfDay, isEqual, isValid } from 'date-fns';
import { enGB, arSA } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription as ShadcnDialogDescription, DialogClose } from '@/components/ui/dialog';
import type { Sale } from '@/lib/types';

export default function SalesReportPage() {
  const { sales, returnSale } = useSales();
  const { hasRole } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const filteredSales = useMemo(() => {
    if (!sales || !selectedDate || !isValid(selectedDate)) return [];
    const start = startOfDay(selectedDate);
    const end = endOfDay(selectedDate);
    return sales.filter(sale => {
      const saleDate = parseISO(sale.saleDate);
      return isValid(saleDate) && saleDate >= start && saleDate <= end;
    }).sort((a,b) => parseISO(b.saleDate).getTime() - parseISO(a.saleDate).getTime()); // Sort by most recent first
  }, [sales, selectedDate]);

  const totalActiveOriginalAmount = useMemo(() => {
    return filteredSales
      .filter(sale => sale.status === 'active')
      .reduce((sum, sale) => sum + sale.originalTotalAmount, 0);
  }, [filteredSales]);
  
  const totalActiveDiscountAmount = useMemo(() => {
    return filteredSales
      .filter(sale => sale.status === 'active')
      .reduce((sum, sale) => sum + sale.discountAmount, 0);
  }, [filteredSales]);

  const totalActiveFinalAmount = useMemo(() => {
    return filteredSales
      .filter(sale => sale.status === 'active')
      .reduce((sum, sale) => sum + sale.totalAmount, 0);
  }, [filteredSales]);

  const formatSaleTime = (isoString: string) => {
    if (!isoString || !isValid(parseISO(isoString))) return 'N/A';
    return format(parseISO(isoString), 'hh:mm a', { locale: enGB });
  };
  
  const handleReturnSale = async (saleId: string) => {
    await returnSale(saleId);
  };

  if (!isClient) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-1/2 bg-muted animate-pulse rounded-md"></div>
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


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">تقرير المبيعات اليومي</h1>
        <p className="text-muted-foreground font-body">
          عرض المبيعات حسب تاريخ محدد مع تفاصيل الخصومات.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>اختر تاريخًا لعرض المبيعات</CardTitle>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className="w-full md:w-[280px] justify-start text-right font-normal"
                >
                  <CalendarIcon className="ml-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'PPP', { locale: arSA }) : <span>اختر تاريخًا</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                  locale={arSA} 
                  dir="rtl" 
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSales.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableCaption>
                  إجمالي المبيعات النهائية النشطة لليوم المحدد: {totalActiveFinalAmount.toFixed(2)} LYD
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-2 py-3 min-w-[100px]">وقت البيع</TableHead>
                    <TableHead className="px-2 py-3 min-w-[150px]">المنتجات</TableHead>
                    <TableHead className="text-center px-2 py-3 min-w-[100px]">الإجمالي الأصلي</TableHead>
                    <TableHead className="text-center px-2 py-3 min-w-[100px]">الخصم</TableHead>
                    <TableHead className="text-center px-2 py-3 min-w-[100px]">الإجمالي النهائي</TableHead>
                    <TableHead className="px-2 py-3 min-w-[100px]">البائع</TableHead>
                    <TableHead className="text-center px-2 py-3 min-w-[80px]">الحالة</TableHead>
                    {hasRole(['admin', 'employee_return']) && <TableHead className="text-center px-2 py-3 min-w-[80px]">إرجاع</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map((sale) => (
                    <TableRow key={sale.id} className={sale.status === 'returned' ? 'opacity-60' : ''}>
                      <TableCell className="px-2 py-3">{formatSaleTime(sale.saleDate)}</TableCell>
                      <TableCell className="px-2 py-3">
                        <ul className="list-disc list-inside text-xs">
                          {sale.items.map(item => (
                            <li key={item.productId}>
                              {item.productName} (الكمية: {item.quantity})
                            </li>
                          ))}
                        </ul>
                      </TableCell>
                      <TableCell className="text-center px-2 py-3">{sale.originalTotalAmount.toFixed(2)}</TableCell>
                      <TableCell className="text-center px-2 py-3 text-orange-600">
                        {sale.discountAmount > 0 ? sale.discountAmount.toFixed(2) : '-'}
                      </TableCell>
                      <TableCell className="text-center font-semibold px-2 py-3">{sale.totalAmount.toFixed(2)}</TableCell>
                      <TableCell className="px-2 py-3">{sale.sellerUsername}</TableCell>
                      <TableCell className="text-center px-2 py-3">
                        <Badge variant={sale.status === 'active' ? 'success' : 'destructive'} className={`${sale.status === 'active' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} text-xs`}>
                          {sale.status === 'active' ? 'نشط' : 'مرجع'}
                        </Badge>
                      </TableCell>
                      {hasRole(['admin', 'employee_return']) && (
                        <TableCell className="text-center px-2 py-3">
                          {sale.status === 'active' ? (
                             <Dialog>
                                <DialogTrigger asChild>
                                <Button variant="outline" size="icon" title="إرجاع العملية" className="h-7 w-7">
                                    <Undo2 className="h-3.5 w-3.5 text-orange-500" />
                                </Button>
                                </DialogTrigger>
                                <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>تأكيد الإرجاع</DialogTitle>
                                    <ShadcnDialogDescription>
                                    هل أنت متأكد أنك تريد إرجاع هذه العملية؟ سيتم إعادة المنتجات إلى المخزون.
                                    </ShadcnDialogDescription>
                                </DialogHeader>
                                <DialogFooter className="gap-2 sm:justify-start pt-2">
                                    <DialogClose asChild>
                                    <Button type="button" variant="secondary">إلغاء</Button>
                                    </DialogClose>
                                    <Button type="button" variant="destructive" onClick={() => handleReturnSale(sale.id)}>تأكيد الإرجاع</Button>
                                </DialogFooter>
                                </DialogContent>
                            </Dialog>
                          ) : (
                            <span className="text-xs text-muted-foreground">تم الإرجاع</span>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
                 <TableFooter>
                    <TableRow className="font-bold bg-muted/80">
                        <TableCell colSpan={2} className="text-lg px-2 py-3">الإجماليات النشطة لليوم:</TableCell>
                        <TableCell className="text-center text-lg px-2 py-3">{totalActiveOriginalAmount.toFixed(2)}</TableCell>
                        <TableCell className="text-center text-lg px-2 py-3 text-orange-600">{totalActiveDiscountAmount.toFixed(2)}</TableCell>
                        <TableCell className="text-center text-lg px-2 py-3">{totalActiveFinalAmount.toFixed(2)}</TableCell>
                        <TableCell colSpan={hasRole(['admin', 'employee_return']) ? 3 : 2} className="px-2 py-3"></TableCell>
                    </TableRow>
                </TableFooter>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <Search size={48} className="mx-auto mb-2" />
              <p>لا توجد مبيعات مسجلة في التاريخ المحدد.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

declare module "@/components/ui/badge" {
  interface BadgeProps {
    variant?: "default" | "secondary" | "destructive" | "outline" | "success";
  }
}
