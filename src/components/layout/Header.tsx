
// src/components/layout/Header.tsx
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { LogOut, Settings, Users, BarChart3, Sun, Moon, PlusCircle, Search as SearchIcon, ListOrdered, Package, Barcode as BarcodeIcon } from 'lucide-react';
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


export default function Header() {
  const { currentUser, logout, hasRole } = useAuth();
  const { settings } = useAppSettings();
  const { theme, setTheme } = useTheme() ?? { theme: 'light', setTheme: () => {} };
  const [mounted, setMounted] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const { getProductByBarcode } = useProducts();
  const { addSale } = useSales();
  const { toast } = useToast();

  const [headerSearchValue, setHeaderSearchValue] = useState(searchParams.get('q') || '');
  const [scannedBarcode, setScannedBarcode] = useState('');
  const barcodeInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setHeaderSearchValue(searchParams.get('q') || '');
  }, [searchParams]);

  useEffect(() => {
    if (pathname === '/dashboard' && hasRole(['admin', 'employee', 'employee_return']) && currentUser) {
      const timer = setTimeout(() => {
        if (barcodeInputRef.current) {
          barcodeInputRef.current.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
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
    { href: '/dashboard/products', label: 'إدارة المنتجات (قائمة)', icon: ListOrdered, roles: ['admin'] },
    { href: '/dashboard/sales/report', label: 'تقرير المبيعات', icon: BarChart3, roles: ['admin', 'employee', 'employee_return'] },
    { href: '/dashboard/users', label: 'إدارة المستخدمين', icon: Users, roles: ['admin'] },
    { href: '/dashboard/settings', label: 'إعدادات التطبيق', icon: Settings, roles: ['admin'] },
  ];

  const showHeaderProductSearch = pathname === '/dashboard' || pathname.startsWith('/dashboard/products');
  const showDashboardBarcodeScanner = pathname === '/dashboard' && hasRole(['admin', 'employee', 'employee_return']);
  const showHeaderAddProduct = pathname === '/dashboard' && hasRole(['admin']);
  
  const userAvatarPlaceholder = `https://placehold.co/40x40/A4C3F5/FFFFFF?text=${getInitials(currentUser?.username || 'N A')}&font=sans-serif`;


  return (
    <TooltipProvider delayDuration={100}>
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 print:hidden">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-xl font-bold text-primary font-headline">
            {settings.storeName}
          </Link>
        </div>

        <div className="flex-1 flex justify-center">
            <nav className="flex items-center gap-1 sm:gap-2">
            {navIconsList.map(item => (
                hasRole(item.roles) && (
                <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                    <Button 
                        variant={pathname === item.href || (item.href === '/dashboard/products' && pathname.startsWith('/dashboard/products/')) ? "secondary" : "ghost"} 
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


        <div className="flex items-center gap-2 sm:gap-3">
          {showHeaderProductSearch && (
            <div className="relative hidden md:flex items-center">
              <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={"ابحث عن منتج..."}
                value={headerSearchValue}
                onChange={handleSearchChange}
                className="h-9 w-full md:w-40 lg:w-56 pr-10 text-sm"
                aria-label={"البحث عن منتج"}
              />
            </div>
          )}
          {showDashboardBarcodeScanner && (
            <div className="relative hidden md:flex items-center">
              <BarcodeIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                ref={barcodeInputRef}
                type="text"
                placeholder="امسح باركود للبيع..."
                value={scannedBarcode}
                onChange={(e) => setScannedBarcode(e.target.value)}
                onKeyDown={handleBarcodeKeyDown}
                className="h-9 w-full md:w-40 lg:w-48 pr-10 pl-4 py-2 text-sm"
                aria-label="إدخال الباركود للبيع السريع"
              />
            </div>
          )}
          {showHeaderAddProduct && (
            <Button asChild size="sm" className="hidden md:inline-flex">
              <Link href="/dashboard/products/add">
                <PlusCircle className="ml-1 h-4 w-4" /> إضافة
              </Link>
            </Button>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                aria-label={theme === 'light' ? 'التبديل إلى الوضع الداكن' : 'التبديل إلى الوضع الفاتح'}
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
                    <AvatarImage src={userAvatarPlaceholder} alt={currentUser.username} data-ai-hint="user avatar placeholder"/>
                    <AvatarFallback>{getInitials(currentUser.username)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{currentUser.username}</p>
                    <p className="text-xs leading-none text-muted-foreground">{currentUser.role}</p>
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
