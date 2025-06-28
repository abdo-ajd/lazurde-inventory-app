
import type { User, Product, AppSettings, Sale } from './types';

export const LOCALSTORAGE_KEYS = {
  USERS: 'lahemir_users',
  PRODUCTS: 'lahemir_products',
  SALES: 'lahemir_sales',
  APP_SETTINGS: 'lahemir_app_settings',
  AUTH_USER: 'lahemir_auth_user',
};

export const DEFAULT_ADMIN_USER: User = {
  id: 'default-admin',
  username: 'abdo',
  password: '00123456', // In a real app, this would be hashed or handled by a proper auth system
  role: 'admin',
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  storeName: 'Lahemir',
  themeColors: {
    primary: '207 89% 61%',
    background: '0 0% 98%', 
    accent: '233 48% 59%',
  },
  bankServices: [
    { name: 'ادفع لي', color: 'hsl(221, 83%, 53%)' }, // Blue
    { name: 'سداد', color: 'hsl(142, 71%, 45%)' }, // Green
    { name: 'موبي كاش', color: 'hsl(24, 94%, 53%)' }, // Orange
    { name: 'نقدي', color: 'hsl(120, 60%, 35%)' }, // Cash - A distinct green
  ],
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    name: 'عباية سوداء كلاسيكية',
    price: 350,
    costPrice: 250,
    quantity: 15,
    imageUrl: 'https://placehold.co/300x450.png',
    barcodeValue: '123456789012', // Sample barcode value
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_2',
    name: 'عباية بتطريز فضي',
    price: 420,
    costPrice: 300,
    quantity: 8,
    imageUrl: 'https://placehold.co/300x450.png',
    barcodeValue: '123456789013', // Empty barcode value
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_3',
    name: 'عباية يومية عملية',
    price: 280,
    costPrice: 180,
    quantity: 25,
    imageUrl: 'https://placehold.co/300x450.png',
    barcodeValue: '123456789014', // Another sample
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_SALES: Sale[] = []; // Start with no sales

    

    



