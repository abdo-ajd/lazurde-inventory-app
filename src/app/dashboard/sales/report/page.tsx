
// src/app/dashboard/sales/report/page.tsx
"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSales } from '@/contexts/SalesContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProducts } from '@/contexts/ProductContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
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

interface ReportData {
  totalSales: number;
  totalDiscount: number;
  totalProfit: number;
  totalsByMethod: { [key: string]: number };
}

export default function SalesReportPage() {
  const { sales, returnSale } = useSales();
  const { hasRole } = useAuth();
  const { getProductById } = useProducts();
  const { settings } = useAppSettings();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [isDailyReportOpen, setIsDailyReportOpen] = useState(false);
  const [isYearlyReportOpen, setIsYearlyReportOpen] = useState(false);
  const [isMonthlyReportOpen, setIsMonthlyReportOpen] = useState(false);
  const [isWeeklyReportOpen, setIsWeeklyReportOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const serviceColorMap = useMemo(() => {
    const map = new Map<string, string>();
    (settings.bankServices || []).forEach(service => {
      map.set(service.name, service.color);
    });
    return map;
  }, [settings.bankServices]);

  const filteredSales = useMemo(() => {
    if (!sales || !selectedDate || !isValid(selectedDate)) return [];
    const start = startOfDay(selectedDate);
    const end = endOfDay(selectedDate);
    return sales.filter(sale => {
      const saleDate = parseISO(sale.saleDate);
      return isValid(saleDate) && saleDate >= start && saleDate <= end;
    }).sort((a,b) => parseISO(b.saleDate).getTime() - parseISO(a.saleDate).getTime());
  }, [sales, selectedDate]);
  
  const formatNumber = (num: number) => {
    return num % 1 !== 0 ? parseFloat(num.toFixed(2)) : num;
  };
  
  const calculateReportData = useCallback((salesToProcess: Sale[]): ReportData => {
    const activeSales = salesToProcess.filter(sale => sale.status === 'active');
    
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
    
    const totalsByMethod: { [key: string]: number } = {};
    activeSales.forEach(sale => {
        const method = sale.paymentMethod || 'نقدي';
        totalsByMethod[method] = (totalsByMethod[method] || 0) + sale.totalAmount;
    });

    return {
      totalSales: formatNumber(totalFinalAmount),
      totalDiscount: formatNumber(totalDiscount),
      totalProfit: formatNumber(totalProfit),
      totalsByMethod: Object.entries(totalsByMethod).reduce((acc, [key, value]) => {
        acc[key] = formatNumber(value);
        return acc;
      }, {} as {[key: string]: number}),
    };
  }, [getProductById, hasRole]);


  const dailyReportData = useMemo(() => calculateReportData(filteredSales), [filteredSales, calculateReportData]);

  const monthlyReportData = useMemo(() => {
    if (!sales || !selectedDate || !isValid(selectedDate)) return { ...calculateReportData([]), monthName: '' };
    
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    const monthName = format(selectedDate, 'MMMM yyyy', { locale: arSA });
    const monthlySales = sales.filter(sale => {
        const saleDate = parseISO(sale.saleDate);
        return isValid(saleDate) && saleDate >= start && saleDate <= end;
    });
    
    return { ...calculateReportData(monthlySales), monthName };
  }, [sales, selectedDate, calculateReportData]);
  
  const weeklyReportData = useMemo(() => {
    if (!sales || !selectedDate || !isValid(selectedDate)) return { ...calculateReportData([]), weekRange: '' };

    const start = startOfWeek(selectedDate, { locale: arSA });
    const end = endOfWeek(selectedDate, { locale: arSA });
    const weekRange = `${format(start, 'd MMM', { locale: arSA })} - ${format(end, 'd MMM yyyy', { locale: arSA })}`;
    const weeklySales = sales.filter(sale => {
        const saleDate = parseISO(sale.saleDate);
        return isValid(saleDate) && saleDate >= start && saleDate <= end;
    });

    return { ...calculateReportData(weeklySales), weekRange };
  }, [sales, selectedDate, calculateReportData]);
  
  const yearlyReportData = useMemo(() => {
    if (!sales || !selectedDate || !isValid(selectedDate)) return { ...calculateReportData([]), year: '' };

    const start = startOfYear(selectedDate);
    const end = endOfYear(selectedDate);
    const year = format(selectedDate, 'yyyy');
    const yearlySales = sales.filter(sale => {
        const saleDate = parseISO(sale.saleDate);
        return isValid(saleDate) && saleDate >= start && saleDate <= end;
    });

    return { ...calculateReportData(yearlySales), year };
  }, [sales, selectedDate, calculateReportData]);

    
  const formatSaleTime = (isoString: string) => {
    if (!isoString || !isValid(parseISO(isoString))) return 'N/A';
    return format(parseISO(isoString), 'hh:mm a', { locale: enGB });
  };
  
  const handleReturnSale = async (saleId: string) => {
    await returnSale(saleId);
  };

  const renderReportDialogContent = (title: string, description: string, data: ReportData) => (
    <>
        <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <ShadcnDialogDescription>{description}</ShadcnDialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <h3 className="font-semibold text-center">الإجماليات حسب طريقة الدفع</h3>
            <div className="space-y-2 rounded-lg border p-3">
                {Object.entries(data.totalsByMethod).map(([method, total]) => (
                    <div key={method} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                           <div className="w-3 h-3 rounded-full" style={{ backgroundColor: serviceColorMap.get(method) || 'hsl(var(--foreground))' }}/>
                           <span className="font-medium">{method}</span>
                        </div>
                        <span className="font-semibold">{total} LYD</span>
                    </div>
                ))}
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted text-base">
                <span className="font-medium">إجمالي المبيعات</span>
                <span className="font-bold text-lg">{data.totalSales} LYD</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted text-base">
                <span className="font-medium">إجمالي الخصومات</span>
                <span className="font-bold text-lg text-orange-600">{data.totalDiscount} LYD</span>
            </div>
            {hasRole(['admin']) && (
                <div className="flex justify-between items-center p-3 rounded-lg bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-800 text-base">
                <span className="font-medium text-green-800 dark:text-green-200">إجمالي الربح</span>
                <span className={`font-bold text-lg ${data.totalProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>{data.totalProfit} LYD</span>
                </div>
            )}
        </div>
        <DialogFooter>
            <DialogClose asChild><Button type="button" variant="secondary">إغلاق</Button></DialogClose>
        </DialogFooter>
    </>
  );

  if (!isClient) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-1/2 bg-muted animate-pulse rounded-md"></div>
        <Card>
          <CardHeader><div className="h-8 w-1/2 bg-muted animate-pulse rounded-md"></div><div className="h-6 w-1/3 bg-muted animate-pulse rounded-md mt-2"></div></CardHeader>
          <CardContent><div className="h-10 w-full bg-muted animate-pulse rounded-md mb-4"></div><div className="space-y-2">{[...Array(3)].map((_, i) => (<div key={i} className="h-12 w-full bg-muted animate-pulse rounded-md"></div>))}</div></CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      {/* ===== DIALOGS ===== */}
      <Dialog open={isDailyReportOpen} onOpenChange={setIsDailyReportOpen}>
        <DialogContent>{renderReportDialogContent(`ملخص المبيعات ليوم ${selectedDate ? format(selectedDate, 'PPP', { locale: arSA }) : ''}`, 'هذا هو ملخص المبيعات والخصومات والأرباح لليوم المحدد.', dailyReportData)}</DialogContent>
      </Dialog>
      <Dialog open={isWeeklyReportOpen} onOpenChange={setIsWeeklyReportOpen}>
        <DialogContent>{renderReportDialogContent(`ملخص المبيعات للأسبوع`, weeklyReportData.weekRange, weeklyReportData)}</DialogContent>
      </Dialog>
      <Dialog open={isMonthlyReportOpen} onOpenChange={setIsMonthlyReportOpen}>
        <DialogContent>{renderReportDialogContent(`ملخص المبيعات لـ ${monthlyReportData.monthName}`, 'هذا هو ملخص المبيعات والخصومات والأرباح للشهر المحدد.', monthlyReportData)}</DialogContent>
      </Dialog>
      <Dialog open={isYearlyReportOpen} onOpenChange={setIsYearlyReportOpen}>
        <DialogContent>{renderReportDialogContent(`ملخص المبيعات لسنة ${yearlyReportData.year}`, 'هذا هو ملخص المبيعات والخصومات والأرباح للسنة المحددة.', yearlyReportData)}</DialogContent>
      </Dialog>
      {/* ===== END DIALOGS ===== */}

      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">تقرير المبيعات</h1>
        <p className="text-muted-foreground font-body">عرض المبيعات اليومية أو الشهرية مع تفاصيل الأرباح والخصومات.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>عرض التقرير حسب التاريخ</CardTitle>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="outline" className="h-10"><FileText className="ml-2 h-4 w-4" />تقارير مجمعة</Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setIsDailyReportOpen(true)}>تقرير يومي</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setIsWeeklyReportOpen(true)}>تقرير أسبوعي</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setIsMonthlyReportOpen(true)}>تقرير شهري</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setIsYearlyReportOpen(true)}>تقرير سنوي</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Popover>
                <PopoverTrigger asChild><Button variant={"outline"} className="w-full md:w-[280px] justify-start text-right font-normal"><CalendarIcon className="ml-2 h-4 w-4" />{selectedDate ? format(selectedDate, 'PPP', { locale: arSA }) : <span>اختر تاريخًا</span>}</Button></PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus locale={arSA} dir="rtl" /></PopoverContent>
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
                    const salePaymentColor = sale.paymentMethod ? serviceColorMap.get(sale.paymentMethod) : undefined;
                    return (
                    <TableRow key={sale.id} className={sale.status === 'returned' ? 'opacity-60' : ''}>
                      <TableCell className="px-2 py-3">{formatSaleTime(sale.saleDate)}</TableCell>
                      <TableCell className="px-2 py-3"><ul className="list-disc list-inside text-xs">{sale.items.map(item => (<li key={item.productId}>{item.productName}</li>))}</ul></TableCell>
                      <TableCell className="text-center font-semibold px-2 py-3">
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          <span className={`${sale.discountAmount > 0 && sale.status === 'active' ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                            {formatNumber(sale.totalAmount)}
                          </span>
                           {sale.paymentMethod && sale.status === 'active' && salePaymentColor && (
                              <Badge style={{ backgroundColor: salePaymentColor, color: '#fff' }} className="border-none text-xs">
                                {sale.paymentMethod}
                              </Badge>
                           )}
                          {sale.discountAmount > 0 && sale.status === 'active' && (
                            <TooltipProvider delayDuration={100}>
                                <Tooltip>
                                  <TooltipTrigger asChild><Badge variant="outline" className="text-xs font-mono border-orange-500/50 text-orange-600 dark:text-orange-400 cursor-help">-{formatNumber(sale.discountAmount)}</Badge></TooltipTrigger>
                                  <TooltipContent side="top"><p>خصم: {formatNumber(sale.discountAmount)} LYD</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center px-2 py-3">
                        <div className="flex items-center justify-center gap-2">
                            <Badge variant={sale.status === 'active' ? 'success' : 'destructive'} className={`${sale.status === 'active' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} text-xs`}>{sale.status === 'active' ? 'نشط' : 'مرجع'}</Badge>
                            {hasRole(['admin', 'employee_return']) && sale.status === 'active' && (
                                <Dialog>
                                    <DialogTrigger asChild><Button variant="outline" size="icon" title="إرجاع العملية" className="h-7 w-7"><Undo2 className="h-3.5 w-3.5 text-orange-500" /></Button></DialogTrigger>
                                    <DialogContent><DialogHeader><DialogTitle>تأكيد الإرجاع</DialogTitle><ShadcnDialogDescription>هل أنت متأكد أنك تريد إرجاع هذه العملية؟ سيتم إعادة المنتجات إلى المخزون.</ShadcnDialogDescription></DialogHeader><DialogFooter className="gap-2 sm:justify-start pt-2"><DialogClose asChild><Button type="button" variant="secondary">إلغاء</Button></DialogClose><Button type="button" variant="destructive" onClick={() => handleReturnSale(sale.id)}>تأكيد الإرجاع</Button></DialogFooter></DialogContent>
                                </Dialog>
                            )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                </TableBody>
                 <TableFooter>
                    {Object.entries(dailyReportData.totalsByMethod).map(([method, total]) => {
                        const color = serviceColorMap.get(method) || 'hsl(var(--foreground))';
                        return (
                            <TableRow key={method} className="font-semibold">
                                <TableCell colSpan={2} className="text-right py-2">
                                    <div className="flex items-center justify-end gap-2">
                                        <span>إجمالي ({method})</span>
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                                    </div>
                                </TableCell>
                                <TableCell colSpan={2} className="text-left py-2">{total} LYD</TableCell>
                            </TableRow>
                        )
                    })}
                    <TableRow className="font-bold bg-muted/80 text-base">
                        <TableCell colSpan={2} className="text-right px-2 py-3">الإجماليات الكلية لليوم:</TableCell>
                        <TableCell colSpan={2} className="text-left px-2 py-3">
                           <div className="flex flex-col items-start gap-1">
                                <span>إجمالي المبيعات: {dailyReportData.totalSales} LYD</span>
                                {dailyReportData.totalDiscount > 0 && (
                                    <span className="text-orange-600 dark:text-orange-400 text-sm">
                                        (إجمالي الخصومات: {dailyReportData.totalDiscount})
                                    </span>
                                )}
                                {hasRole(['admin']) && (
                                    <span className={`text-sm ${dailyReportData.totalProfit >= 0 ? 'text-green-600 dark:text-green-500' : 'text-destructive'}`}>
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
            <div className="text-center py-10 text-muted-foreground"><Search size={48} className="mx-auto mb-2" /><p>لا توجد مبيعات مسجلة في التاريخ المحدد.</p></div>
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
