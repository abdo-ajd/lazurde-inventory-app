
import type { User, Product, AppSettings, Sale } from './types';

export const LOCALSTORAGE_KEYS = {
  USERS: 'lazurde_users',
  PRODUCTS: 'lazurde_products',
  SALES: 'lazurde_sales',
  APP_SETTINGS: 'lazurde_app_settings',
  AUTH_USER: 'lazurde_auth_user',
};

export const DEFAULT_ADMIN_USER: User = {
  id: 'default-admin',
  username: 'abdo',
  password: '00123456', // In a real app, this would be hashed or handled by a proper auth system
  role: 'admin',
  // avatarUrl: '', // Removed user avatar
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  storeName: 'متجر لازوردي للعبايات', // Updated store name
  themeColors: {
    primary: '207 89% 61%',
    background: '0 0% 98%', 
    accent: '233 48% 59%',
  },
  saleSuccessSound: '', // Default to no custom sound
  invalidDiscountSound: '', // Default to no custom sound for invalid discount
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
    barcodeValue: '', // Empty barcode value
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
    barcodeValue: 'ABC987654321', // Another sample
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_SALES: Sale[] = []; // Start with no sales

    