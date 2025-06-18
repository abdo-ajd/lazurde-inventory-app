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
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  storeName: 'متجر لازوردي للعبايات', // Updated store name
  themeColors: {
    primary: '207 89% 61%',
    // Background and accent will be taken from globals.css defaults which were just updated
    // Keeping them here in case of a reset to these specific values is ever needed,
    // but applyTheme in AppSettingsContext will use the new --background from CSS.
    // For consistency, I'll update them to match the new CSS for light theme.
    background: '0 0% 98%', 
    accent: '233 48% 59%',
  },
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    name: 'عباية سوداء كلاسيكية',
    price: 350,
    quantity: 15,
    imageUrl: 'https://placehold.co/300x450.png', // Placeholder for abaya
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_2',
    name: 'عباية بتطريز فضي',
    price: 420,
    quantity: 8,
    imageUrl: 'https://placehold.co/300x450.png', // Placeholder for abaya
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_3',
    name: 'عباية يومية عملية',
    price: 280,
    quantity: 25,
    imageUrl: 'https://placehold.co/300x450.png', // Placeholder for abaya
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_SALES: Sale[] = []; // Start with no sales
