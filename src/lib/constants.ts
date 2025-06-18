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
  storeName: 'متجر لازوردي',
  themeColors: {
    primary: '207 89% 61%',
    background: '188 67% 92%',
    accent: '233 48% 59%',
  },
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    name: 'منتج تجريبي ١',
    price: 150,
    quantity: 20,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_2',
    name: 'منتج تجريبي ٢',
    price: 75,
    quantity: 50,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_3',
    name: 'منتج آخر',
    price: 220,
    quantity: 15,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_SALES: Sale[] = []; // Start with no sales
