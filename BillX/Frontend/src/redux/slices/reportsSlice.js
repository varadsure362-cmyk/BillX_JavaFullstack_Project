import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';
import axios from 'axios';

export const fetchOverviewStats = createAsyncThunk(
  'reports/fetchOverviewStats',
  async ({ branchId }, { rejectWithValue, signal }) => {
    try {
      const response = await api.get('/api/reports/overview', {
        params: { branchId },
        signal
      });
      return response.data.data;
    } catch (error) {
      if (axios.isCancel(error)) return rejectWithValue('Cancelled');
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch overview stats');
    }
  }
);

export const fetchPaymentBreakdown = createAsyncThunk(
  'reports/fetchPaymentBreakdown',
  async ({ branchId, range = '7days' }, { rejectWithValue, signal }) => {
    try {
      const response = await api.get('/api/reports/payment-breakdown', {
        params: { branchId, range },
        signal
      });
      return response.data.data;
    } catch (error) {
      if (axios.isCancel(error)) return rejectWithValue('Cancelled');
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch payment breakdown');
    }
  }
);

export const fetchSalesTrend = createAsyncThunk(
  'reports/fetchSalesTrend',
  async ({ branchId, range = '7days' }, { rejectWithValue, signal }) => {
    try {
      const response = await api.get('/api/reports/sales-trend', {
        params: { branchId, range },
        signal
      });
      return response.data.data;
    } catch (error) {
      if (axios.isCancel(error)) return rejectWithValue('Cancelled');
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch sales trend');
    }
  }
);

export const fetchTopProducts = createAsyncThunk(
  'reports/fetchTopProducts',
  async ({ branchId, limit = 5 }, { rejectWithValue, signal }) => {
    try {
      const response = await api.get('/api/reports/top-products', {
        params: { branchId, limit },
        signal
      });
      return response.data.data;
    } catch (error) {
      if (axios.isCancel(error)) return rejectWithValue('Cancelled');
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch top products');
    }
  }
);

export const fetchCashierPerformance = createAsyncThunk(
  'reports/fetchCashierPerformance',
  async ({ branchId }, { rejectWithValue, signal }) => {
    try {
      const response = await api.get('/api/reports/cashier-performance', {
        params: { branchId },
        signal
      });
      return response.data.data;
    } catch (error) {
      if (axios.isCancel(error)) return rejectWithValue('Cancelled');
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch cashier performance');
    }
  }
);

export const fetchSalesByCategory = createAsyncThunk(
  'reports/fetchSalesByCategory',
  async ({ branchId }, { rejectWithValue, signal }) => {
    try {
      const response = await api.get('/api/reports/sales-by-category', {
        params: { branchId },
        signal
      });
      return response.data.data;
    } catch (error) {
      if (axios.isCancel(error)) return rejectWithValue('Cancelled');
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch sales by category');
    }
  }
);

export const fetchRefundSpikes = createAsyncThunk(
  'reports/fetchRefundSpikes',
  async ({ branchId }, { rejectWithValue, signal }) => {
    try {
      const response = await api.get('/api/reports/refund-spikes', {
        params: { branchId },
        signal
      });
      return response.data.data;
    } catch (error) {
      if (axios.isCancel(error)) return rejectWithValue('Cancelled');
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch refund spikes');
    }
  }
);

export const generateWeeklyReport = createAsyncThunk(
  'reports/generateWeeklyReport',
  async ({ branchId, start = '', end = '' }, { rejectWithValue }) => {
    try {
      const params = { branchId };
      if (start) params.start = start;
      if (end) params.end = end;
      const response = await api.post('/api/reports/weekly/generate', null, { params });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to generate weekly report');
    }
  }
);

export const fetchWeeklyReportHistory = createAsyncThunk(
  'reports/fetchWeeklyReportHistory',
  async ({ branchId }, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/reports/weekly/history', {
        params: { branchId }
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch report history');
    }
  }
);

const reportsSlice = createSlice({
  name: 'reports',
  initialState: {
    overview: null,
    paymentBreakdown: [],
    salesTrend: [],
    topProducts: [],
    cashierPerformance: [],
    salesByCategory: [],
    refundSpikes: [],
    history: [],
    filters: {
      branchId: 'ALL',
      dateRange: '7days',
    },
    status: 'idle',
    error: null,
  },
  reducers: {
    setReportFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    }
  },
  extraReducers: (builder) => {
    builder
      // Overview stats
      .addCase(fetchOverviewStats.fulfilled, (state, action) => {
        state.overview = action.payload;
      })
      // Payment Breakdown
      .addCase(fetchPaymentBreakdown.fulfilled, (state, action) => {
        state.paymentBreakdown = action.payload || [];
      })
      // Sales Trend
      .addCase(fetchSalesTrend.fulfilled, (state, action) => {
        state.salesTrend = action.payload || [];
      })
      // Top Products
      .addCase(fetchTopProducts.fulfilled, (state, action) => {
        state.topProducts = action.payload || [];
      })
      // Cashier Performance
      .addCase(fetchCashierPerformance.fulfilled, (state, action) => {
        state.cashierPerformance = action.payload || [];
      })
      // Sales by category
      .addCase(fetchSalesByCategory.fulfilled, (state, action) => {
        state.salesByCategory = action.payload || [];
      })
      // Refund Spikes
      .addCase(fetchRefundSpikes.fulfilled, (state, action) => {
        state.refundSpikes = action.payload || [];
      })
      // Report history
      .addCase(fetchWeeklyReportHistory.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchWeeklyReportHistory.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.history = action.payload || [];
      })
      .addCase(fetchWeeklyReportHistory.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(generateWeeklyReport.fulfilled, (state, action) => {
        state.history.unshift(action.payload);
      });
  },
});

export const { setReportFilters } = reportsSlice.actions;
export default reportsSlice.reducer;
