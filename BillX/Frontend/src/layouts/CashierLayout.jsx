import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { logout } from '../redux/slices/authSlice';
import { ThemeToggle } from '../components/ThemeToggle';
import { LayoutGrid, History, Undo2, Users, LogOut, Store } from 'lucide-react';

export const CashierLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const navItems = [
    { to: '/cashier/pos', label: 'POS Terminal', icon: LayoutGrid },
    { to: '/cashier/orders', label: 'Order History', icon: History },
    { to: '/cashier/refunds', label: 'Refunds/Returns', icon: Undo2 },
    { to: '/cashier/customers', label: 'Customers', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col md:flex-row transition-colors duration-200">
      
      {/* Sidebar - Visible on Desktop */}
      <aside className="w-full md:w-64 bg-white dark:bg-gray-900 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-gray-150 dark:border-gray-800">
            <span className="text-xl font-black tracking-tight text-brand-green flex items-center gap-1.5">
              <Store className="w-5 h-5" /> BillX <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-brand-green/10 text-brand-green rounded-full">Cashier</span>
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-brand-green text-white shadow-sm shadow-brand-green/20'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-200'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
          <div className="px-4 py-2">
            <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{user?.fullName}</p>
            <p className="text-xs text-gray-400 truncate flex items-center gap-1 mt-0.5">
              <Store className="w-3.5 h-3.5 text-gray-500" />
              {user?.branchName || 'No Branch Assigned'}
            </p>
          </div>
          
          <button
            onClick={handleLogout}
            type="button"
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 z-10 shrink-0">
          <div className="flex items-center">
            <h1 className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-200">
              {user?.branchName ? `${user.branchName} Station` : 'POS System'}
            </h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <ThemeToggle />
          </div>
        </header>

        {/* Page Content viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>

      </div>
    </div>
  );
};

export default CashierLayout;
