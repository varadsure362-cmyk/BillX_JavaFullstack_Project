import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { logout } from '../redux/slices/authSlice';
import { ThemeToggle } from '../components/ThemeToggle';
import { BranchSwitcher } from '../components/BranchSwitcher';
import { fetchBranches } from '../redux/slices/branchesSlice';
import { setAvailableBranches } from '../redux/slices/branchContextSlice';
import {
  LayoutDashboard, Building2, Package, Tag, Users,
  Bell, ClipboardList, Receipt, BarChart3, Settings,
  LogOut, Menu, X, ShieldAlert
} from 'lucide-react';

export const ManagerLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const { list: branchesList } = useSelector((state) => state.branches);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user && user.role === 'MANAGER') {
      dispatch(fetchBranches());
    }
  }, [dispatch, user]);

  useEffect(() => {
    dispatch(setAvailableBranches(branchesList));
  }, [dispatch, branchesList]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const navItems = [
    { to: '/manager/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/manager/branches', label: 'Branches', icon: Building2 },
    { to: '/manager/products', label: 'Products', icon: Package },
    { to: '/manager/categories', label: 'Categories', icon: Tag },
    { to: '/manager/employees', label: 'Employees', icon: Users },
    { to: '/manager/customers', label: 'Customers', icon: Users },
    { to: '/manager/inventory', label: 'Inventory', icon: ClipboardList },
    { to: '/manager/transactions', label: 'Transactions', icon: Receipt },
    { to: '/manager/reports', label: 'Reports', icon: BarChart3 },
    { to: '/manager/alerts', label: 'Alerts', icon: Bell },
    { to: '/manager/settings', label: 'Settings', icon: Settings },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 justify-between">
      <div>
        {/* Brand */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-150 dark:border-gray-800">
          <span className="text-xl font-black tracking-tight text-brand-green flex items-center gap-1.5">
            <Building2 className="w-5 h-5" /> BillX <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-brand-blue/10 text-brand-blue rounded-full">Manager</span>
          </span>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Links */}
        <nav className="p-4 space-y-0.5 overflow-y-auto max-h-[calc(100vh-170px)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-brand-green text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-200'
                  }`
                }
              >
                <Icon className="w-4.5 h-4.5 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer / Account */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-3 shrink-0">
        <div className="px-4 py-1.5">
          <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{user?.fullName}</p>
          <p className="text-xs text-gray-400 truncate mt-0.5">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          type="button"
          className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
        >
          <LogOut className="w-4.5 h-4.5 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col lg:flex-row transition-colors duration-200">
      
      {/* Desktop Sidebar (Permanent) */}
      <aside className="hidden lg:block w-64 border-r border-gray-200 dark:border-gray-800 shrink-0 bg-white dark:bg-gray-900">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer body */}
          <div className="relative flex flex-col w-64 max-w-xs bg-white dark:bg-gray-900 shadow-xl animate-in slide-in-from-left duration-200">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 z-10 shrink-0">
          
          <div className="flex items-center space-x-3">
            {/* Hamburger button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-850 hover:bg-gray-50 text-gray-600 dark:text-gray-300"
              type="button"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Branch context switcher */}
            <BranchSwitcher />
          </div>
          
          <div className="flex items-center space-x-3">
            <ThemeToggle />
          </div>
        </header>

        {/* Dynamic page contents viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>

      </div>
    </div>
  );
};

export default ManagerLayout;
