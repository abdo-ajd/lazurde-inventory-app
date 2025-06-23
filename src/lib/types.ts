

export type UserRole = 'admin' | 'employee' | 'employee_return';

export interface User {
  id: string;
  username: string;
  password?: string; // Password will be stored hashed in a real app, plain text here for simplicity
  role: UserRole;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  costPrice?: number;
  quantity: number;
  imageUrl?: string; 
  barcodeValue?: string; 
  createdAt: string;
  updatedAt: string;
}

export type SaleStatus = 'active' | 'returned';

export interface SaleItem {
  productId: string;
  productName: string; // Denormalized for easier display
  quantity: number;
  pricePerUnit: number; // Price at the time of sale
}

export interface Sale {
  id: string;
  items: SaleItem[];
  originalTotalAmount: number; // Sum of (item.pricePerUnit * item.quantity)
  discountAmount: number;      // Discount applied to the sale
  totalAmount: number;         // Final amount: originalTotalAmount - discountAmount
  saleDate: string; // ISO string
  sellerId: string;
  sellerUsername: string; // Denormalized
  status: SaleStatus;
  returnedDate?: string; // ISO string if returned
  paymentMethod?: string;
}

export interface AppSettings {
  storeName: string;
  themeColors: {
    primary: string; // HSL format: "H S% L%"
    background: string;
    accent: string;
  };
  saleSuccessSound?: string; // Data URI for the sound
  rejectedOperationSound?: string; // Data URI for any rejected/failed operation
  bankServices?: { name: string; color: string; }[];
}

export interface NavItem {
  title: string;
  href: string;
  icon?: React.ElementType;
  allowedRoles: UserRole[];
  disabled?: boolean;
  external?: boolean;
}

    