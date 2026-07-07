import React from 'react';
import {
  ResponsiveContainer,
  AreaChart, Area,
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

const BRAND_COLORS = [
  '#059669', // Brand Green
  '#2563eb', // Brand Blue
  '#10b981', // Emerald 500
  '#3b82f6', // Blue 500
  '#065f46', // Dark Green
  '#1d4ed8', // Dark Blue
];

export const ChartCard = ({
  type = 'line',
  data = [],
  title = '',
  loading = false,
  error = null,
  onRetry = null,
}) => {
  const renderChart = () => {
    if (data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-sm text-gray-400">
          <span>No data available for this range</span>
        </div>
      );
    }

    switch (type) {
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
              <XAxis dataKey="label" stroke="#9ca3af" fontSize={11} tickLine={false} />
              <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(17, 24, 39, 0.95)',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f3f4f6',
                  fontSize: '12px'
                }}
              />
              <Area type="monotone" dataKey="value" stroke="#059669" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
              <XAxis dataKey="label" stroke="#9ca3af" fontSize={11} tickLine={false} />
              <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(156, 163, 175, 0.1)' }}
                contentStyle={{
                  backgroundColor: 'rgba(17, 24, 39, 0.95)',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f3f4f6',
                  fontSize: '12px'
                }}
              />
              <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
              <XAxis dataKey="label" stroke="#9ca3af" fontSize={11} tickLine={false} />
              <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(17, 24, 39, 0.95)',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f3f4f6',
                  fontSize: '12px'
                }}
              />
              <Line type="monotone" dataKey="value" stroke="#059669" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 1.5 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
      case 'donut':
        const isDonut = type === 'donut';
        return (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="45%"
                innerRadius={isDonut ? 60 : 0}
                outerRadius={80}
                paddingAngle={isDonut ? 3 : 0}
                dataKey="value"
                nameKey="label"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={BRAND_COLORS[index % BRAND_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(17, 24, 39, 0.95)',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f3f4f6',
                  fontSize: '12px'
                }}
              />
              <Legend verticalAlign="bottom" height={36} iconSize={10} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }} />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm">
      {title && <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-6">{title}</h3>}
      
      {loading ? (
        <div className="animate-pulse flex flex-col justify-end h-64 space-y-4">
          <div className="flex items-end justify-between h-48 px-4 space-x-3">
            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-t h-1/4"></div>
            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-t h-1/2"></div>
            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-t h-2/3"></div>
            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-t h-3/4"></div>
            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-t h-1/3"></div>
            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-t h-5/6"></div>
          </div>
          <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-full"></div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-3">
          <p className="text-sm text-rose-500 dark:text-rose-400">Couldn't load data</p>
          {onRetry && (
            <button
              onClick={onRetry}
              type="button"
              className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium text-gray-700 dark:text-gray-200 transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      ) : (
        renderChart()
      )}
    </div>
  );
};

export default ChartCard;
