// src/components/layout/SidebarNav.tsx
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import type { NavItem, UserRole } from '@/lib/types';
import { Package, Users, BarChart3, Settings, CreditCard, Home } from 'lucide-react';

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  onItemClick?: () => void; // Optional: Callback for when an item is clicked, e.g. to close mobile sheet
}

const navItems: NavItem[] = [
  { title: 'لوحة التحكم الرئيسية', href: '/dashboard', icon: Home, allowedRoles: ['admin', 'employee', 'employee_return'] },
  { title: 'إدارة المنتجات', href: '/dashboard/products', icon: Package, allowedRoles: ['admin', 'employee', 'employee_return'] },
  { title: 'تقرير المبيعات', href: '/dashboard/sales/report', icon: BarChart3, allowedRoles: ['admin', 'employee', 'employee_return'] },
  { title: 'إدارة المستخدمين', href: '/dashboard/users', icon: Users, allowedRoles: ['admin'] },
  { title: 'إعدادات التطبيق', href: '/dashboard/settings', icon: Settings, allowedRoles: ['admin'] },
];


export default function SidebarNav({ className, onItemClick, ...props }: SidebarNavProps) {
  const pathname = usePathname();
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  const userRole = currentUser.role;

  const filteredNavItems = navItems.filter(item => item.allowedRoles.includes(userRole));

  return (
    <nav
      className={cn(
        "flex flex-col space-y-1 p-4",
        className
      )}
      {...props}
    >
      {filteredNavItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onItemClick}
          className={cn(
            buttonVariants({ variant: pathname === item.href ? "default" : "ghost" }),
            "justify-start text-base h-11"
          )}
          aria-current={pathname === item.href ? "page" : undefined}
        >
          {item.icon && <item.icon className="ml-3 h-5 w-5" />}
          {item.title}
        </Link>
      ))}
    </nav>
  );
}
