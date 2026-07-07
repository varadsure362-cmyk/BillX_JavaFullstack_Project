import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchOverviewStats, fetchPaymentBreakdown, fetchSalesTrend, 
  setReportFilters 
} from '../../redux/slices/reportsSlice';
import { fetchBranches } from '../../redux/slices/branchesSlice';
import { setAvailableBranches } from '../../redux/slices/branchContextSlice';
import { StatCard } from '../../components/StatCard';
import { ChartCard } from '../../components/ChartCard';
import { 
  TrendingUp, ShoppingBag, Landmark, Users, 
  AlertCircle, Building2, HelpCircle 
} from 'lucide-react';
import api from '../../utils/api';

export const Dashboard = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const reports = useSelector((state) => state.reports);
  const branches = useSelector((state) => state.branches);
  const { availableBranches, selectedBranchId } = useSelector((state) => state.branchContext);

  const [activeRange, setActiveRange] = useState('7days');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalRefunds: 0,
    averageOrderValue: 0
  });
  const [paymentBreakdownData, setPaymentBreakdownData] = useState([]);
  const [salesTrendData, setSalesTrendData] = useState([]);

  // Load branches and set context
  useEffect(() => {
    const initBranches = async () => {
      const result = await dispatch(fetchBranches());
      if (fetchBranches.fulfilled.match(result)) {
        dispatch(setAvailableBranches(result.payload));
      }
    };
    initBranches();
  }, [dispatch]);

  // Load stats and charts whenever selectedBranchId or range changes
  useEffect(() => {
    loadDashboardData();
  }, [selectedBranchId, activeRange, user]);

  const loadDashboardData = async () => {
    if (!user) return;
    setLoading(true);

    // Determine target branches to fetch from
    const targetBranchIds = selectedBranchId === 'ALL' 
      ? ((user.managedBranchIds && user.managedBranchIds.length > 0) ? user.managedBranchIds : availableBranches.map(b => b.id))
      : [selectedBranchId];

    if (targetBranchIds.length === 0) {
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch and aggregate Overview Stats
      const overviewPromises = targetBranchIds.map(id => api.get('/api/reports/overview', { params: { branchId: id } }));
      const overviewResponses = await Promise.all(overviewPromises);
      
      let aggregatedRevenue = 0;
      let aggregatedOrders = 0;
      let aggregatedRefunds = 0;

      overviewResponses.forEach(res => {
        if (res.data.success && res.data.data) {
          aggregatedRevenue += res.data.data.totalRevenue || 0;
          aggregatedOrders += res.data.data.totalOrders || 0;
          aggregatedRefunds += res.data.data.totalRefunds || 0;
        }
      });

      setStats({
        totalRevenue: aggregatedRevenue,
        totalOrders: aggregatedOrders,
        totalRefunds: aggregatedRefunds,
        averageOrderValue: aggregatedOrders > 0 ? aggregatedRevenue / aggregatedOrders : 0
      });

      // 2. Fetch and aggregate Payment Breakdown
      const paymentPromises = targetBranchIds.map(id => 
        api.get('/api/reports/payment-breakdown', { params: { branchId: id, range: activeRange } })
      );
      const paymentResponses = await Promise.all(paymentPromises);
      
      const paymentMap = {};
      paymentResponses.forEach(res => {
        if (res.data.success && res.data.data) {
          res.data.data.forEach(item => {
            paymentMap[item.label] = (paymentMap[item.label] || 0) + item.value;
          });
        }
      });

      setPaymentBreakdownData(
        Object.entries(paymentMap).map(([label, value]) => ({ label, value }))
      );

      // 3. Fetch and aggregate Sales Trend
      const salesPromises = targetBranchIds.map(id =>
        api.get('/api/reports/sales-trend', { params: { branchId: id, range: activeRange } })
      );
      const salesResponses = await Promise.all(salesPromises);

      const salesMap = {};
      salesResponses.forEach(res => {
        if (res.data.success && res.data.data) {
          res.data.data.forEach(item => {
            salesMap[item.label] = (salesMap[item.label] || 0) + item.value;
          });
        }
      });

      setSalesTrendData(
        Object.entries(salesMap).map(([label, value]) => ({ label, value }))
      );

    } catch (err) {
      console.error('Failed to fetch dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRangeChange = (range) => {
    setActiveRange(range);
  };

  return (
    <div className="space-y-6">
      
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total revenue"
          value={`₹${stats.totalRevenue.toFixed(2)}`}
          icon={TrendingUp}
          trend={{ isPositive: true, value: '12% this week' }}
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders.toString()}
          icon={ShoppingBag}
          trend={{ isPositive: true, value: '5% today' }}
        />
        <StatCard
          title="Total Refunds"
          value={`₹${stats.totalRefunds.toFixed(2)}`}
          icon={Landmark}
          trend={{ isPositive: false, value: '1.2% rate' }}
        />
        <StatCard
          title="Average Order Value"
          value={`₹${stats.averageOrderValue.toFixed(2)}`}
          icon={Users}
        />
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales trend area chart */}
        <div className="lg:col-span-2 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Revenue Stream Analytics</h3>
            <div className="flex items-center space-x-1.5 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl shrink-0">
              {['7days', '30days', 'all'].map((range) => (
                <button
                  key={range}
                  onClick={() => handleRangeChange(range)}
                  type="button"
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeRange === range
                      ? 'bg-white dark:bg-gray-900 text-brand-green shadow-sm'
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  {range === '7days' ? '7D' : range === '30days' ? '30D' : 'All'}
                </button>
              ))}
            </div>
          </div>

          <ChartCard
            type="area"
            data={salesTrendData}
            title="Sales Trend Volume"
            loading={loading}
          />
        </div>

        {/* Payment breakdown donut chart */}
        <div className="flex flex-col space-y-4">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Payment Breakdown</h3>
          <ChartCard
            type="donut"
            data={paymentBreakdownData}
            title="Revenue Share by Method"
            loading={loading}
          />
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
