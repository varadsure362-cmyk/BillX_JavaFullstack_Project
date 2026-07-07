import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCurrentUser } from './redux/slices/authSlice';
import RouteGuard from './routes/RouteGuard';

// Layouts
import CashierLayout from './layouts/CashierLayout';
import ManagerLayout from './layouts/ManagerLayout';

// Public Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import OAuth2Callback from './pages/OAuth2Callback';

// Cashier Pages
import PosTerminal from './pages/cashier/PosTerminal';
import OrderHistory from './pages/cashier/OrderHistory';
import ReturnsRefunds from './pages/cashier/ReturnsRefunds';
import CashierCustomers from './pages/cashier/Customers';

// Manager Pages
import Dashboard from './pages/manager/Dashboard';
import Branches from './pages/manager/Branches';
import Products from './pages/manager/Products';
import Categories from './pages/manager/Categories';
import Employees from './pages/manager/Employees';
import Alerts from './pages/manager/Alerts';
import Inventory from './pages/manager/Inventory';
import Transactions from './pages/manager/Transactions';
import Reports from './pages/manager/Reports';
import Settings from './pages/manager/Settings';

export const App = () => {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);
  const theme = useSelector((state) => state.theme.mode);

  // Sync dark class on document root
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Keep session hydrated on refresh
  useEffect(() => {
    if (token && !user) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch, token, user]);

  return (
    <BrowserRouter>
      <Routes>
        
        {/* Public Landing & Authentication */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/oauth2/callback" element={<OAuth2Callback />} />

        {/* Protected Cashier Section */}
        <Route
          path="/cashier"
          element={
            <RouteGuard allowedRoles={['CASHIER']}>
              <CashierLayout />
            </RouteGuard>
          }
        >
          <Route index element={<Navigate to="pos" replace />} />
          <Route path="pos" element={<PosTerminal />} />
          <Route path="orders" element={<OrderHistory />} />
          <Route path="refunds" element={<ReturnsRefunds />} />
          <Route path="customers" element={<CashierCustomers />} />
        </Route>

        {/* Protected Manager Section */}
        <Route
          path="/manager"
          element={
            <RouteGuard allowedRoles={['MANAGER']}>
              <ManagerLayout />
            </RouteGuard>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="branches" element={<Branches />} />
          <Route path="products" element={<Products />} />
          <Route path="categories" element={<Categories />} />
          <Route path="employees" element={<Employees />} />
          <Route path="customers" element={<CashierCustomers />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
};

export default App;
