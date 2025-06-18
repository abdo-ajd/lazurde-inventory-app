
// src/app/dashboard/sales/report/page.tsx
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useSales } from '@/contexts/SalesContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption, TableFooter } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CalendarIcon, Undo2, Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO, startOfDay, endOfDay, isEqual, isValid } from 'date-fns';
import { enGB, arSA } from 'date-fns/locale'; // arSA for Arabic numerals in calendar if needed, enGB for formatting
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
    });
  }, [sales, selectedDate]);

  const totalActiveSalesAmount = useMemo(() => {
    return filteredSales
      .filter(sale => sale.status === 'active')
      .reduce((sum, sale) => sum + sale.totalAmount, 0);
  }, [filteredSales]);

  const formatSaleTime = (isoString: string) => {
    if (!isoString || !isValid(parseISO(isoString))) return 'N/A';
    return format(parseISO(isoString), 'hh:mm a', { locale: enGB }); // Changed to hh:mm a for 12-hour format
  };
  
  const handleReturnSale = async (saleId: string) => {
    // Confirmation dialog is handled by DialogTrigger/DialogContent
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
          عرض المبيعات حسب تاريخ محدد.
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
                  إجمالي المبيعات النشطة لليوم المحدد: {totalActiveSalesAmount.toFixed(2)} LYD
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-2 py-3">وقت البيع</TableHead>
                    <TableHead className="px-2 py-3">المنتجات</TableHead>
                    <TableHead className="text-center px-2 py-3">الإجمالي</TableHead>
                    <TableHead className="px-2 py-3">البائع</TableHead>
                    <TableHead className="text-center px-2 py-3">الحالة</TableHead>
                    {hasRole(['admin', 'employee_return']) && <TableHead className="text-center px-2 py-3">إرجاع</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="px-2 py-3">{formatSaleTime(sale.saleDate)}</TableCell>
                      <TableCell className="px-2 py-3">
                        <ul className="list-disc list-inside">
                          {sale.items.map(item => (
                            <li key={item.productId}>
                              {item.productName}
                            </li>
                          ))}
                        </ul>
                      </TableCell>
                      <TableCell className="text-center font-semibold px-2 py-3">{sale.totalAmount.toFixed(2)}</TableCell>
                      <TableCell className="px-2 py-3">{sale.sellerUsername}</TableCell>
                      <TableCell className="text-center px-2 py-3">
                        <Badge variant={sale.status === 'active' ? 'success' : 'destructive'} className={sale.status === 'active' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}>
                          {sale.status === 'active' ? 'نشط' : 'مرجع'}
                        </Badge>
                      </TableCell>
                      {hasRole(['admin', 'employee_return']) && (
                        <TableCell className="text-center px-2 py-3">
                          {sale.status === 'active' ? (
                             <Dialog>
                                <DialogTrigger asChild>
                                <Button variant="outline" size="icon" title="إرجاع العملية">
                                    <Undo2 className="h-4 w-4 text-orange-500" />
                                </Button>
                                </DialogTrigger>
                                <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>تأكيد الإرجاع</DialogTitle>
                                    <ShadcnDialogDescription>
                                    هل أنت متأكد أنك تريد إرجاع هذه العملية؟ سيتم إعادة المنتجات إلى المخزون.
                                    </ShadcnDialogDescription>
                                </DialogHeader>
                                <DialogFooter className="gap-2 sm:justify-start">
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
                    <TableRow>
                        <TableCell colSpan={hasRole(['admin', 'employee_return']) ? 3 : 2} className="font-bold text-lg px-2 py-3">الإجمالي النشط لليوم</TableCell>
                        <TableCell colSpan={hasRole(['admin', 'employee_return']) ? 3 : 3} className="text-left font-bold text-lg px-2 py-3">{totalActiveSalesAmount.toFixed(2)} LYD</TableCell>
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

// Helper Badge for success variant
declare module "@/components/ui/badge" {
  interface BadgeProps {
    variant?: "default" | "secondary" | "destructive" | "outline" | "success";
  }
}

