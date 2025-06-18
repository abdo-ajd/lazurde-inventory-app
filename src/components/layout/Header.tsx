// src/components/layout/Header.tsx
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { LogOut, Menu, Settings, Users, ShoppingCart, BarChart3, Sun, Moon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "next-themes"; // Assuming next-themes is or will be installed for theme toggling
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import SidebarNav from './SidebarNav'; // This will be the navigation component
import { useState, useEffect } from 'react';


export default function Header() {
  const { currentUser, logout, hasRole } = useAuth();
  const { settings } = useAppSettings();
  const { theme, setTheme } = useTheme() ?? { theme: 'light', setTheme: () => {} }; // Provide default if useTheme is not ready
  const [mounted, setMounted] = useState(false);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

  useEffect(() => setMounted(true), []);


  const getInitials = (name?: string) => {
    if (!name) return '؟';
    return name.substring(0, 2).toUpperCase();
  };
  
  if (!mounted) {
    // Render a placeholder or null during server rendering / hydration mismatch
    return (
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4 md:px-6">
          <div className="h-6 w-24 animate-pulse rounded-md bg-muted"></div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted"></div>
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted"></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 print:hidden">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">فتح القائمة</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <div className="p-4 border-b">
                <Link href="/dashboard" className="text-xl font-bold text-primary">
                  {settings.storeName}
                </Link>
              </div>
              <SidebarNav onItemClick={() => setIsMobileSheetOpen(false)} />
            </SheetContent>
          </Sheet>
          <Link href="/dashboard" className="hidden md:block text-xl font-bold text-primary font-headline">
            {settings.storeName}
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            aria-label={theme === 'light' ? 'التبديل إلى الوضع الداكن' : 'التبديل إلى الوضع الفاتح'}
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>

          {currentUser && (
            <DropdownMenu dir="rtl">
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={`https://placehold.co/40x40/A4C3F5/FFFFFF?text=${getInitials(currentUser.username)}`} alt={currentUser.username} data-ai-hint="user avatar" />
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
  );
}
