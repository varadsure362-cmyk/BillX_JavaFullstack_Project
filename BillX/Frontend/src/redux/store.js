import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import themeReducer from './slices/themeSlice';
import branchContextReducer from './slices/branchContextSlice';
import cartReducer from './slices/cartSlice';
import productsReducer from './slices/productsSlice';
import categoriesReducer from './slices/categoriesSlice';
import customersReducer from './slices/customersSlice';
import ordersReducer from './slices/ordersSlice';
import paymentsReducer from './slices/paymentsSlice';
import refundsReducer from './slices/refundsSlice';
import branchesReducer from './slices/branchesSlice';
import employeesReducer from './slices/employeesSlice';
import inventoryReducer from './slices/inventorySlice';
import reportsReducer from './slices/reportsSlice';
import alertsReducer from './slices/alertsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    theme: themeReducer,
    branchContext: branchContextReducer,
    cart: cartReducer,
    products: productsReducer,
    categories: categoriesReducer,
    customers: customersReducer,
    orders: ordersReducer,
    payments: paymentsReducer,
    refunds: refundsReducer,
    branches: branchesReducer,
    employees: employeesReducer,
    inventory: inventoryReducer,
    reports: reportsReducer,
    alerts: alertsReducer,
  },
});

export default store;
