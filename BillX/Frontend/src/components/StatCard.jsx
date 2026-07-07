import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const StatCard = ({ title, value, icon: Icon, trend }) => {
  return (
    <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm transition-all duration-200 hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</span>
        {Icon && (
          <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/80 text-brand-green dark:text-brand-green-500">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-bold tracking-tight">{value}</span>
        {trend && (
          <div
            className={`flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
              trend.isPositive
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400'
            }`}
          >
            {trend.isPositive ? (
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
            )}
            {trend.value}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
