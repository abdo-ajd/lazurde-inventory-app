// src/components/layout/Header.tsx
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { LogOut, Settings, Users, BarChart3, Sun, Moon, LayoutDashboard, PlusCircle, Search as SearchIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "next-themes";
import { useState, useEffect, ChangeEvent } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';


export default function Header() {
  const { currentUser, logout, hasRole } = useAuth();
  const { settings } = useAppSettings();
  const { theme, setTheme } = useTheme() ?? { theme: 'light', setTheme: () => {} };
  const [mounted, setMounted] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [headerSearchValue, setHeaderSearchValue] = useState(searchParams.get('q') || '');

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    // Sync header input with URL q param if it changes (e.g. back/forward navigation)
    setHeaderSearchValue(searchParams.get('q') || '');
  }, [searchParams]);

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
    
    // Only push to router if current page is one that uses the search functionality
    // to avoid adding ?q= to pages that don't use it.
    if (pathname === '/dashboard' || pathname.startsWith('/dashboard/products')) {
        router.push(`${pathname}${query}`, { scroll: false });
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return '؟';
    return name.substring(0, 2).toUpperCase();
  };
  
  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4 md:px-6">
          <div className="h-6 w-24 animate-pulse rounded-md bg-muted"></div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted"></div> {/* Search skeleton */}
            <div className="h-8 w-20 animate-pulse rounded-md bg-muted md:flex"></div> {/* Add product skeleton */}
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted"></div> {/* Theme toggle skeleton */}
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted md:flex"></div> {/* User avatar skeleton */}
          </div>
        </div>
      </header>
    );
  }

  const navIconsList = [
    { href: '/dashboard', label: 'لوحة التحكم الرئيسية', icon: LayoutDashboard, roles: ['admin', 'employee', 'employee_return'] },
    { href: '/dashboard/sales/report', label: 'تقرير المبيعات', icon: BarChart3, roles: ['admin', 'employee', 'employee_return'] },
    { href: '/dashboard/users', label: 'إدارة المستخدمين', icon: Users, roles: ['admin'] },
    { href: '/dashboard/settings', label: 'إعدادات التطبيق', icon: Settings, roles: ['admin'] },
  ];

  const showSearchAndAddControls = pathname === '/dashboard' || pathname.startsWith('/dashboard/products');

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
                    <Button variant="ghost" size="icon" asChild>
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
          {showSearchAndAddControls && (
            <>
              <div className="relative hidden md:flex items-center">
                <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="ابحث عن منتج..."
                  value={headerSearchValue}
                  onChange={handleSearchChange}
                  className="h-9 w-full md:w-40 lg:w-56 pr-10 text-sm"
                  aria-label="البحث عن منتج"
                />
              </div>
              {hasRole(['admin']) && (
                <Button asChild size="sm" className="hidden md:inline-flex">
                  <Link href="/dashboard/products/add">
                    <PlusCircle className="ml-1 h-4 w-4" /> إضافة
                  </Link>
                </Button>
              )}
            </>
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
                    <AvatarImage src={`https://placehold.co/40x40/A4C3F5/FFFFFF?text=${getInitials(currentUser.username)}`} alt={currentUser.username} data-ai-hint="user avatar"/>
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
