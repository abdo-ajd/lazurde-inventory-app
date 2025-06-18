// src/components/layout/SidebarNav.tsx
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import type { NavItem } from '@/lib/types';
import { Package } from 'lucide-react';

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  // onItemClick?: () => void; // Removed as mobile sheet is no longer using it directly this way
}

// Defines the items that will remain in the sidebar.
const navItems: NavItem[] = [
  { title: 'إدارة المنتجات', href: '/dashboard/products', icon: Package, allowedRoles: ['admin', 'employee', 'employee_return'] },
];


export default function SidebarNav({ className, ...props }: SidebarNavProps) {
  const pathname = usePathname();
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  const userRole = currentUser.role;

  // Filter items based on user role.
  const filteredNavItems = navItems.filter(item => item.allowedRoles.includes(userRole));

  // If no items are available for the user, don't render the nav.
  if (filteredNavItems.length === 0) return null;

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
          // onClick={onItemClick} // Removed
          className={cn(
            buttonVariants({ variant: pathname.startsWith(item.href) ? "default" : "ghost" }), // use startsWith for active state on child routes
            "justify-start text-base h-11"
          )}
          aria-current={pathname.startsWith(item.href) ? "page" : undefined}
        >
          {item.icon && <item.icon className="ml-3 h-5 w-5" />}
          {item.title}
        </Link>
      ))}
    </nav>
  );
}
