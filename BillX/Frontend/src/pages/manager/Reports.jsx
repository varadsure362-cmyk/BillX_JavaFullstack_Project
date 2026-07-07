import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchSalesTrend, fetchTopProducts, fetchCashierPerformance, 
  fetchSalesByCategory, fetchRefundSpikes, generateWeeklyReport, 
  fetchWeeklyReportHistory 
} from '../../redux/slices/reportsSlice';
import { ChartCard } from '../../components/ChartCard';
import { DataTable } from '../../components/DataTable';
import { BarChart3, Mail, Download, RefreshCw, Calendar, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';
import api from '../../utils/api';

export const Reports = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const reports = useSelector((state) => state.reports);
  const { availableBranches, selectedBranchId } = useSelector((state) => state.branchContext);

  const [dateRange, setDateRange] = useState('7days');
  const [loadingCharts, setLoadingCharts] = useState(false);
  
  // Weekly generation dates
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfMessage, setPdfMessage] = useState(null);

  useEffect(() => {
    loadAllReports();
  }, [dispatch, selectedBranchId, dateRange, user]);

  const loadAllReports = async () => {
    if (!user) return;
    setLoadingCharts(true);

    const activeBranchId = selectedBranchId === 'ALL'
      ? (user.managedBranchIds?.[0] || availableBranches[0]?.id)
      : selectedBranchId;

    if (!activeBranchId) {
      setLoadingCharts(false);
      return;
    }

    try {
      // Dispatch all chart fetches in parallel (RTK signals will cancel previous ones automatically on change)
      await Promise.all([
        dispatch(fetchSalesTrend({ branchId: activeBranchId, range: dateRange })),
        dispatch(fetchTopProducts({ branchId: activeBranchId })),
        dispatch(fetchCashierPerformance({ branchId: activeBranchId })),
        dispatch(fetchSalesByCategory({ branchId: activeBranchId })),
        dispatch(fetchRefundSpikes({ branchId: activeBranchId })),
        dispatch(fetchWeeklyReportHistory({ branchId: activeBranchId }))
      ]);
    } catch (err) {
      console.error('Failed to reload report charts:', err);
    } finally {
      setLoadingCharts(false);
    }
  };

  const handleManualGenerate = async (e) => {
    e.preventDefault();
    const activeBranchId = selectedBranchId === 'ALL'
      ? (user.managedBranchIds?.[0] || availableBranches[0]?.id)
      : selectedBranchId;

    if (!activeBranchId) return;

    setIsGeneratingPdf(true);
    setPdfMessage(null);

    const payload = {
      branchId: activeBranchId,
      start: startDate || null,
      end: endDate || null
    };

    const result = await dispatch(generateWeeklyReport(payload));
    if (generateWeeklyReport.fulfilled.match(result)) {
      setPdfMessage({
        isSuccess: true,
        text: 'Report generated, emailed to managers, and logged in history!'
      });
      setStartDate('');
      setEndDate('');
      dispatch(fetchWeeklyReportHistory({ branchId: activeBranchId })); // Reload history
    } else {
      setPdfMessage({
        isSuccess: false,
        text: result.payload || 'Failed to generate PDF report.'
      });
    }
    setIsGeneratingPdf(false);
  };

  // Secure download using our Axios api instance
  const downloadPdf = async (reportId) => {
    try {
      const response = await api.get(`/api/reports/weekly/download/${reportId}`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `WeeklyReport_${reportId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to download weekly report PDF', err);
    }
  };

  const refundSpikesColumns = [
    { key: 'id', label: 'Alert ID' },
    { key: 'createdAt', label: 'Timestamp', render: (row) => new Date(row.createdAt).toLocaleString() },
    { key: 'message', label: 'Warning Log' },
    {
      key: 'status',
      label: 'Read status',
      render: (row) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${row.isRead ? 'bg-gray-100 text-gray-500' : 'bg-rose-50 text-rose-500'}`}>
          {row.isRead ? 'READ' : 'UNREAD'}
        </span>
      )
    }
  ];

  const historyColumns = [
    { key: 'id', label: 'Report ID' },
    { key: 'weekStartDate', label: 'Start Date' },
    { key: 'weekEndDate', label: 'End Date' },
    { key: 'emailedTo', label: 'Emailed To' },
    { key: 'generatedAt', label: 'Generated At', render: (row) => new Date(row.generatedAt).toLocaleString() },
    {
      key: 'actions',
      label: 'Action',
      render: (row) => (
        <button
          onClick={() => downloadPdf(row.id)}
          className="text-xs text-brand-green font-bold hover:underline flex items-center gap-1"
          type="button"
        >
          <Download className="w-3.5 h-3.5" /> Download PDF
        </button>
      )
    }
  ];

  return (
    <div className="space-y-8">
      
      {/* Upper Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-1.5"><BarChart3 className="w-5 h-5 text-brand-green" /> Aggregated Performance Reports</h2>
        
        <div className="flex items-center space-x-1.5 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl shrink-0">
          {['7days', '30days', 'all'].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              type="button"
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                dateRange === range
                  ? 'bg-white dark:bg-gray-900 text-brand-green shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {range === '7days' ? '7 Days' : range === '30days' ? '30 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* Manual generator card */}
      <div className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1"><Mail className="w-4 h-4" /> Generate and Email PDF Report</h3>
        
        {pdfMessage && (
          <div className={`p-4 rounded-xl border text-sm flex items-start space-x-2 ${
            pdfMessage.isSuccess 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
              : 'bg-rose-50 border-rose-200 text-rose-600'
          }`}>
            {pdfMessage.isSuccess ? <ShieldCheck className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
            <span className="font-semibold">{pdfMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleManualGenerate} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 flex items-center gap-1"><Calendar className="w-4 h-4" /> Start Date (Optional)</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2.5 text-xs sm:text-sm border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 rounded-xl text-gray-900 dark:text-gray-250 outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 flex items-center gap-1"><Calendar className="w-4 h-4" /> End Date (Optional)</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2.5 text-xs sm:text-sm border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-955 rounded-xl text-gray-900 dark:text-gray-250 outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isGeneratingPdf}
            className="py-2.5 bg-brand-green hover:bg-brand-green-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-1.5"
          >
            {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate & Mail'}
          </button>
        </form>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartCard
          type="line"
          data={reports.salesTrend}
          title="Revenue Trend"
          loading={loadingCharts}
        />
        <ChartCard
          type="bar"
          data={reports.topProducts}
          title="Top Performing Products"
          loading={loadingCharts}
        />
        <ChartCard
          type="bar"
          data={reports.cashierPerformance}
          title="Cashier Leaderboard (Transactions)"
          loading={loadingCharts}
        />
        <ChartCard
          type="pie"
          data={reports.salesByCategory}
          title="Revenue Share by Category"
          loading={loadingCharts}
        />
      </div>

      {/* Refund Spikes list */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1"><AlertTriangle className="w-4 h-4 text-rose-500" /> Refund Spike Alerts</h3>
        <DataTable
          columns={refundSpikesColumns}
          rows={reports.refundSpikes}
          loading={loadingCharts}
          emptyMessage="No refund spike warnings detected for this branch."
        />
      </div>

      {/* History table */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1"><RefreshCw className="w-4 h-4 text-brand-blue" /> Past Weekly Report Archives</h3>
        <DataTable
          columns={historyColumns}
          rows={reports.history}
          loading={reports.status === 'loading'}
          emptyMessage="No weekly report archives generated yet."
        />
      </div>

    </div>
  );
};

export default Reports;
