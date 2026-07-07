import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toggleTheme } from '../../redux/slices/themeSlice';
import { Settings as SettingsIcon, Moon, Sun, ShieldCheck, Mail, Sliders } from 'lucide-react';

export const Settings = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const theme = useSelector((state) => state.theme.mode);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      <div className="flex items-center space-x-2">
        <SettingsIcon className="w-6 h-6 text-brand-green" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Manager Settings</h2>
      </div>

      {/* Account Info card */}
      <div className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1"><ShieldCheck className="w-4.5 h-4.5" /> Security & Profile</h3>
        
        <div className="grid grid-cols-2 gap-4 text-sm font-medium">
          <div>
            <p className="text-gray-400 text-xs">Full Name</p>
            <p className="text-gray-900 dark:text-white mt-1">{user?.fullName}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">Email Address</p>
            <p className="text-gray-900 dark:text-white mt-1">{user?.email}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">System Role</p>
            <p className="text-gray-950 dark:text-white mt-1 uppercase tracking-wider">{user?.role}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">Assigned Branches Count</p>
            <p className="text-gray-900 dark:text-white mt-1">{user?.managedBranchIds?.length || 0}</p>
          </div>
        </div>
      </div>

      {/* Preferences system settings */}
      <div className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm space-y-5">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5"><Sliders className="w-4.5 h-4.5" /> Appearance Preferences</h3>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-gray-900 dark:text-white text-sm">Theme Mode</p>
            <p className="text-xs text-gray-400 mt-0.5">Toggle local color scheme preference.</p>
          </div>
          
          <button
            onClick={() => dispatch(toggleTheme())}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-250 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-850 rounded-xl text-xs font-semibold"
            type="button"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4.5 h-4.5 text-amber-500" />
                <span>Light Theme</span>
              </>
            ) : (
              <>
                <Moon className="w-4.5 h-4.5 text-indigo-500" />
                <span>Dark Theme</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mail Alert info */}
      <div className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5"><Mail className="w-4.5 h-4.5 text-brand-green" /> Automated Reporting</h3>
        
        <div className="space-y-2 text-xs text-gray-500 leading-relaxed font-medium">
          <p>
            The backend executes a recurring scheduler that automatically aggregates weekly statistics and delivers PDF reports directly to your email inbox: <span className="font-bold text-gray-700 dark:text-gray-300">{user?.email}</span>.
          </p>
          <p>
            To configure specific notification intervals or disable automated dispatching, contact the site administrator.
          </p>
        </div>
      </div>

    </div>
  );
};

export default Settings;
