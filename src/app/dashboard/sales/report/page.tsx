
// src/app/dashboard/sales/report/page.tsx
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useSales } from '@/contexts/SalesContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProducts } from '@/contexts/ProductContext'; // Import useProducts
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CalendarIcon, Undo2, Search, FileText } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO, startOfDay, endOfDay, isValid, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear } from 'date-fns';
import { enGB, arSA } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription as ShadcnDialogDescription, DialogClose } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Sale } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


export default function SalesReportPage() {
  const { sales, returnSale } = useSales();
  const { hasRole } = useAuth();
  const { getProductById } = useProducts(); // Get product data
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [isYearlyReportOpen, setIsYearlyReportOpen] = useState(false);
  const [isMonthlyReportOpen, setIsMonthlyReportOpen] = useState(false);
  const [isWeeklyReportOpen, setIsWeeklyReportOpen] = useState(false);

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
  
  const formatNumber = (num: number) => {
    return num % 1 !== 0 ? parseFloat(num.toFixed(2)) : num;
  };

  const dailyReportData = useMemo(() => {
    const activeSales = filteredSales.filter(sale => sale.status === 'active');
    
    const totalDiscount = activeSales.reduce((sum, sale) => sum + (sale.discountAmount ?? 0), 0);
    const totalFinalAmount = activeSales.reduce((sum, sale) => sum + sale.totalAmount, 0);

    let totalProfit = 0;
    if (hasRole(['admin'])) {
      totalProfit = activeSales.reduce((totalProfitSum, sale) => {
        const saleCostOfGoods = sale.items.reduce((costSum, item) => {
          const product = getProductById(item.productId);
          return costSum + ((product?.costPrice || 0) * item.quantity);
        }, 0);
        return totalProfitSum + (sale.totalAmount - saleCostOfGoods);
      }, 0);
    }

    return {
      totalDiscount: formatNumber(totalDiscount),
      totalFinalAmount: formatNumber(totalFinalAmount),
      totalProfit: formatNumber(totalProfit)
    };
  }, [filteredSales, getProductById, hasRole]);

  const monthlyReportData = useMemo(() => {
    if (!sales || !selectedDate || !isValid(selectedDate)) {
      return { totalSales: 0, totalDiscount: 0, totalProfit: 0, monthName: '' };
    }

    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    const monthName = format(selectedDate, 'MMMM yyyy', { locale: arSA });

    const monthlyActiveSales = sales.filter(sale => {
        const saleDate = parseISO(sale.saleDate);
        return isValid(saleDate) && saleDate >= start && saleDate <= end && sale.status === 'active';
    });

    const totalSales = monthlyActiveSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalDiscount = monthlyActiveSales.reduce((sum, sale) => sum + (sale.discountAmount ?? 0), 0);

    let totalProfit = 0;
    if (hasRole(['admin'])) {
      totalProfit = monthlyActiveSales.reduce((totalProfitSum, sale) => {
        const saleCostOfGoods = sale.items.reduce((costSum, item) => {
          const product = getProductById(item.productId);
          return costSum + ((product?.costPrice || 0) * item.quantity);
        }, 0);
        return totalProfitSum + (sale.totalAmount - saleCostOfGoods);
      }, 0);
    }
    
    return {
      totalSales: formatNumber(totalSales),
      totalDiscount: formatNumber(totalDiscount),
      totalProfit: formatNumber(totalProfit),
      monthName
    };
  }, [sales, selectedDate, getProductById, hasRole]);
  
  const weeklyReportData = useMemo(() => {
    if (!sales || !selectedDate || !isValid(selectedDate)) {
      return { totalSales: 0, totalDiscount: 0, totalProfit: 0, weekRange: '' };
    }

    const start = startOfWeek(selectedDate, { locale: arSA });
    const end = endOfWeek(selectedDate, { locale: arSA });
    const weekRange = `${format(start, 'd MMM', { locale: arSA })} - ${format(end, 'd MMM yyyy', { locale: arSA })}`;

    const weeklyActiveSales = sales.filter(sale => {
        const saleDate = parseISO(sale.saleDate);
        return isValid(saleDate) && saleDate >= start && saleDate <= end && sale.status === 'active';
    });

    const totalSales = weeklyActiveSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalDiscount = weeklyActiveSales.reduce((sum, sale) => sum + (sale.discountAmount ?? 0), 0);
    
    let totalProfit = 0;
    if (hasRole(['admin'])) {
      totalProfit = weeklyActiveSales.reduce((totalProfitSum, sale) => {
        const saleCostOfGoods = sale.items.reduce((costSum, item) => {
          const product = getProductById(item.productId);
          return costSum + ((product?.costPrice || 0) * item.quantity);
        }, 0);
        return totalProfitSum + (sale.totalAmount - saleCostOfGoods);
      }, 0);
    }
    
    return {
      totalSales: formatNumber(totalSales),
      totalDiscount: formatNumber(totalDiscount),
      totalProfit: formatNumber(totalProfit),
      weekRange
    };
  }, [sales, selectedDate, getProductById, hasRole]);
  
  const yearlyReportData = useMemo(() => {
    if (!sales || !selectedDate || !isValid(selectedDate)) {
      return { totalSales: 0, totalDiscount: 0, totalProfit: 0, year: '' };
    }

    const start = startOfYear(selectedDate);
    const end = endOfYear(selectedDate);
    const year = format(selectedDate, 'yyyy');

    const yearlyActiveSales = sales.filter(sale => {
        const saleDate = parseISO(sale.saleDate);
        return isValid(saleDate) && saleDate >= start && saleDate <= end && sale.status === 'active';
    });

    const totalSales = yearlyActiveSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalDiscount = yearlyActiveSales.reduce((sum, sale) => sum + (sale.discountAmount ?? 0), 0);
    
    let totalProfit = 0;
    if (hasRole(['admin'])) {
      totalProfit = yearlyActiveSales.reduce((totalProfitSum, sale) => {
        const saleCostOfGoods = sale.items.reduce((costSum, item) => {
          const product = getProductById(item.productId);
          return costSum + ((product?.costPrice || 0) * item.quantity);
        }, 0);
        return totalProfitSum + (sale.totalAmount - saleCostOfGoods);
      }, 0);
    }
    
    return {
      totalSales: formatNumber(totalSales),
      totalDiscount: formatNumber(totalDiscount),
      totalProfit: formatNumber(totalProfit),
      year
    };
  }, [sales, selectedDate, getProductById, hasRole]);

    
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
      {/* ===== DIALOGS CONTROLLED BY STATE ===== */}
      <Dialog open={isYearlyReportOpen} onOpenChange={setIsYearlyReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ملخص المبيعات لسنة {yearlyReportData.year}</DialogTitle>
            <ShadcnDialogDescription>
              هذا هو ملخص المبيعات والخصومات والأرباح للسنة المحددة.
            </ShadcnDialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted">
              <span className="font-medium">إجمالي المبيعات</span>
              <span className="font-bold text-lg">{yearlyReportData.totalSales} LYD</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted">
              <span className="font-medium">إجمالي الخصومات</span>
              <span className="font-bold text-lg text-orange-600">{yearlyReportData.totalDiscount} LYD</span>
            </div>
            {hasRole(['admin']) && (
              <div className="flex justify-between items-center p-3 rounded-lg bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-800">
                <span className="font-medium text-green-800 dark:text-green-200">إجمالي الربح</span>
                <span className={`font-bold text-lg ${yearlyReportData.totalProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>{yearlyReportData.totalProfit} LYD</span>
              </div>
            )}
          </div>
          <DialogFooter>
             <DialogClose asChild>
                <Button type="button" variant="secondary">إغلاق</Button>
             </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isWeeklyReportOpen} onOpenChange={setIsWeeklyReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ملخص المبيعات للأسبوع</DialogTitle>
            <ShadcnDialogDescription>
             {weeklyReportData.weekRange}
            </ShadcnDialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted">
              <span className="font-medium">إجمالي المبيعات</span>
              <span className="font-bold text-lg">{weeklyReportData.totalSales} LYD</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted">
              <span className="font-medium">إجمالي الخصومات</span>
              <span className="font-bold text-lg text-orange-600">{weeklyReportData.totalDiscount} LYD</span>
            </div>
            {hasRole(['admin']) && (
              <div className="flex justify-between items-center p-3 rounded-lg bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-800">
                <span className="font-medium text-green-800 dark:text-green-200">إجمالي الربح</span>
                <span className={`font-bold text-lg ${weeklyReportData.totalProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>{weeklyReportData.totalProfit} LYD</span>
              </div>
            )}
          </div>
          <DialogFooter>
             <DialogClose asChild>
                <Button type="button" variant="secondary">إغلاق</Button>
             </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isMonthlyReportOpen} onOpenChange={setIsMonthlyReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ملخص المبيعات لـ {monthlyReportData.monthName}</DialogTitle>
            <ShadcnDialogDescription>
              هذا هو ملخص المبيعات والخصومات والأرباح للشهر المحدد.
            </ShadcnDialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted">
              <span className="font-medium">إجمالي المبيعات</span>
              <span className="font-bold text-lg">{monthlyReportData.totalSales} LYD</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted">
              <span className="font-medium">إجمالي الخصومات</span>
              <span className="font-bold text-lg text-orange-600">{monthlyReportData.totalDiscount} LYD</span>
            </div>
            {hasRole(['admin']) && (
              <div className="flex justify-between items-center p-3 rounded-lg bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-800">
                <span className="font-medium text-green-800 dark:text-green-200">إجمالي الربح</span>
                <span className={`font-bold text-lg ${monthlyReportData.totalProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>{monthlyReportData.totalProfit} LYD</span>
              </div>
            )}
          </div>
          <DialogFooter>
             <DialogClose asChild>
                <Button type="button" variant="secondary">إغلاق</Button>
             </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* ===== END DIALOGS ===== */}

      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">تقرير المبيعات</h1>
        <p className="text-muted-foreground font-body">
          عرض المبيعات اليومية أو الشهرية مع تفاصيل الأرباح والخصومات.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>عرض التقرير حسب التاريخ</CardTitle>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-10">
                    <FileText className="ml-2 h-4 w-4" />
                    تقارير مجمعة
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setIsWeeklyReportOpen(true)}>
                    تقرير أسبوعي
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setIsMonthlyReportOpen(true)}>
                    تقرير شهري
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setIsYearlyReportOpen(true)}>
                    تقرير سنوي
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

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
          </div>
        </CardHeader>
        <CardContent>
          {filteredSales.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-2 py-3 min-w-[100px]">وقت البيع</TableHead>
                    <TableHead className="px-2 py-3 min-w-[150px]">المنتجات</TableHead>
                    <TableHead className="text-center px-2 py-3 min-w-[100px]">الإجمالي النهائي</TableHead>
                    <TableHead className="text-center px-2 py-3 min-w-[120px]">الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map((sale) => {
                    return (
                    <TableRow key={sale.id} className={sale.status === 'returned' ? 'opacity-60' : ''}>
                      <TableCell className="px-2 py-3">{formatSaleTime(sale.saleDate)}</TableCell>
                      <TableCell className="px-2 py-3">
                        <ul className="list-disc list-inside text-xs">
                          {sale.items.map(item => (
                            <li key={item.productId}>
                              {item.productName}
                            </li>
                          ))}
                        </ul>
                      </TableCell>
                      <TableCell className="text-center font-semibold px-2 py-3">
                        {sale.discountAmount && sale.discountAmount > 0 && sale.status === 'active' ? (
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-blue-600 dark:text-blue-400">{formatNumber(sale.totalAmount)}</span>
                            <TooltipProvider delayDuration={100}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="outline" className="text-xs font-mono border-orange-500/50 text-orange-600 dark:text-orange-400 cursor-help">
                                    -{formatNumber(sale.discountAmount)}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                  <p>خصم: {formatNumber(sale.discountAmount)} LYD</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        ) : (
                          <span>{formatNumber(sale.totalAmount)}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center px-2 py-3">
                        <div className="flex items-center justify-center gap-2">
                            <Badge variant={sale.status === 'active' ? 'success' : 'destructive'} className={`${sale.status === 'active' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} text-xs`}>
                            {sale.status === 'active' ? 'نشط' : 'مرجع'}
                            </Badge>
                            {hasRole(['admin', 'employee_return']) && sale.status === 'active' && (
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
                            )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                </TableBody>
                 <TableFooter>
                    <TableRow className="font-bold bg-muted/80">
                        <TableCell colSpan={2} className="text-lg px-2 py-3 text-right">الإجماليات النشطة لليوم:</TableCell>
                        <TableCell className="text-center text-lg px-2 py-3">{dailyReportData.totalFinalAmount} LYD</TableCell>
                        <TableCell className="text-center text-sm px-2 py-3">
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-orange-600 dark:text-orange-400">
                                    (إجمالي الخصومات: {dailyReportData.totalDiscount})
                                </span>
                                {hasRole(['admin']) && (
                                    <span className={` ${dailyReportData.totalProfit >= 0 ? 'text-green-600 dark:text-green-500' : 'text-destructive'}`}>
                                        (إجمالي الربح: {dailyReportData.totalProfit})
                                    </span>
                                )}
                            </div>
                        </TableCell>
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
