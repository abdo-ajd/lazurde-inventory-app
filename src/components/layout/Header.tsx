// src/components/layout/Header.tsx
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { LogOut, Settings, Users, BarChart3, Sun, Moon, PlusCircle, Search as SearchIcon, ListOrdered, Package, Barcode as BarcodeIcon, MinusCircle, FileText } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useTheme } from "next-themes";
import { useState, useEffect, ChangeEvent, KeyboardEvent, useRef } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useProducts } from '@/contexts/ProductContext';
import { useSales } from '@/contexts/SalesContext';
import { useToast } from '@/hooks/use-toast';
import type { UserRole } from '@/lib/types';
import { usePos } from '@/contexts/PosContext';


export default function Header() {
  const { currentUser, logout, hasRole } = useAuth();
  const { settings } = useAppSettings();
  const { theme, setTheme } = useTheme() ?? { theme: 'light', setTheme: () => {} };
  const [mounted, setMounted] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const { getProductByBarcode } = useProducts();
  const { addSale, currentDiscount, setCurrentDiscount } = useSales();
  const { toast } = useToast();
  const { addItemToCart, posSearchTerm, setPosSearchTerm } = usePos();

  const [headerSearchValue, setHeaderSearchValue] = useState(searchParams.get('q') || '');
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [posScannedBarcode, setPosScannedBarcode] = useState('');
  
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const posBarcodeInputRef = useRef<HTMLInputElement>(null);

  const roleTranslations: Record<UserRole, string> = {
    admin: 'مدير',
    employee: 'موظف',
    employee_return: 'موظف إرجاع',
  };


  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setHeaderSearchValue(searchParams.get('q') || '');
  }, [searchParams]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (hasRole(['admin', 'employee', 'employee_return']) && currentUser) {
      if (pathname === '/dashboard') {
        timer = setTimeout(() => barcodeInputRef.current?.focus(), 100);
      } else if (pathname === '/dashboard/pos') {
        timer = setTimeout(() => posBarcodeInputRef.current?.focus(), 100);
      }
    }
    return () => clearTimeout(timer);
  }, [pathname, currentUser, hasRole]);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setHeaderSearchValue(newSearchTerm);

    const current = new URLSearchParams(Array.from(searchParams.entries()));
    if (newSearchTerm.trim()) {
      current.set('q', newSearchTerm.trim());
    } else {
      current.delete('q');
    }
    const search = current.toString();
    const query = search ? `?${search}` : '';
    
    if (pathname === '/dashboard' || pathname.startsWith('/dashboard/products')) {
        router.push(`${pathname}${query}`, { scroll: false });
    }
  };

  const handleBarcodeScan = async () => {
    if (!scannedBarcode.trim()) return;
    const product = getProductByBarcode(scannedBarcode.trim());

    if (product) {
      if (product.quantity > 0) {
        if (currentUser) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const saleResult = await addSale([{ productId: product.id, quantity: 1 }]);
        } else {
          toast({ variant: "destructive", title: "خطأ", description: "يجب تسجيل الدخول لإتمام عملية البيع." });
        }
      } else {
        toast({ variant: "destructive", title: "نفذت الكمية", description: `المنتج "${product.name}" غير متوفر حالياً.` });
      }
    } else {
      toast({ variant: "destructive", title: "لم يتم العثور على المنتج", description: "الباركود المدخل غير صحيح أو المنتج غير موجود." });
    }
    setScannedBarcode(''); 
  };

  const handleBarcodeKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault(); 
      handleBarcodeScan();
    }
  };
  
  const handleDiscountKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (scannedBarcode.trim()) {
        handleBarcodeScan(); 
      }
    }
  };

  const handleDiscountInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setCurrentDiscount(isNaN(value) || value < 0 ? 0 : value);
  };
  
  const handlePosSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPosSearchTerm(e.target.value);
  };

  const handlePosBarcodeScan = () => {
    if (!posScannedBarcode.trim()) return;
    const product = getProductByBarcode(posScannedBarcode.trim());
    if (product) {
        addItemToCart(product);
    } else {
        toast({
            variant: "destructive",
            title: "لم يتم العثور على المنتج",
            description: "الباركود المدخل غير صحيح أو المنتج غير موجود.",
        });
    }
    setPosScannedBarcode('');
    posBarcodeInputRef.current?.focus();
  };

  const handlePosBarcodeKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handlePosBarcodeScan();
    }
  };


  const getInitials = (name?: string) => {
    if (!name) return '؟';
    const parts = name.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length-1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  
  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4 md:px-6">
          <div className="h-6 w-24 animate-pulse rounded-md bg-muted"></div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted"></div> 
            <div className="h-8 w-20 animate-pulse rounded-md bg-muted md:flex"></div> 
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted"></div> 
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted md:flex"></div>
          </div>
        </div>
      </header>
    );
  }

  const navIconsList = [
    { href: '/dashboard', label: 'المنتجات (صور)', icon: Package, roles: ['admin', 'employee', 'employee_return'] },
    { href: '/dashboard/pos', label: 'نقطة البيع (فاتورة)', icon: FileText, roles: ['admin', 'employee', 'employee_return'] },
    { href: '/dashboard/sales/report', label: 'تقرير المبيعات', icon: BarChart3, roles: ['admin', 'employee', 'employee_return'] },
    { href: '/dashboard/products', label: 'إدارة المنتجات (قائمة)', icon: ListOrdered, roles: ['admin'] },
    { href: '/dashboard/users', label: 'إدارة المستخدمين', icon: Users, roles: ['admin'] },
    { href: '/dashboard/settings', label: 'إعدادات التطبيق', icon: Settings, roles: ['admin'] },
  ];

  const showHeaderProductSearch = pathname === '/dashboard' || pathname.startsWith('/dashboard/products');
  const showDashboardBarcodeScanner = pathname === '/dashboard' && hasRole(['admin', 'employee', 'employee_return']);
  const showPosHeaderInputs = pathname === '/dashboard/pos' && hasRole(['admin', 'employee', 'employee_return']);
  
  const userAvatarSrc = "https://images.unsplash.com/photo-1633409361618-c73427e4e206?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw2fHxpY29ufGVufDB8fHx8MTc1MDMyMjQ3M3ww&ixlib=rb-4.1.0&q=80&w=1080";


  return (
    <TooltipProvider delayDuration={100}>
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 print:hidden">
      <div className="container grid h-14 grid-cols-[1fr_auto_1fr] max-w-screen-2xl items-center px-4 md:px-6">
        
        {/* Column 1: Left-aligned content */}
        <div className="flex items-center justify-start gap-4">
          <Link href="/dashboard" className="text-xl font-bold text-primary font-headline">
            {settings.storeName}
          </Link>
        </div>

        {/* Column 2: Centered navigation */}
        <div className="flex justify-center">
            <nav className="flex items-center gap-1 sm:gap-2">
            {navIconsList.map(item => (
                hasRole(item.roles) && (
                <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                    <Button 
                        variant={pathname.startsWith(item.href) && (item.href !== '/dashboard' || pathname === '/dashboard') ? "secondary" : "ghost"} 
                        size="icon" 
                        asChild
                    >
                        <Link href={item.href} aria-label={item.label}>
                           <item.icon className="h-5 w-5" />
                        </Link>
                    </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                    <p>{item.label}</p>
                    </TooltipContent>
                </Tooltip>
                )
            ))}
            </nav>
        </div>

        {/* Column 3: Right-aligned content */}
        <div className="flex items-center justify-end gap-1 sm:gap-2">
          {showHeaderProductSearch && !showPosHeaderInputs && (
            <div className="relative hidden md:flex items-center">
              <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={"ابحث عن منتج..."}
                value={headerSearchValue}
                onChange={handleSearchChange}
                className="h-9 w-full md:w-32 lg:w-48 pr-10 text-sm"
                aria-label={"البحث عن منتج"}
              />
            </div>
          )}
          {showDashboardBarcodeScanner && (
            <div className="relative hidden md:flex items-center gap-1">
              <div className="relative">
                <BarcodeIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    ref={barcodeInputRef}
                    type="text"
                    placeholder="امسح باركود..."
                    value={scannedBarcode}
                    onChange={(e) => setScannedBarcode(e.target.value)}
                    onKeyDown={handleBarcodeKeyDown}
                    className="h-9 w-full md:w-32 lg:w-40 pr-10 pl-4 py-2 text-sm"
                    aria-label="إدخال الباركود للبيع السريع"
                />
              </div>
              <div className="relative">
                <MinusCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="number"
                    placeholder="خصم..."
                    value={currentDiscount === 0 ? '' : String(currentDiscount)}
                    onChange={handleDiscountInputChange}
                    onKeyDown={handleDiscountKeyDown}
                    className="h-9 w-20 md:w-20 lg:w-24 pr-9 pl-2 py-2 text-sm appearance-none [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    aria-label="إدخال قيمة الخصم"
                    min="0"
                />
              </div>
            </div>
          )}
          {showPosHeaderInputs && (
            <div className="relative hidden md:flex items-center gap-1">
               <div className="relative">
                <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="ابحث عن منتج..."
                    value={posSearchTerm}
                    onChange={handlePosSearchChange}
                    className="h-9 w-full md:w-32 lg:w-48 pr-10 text-sm"
                    aria-label="البحث عن منتج لإضافته للفاتورة"
                />
              </div>
              <div className="relative">
                <BarcodeIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    ref={posBarcodeInputRef}
                    type="text"
                    placeholder="امسح باركود..."
                    value={posScannedBarcode}
                    onChange={(e) => setPosScannedBarcode(e.target.value)}
                    onKeyDown={handlePosBarcodeKeyDown}
                    className="h-9 w-full md:w-32 lg:w-40 pr-10 pl-4 py-2 text-sm"
                    aria-label="إدخال الباركود لإضافته للفاتورة"
                />
              </div>
            </div>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                aria-label={theme === 'light' ? 'التبديل إلى الوضع الداكن' : 'التبديل إلى الوضع الفاتح'}
                className="h-9 w-9"
              >
                {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{theme === 'light' ? 'الوضع الداكن' : 'الوضع الفاتح'}</p>
            </TooltipContent>
          </Tooltip>

          {currentUser && (
            <DropdownMenu dir="rtl">
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={userAvatarSrc} alt={currentUser.username} data-ai-hint="user avatar placeholder"/>
                    <AvatarFallback>{getInitials(currentUser.username)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{currentUser.username}</p>
                    <p className="text-xs leading-none text-muted-foreground">{roleTranslations[currentUser.role]}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="ml-2 h-4 w-4" />
                  <span>تسجيل الخروج</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
    </TooltipProvider>
  );
}
