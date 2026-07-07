import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async ({ page = 0, size = 10, branchId = '', cashierId = '', dateFrom = '', dateTo = '', status = '' } = {}, { rejectWithValue }) => {
    try {
      const params = { page, size };
      if (branchId) params.branchId = branchId;
      if (cashierId) params.cashierId = cashierId;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      if (status) params.status = status;
      
      const response = await api.get('/api/orders', { params });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders');
    }
  }
);

export const fetchOrderById = createAsyncThunk('orders/fetchOrderById', async (id, { rejectWithValue }) => {
  try {
    const response = await api.get(`/api/orders/${id}`);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch order details');
  }
});

export const createOrder = createAsyncThunk('orders/createOrder', async (orderData, { rejectWithValue }) => {
  try {
    const response = await api.post('/api/orders', orderData);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create order');
  }
});

const ordersSlice = createSlice({
  name: 'orders',
  initialState: {
    history: [],
    pagination: {
      totalElements: 0,
      totalPages: 0,
      pageNumber: 0,
      pageSize: 10,
    },
    currentOrder: null,
    status: 'idle',
    error: null,
  },
  reducers: {
    clearCurrentOrder(state) {
      state.currentOrder = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.history = action.payload.content || [];
        state.pagination = {
          totalElements: action.payload.totalElements || 0,
          totalPages: action.payload.totalPages || 0,
          pageNumber: action.payload.number || 0,
          pageSize: action.payload.size || 10,
        };
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchOrderById.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentOrder = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.currentOrder = action.payload;
      });
  },
});

export const { clearCurrentOrder } = ordersSlice.actions;
export default ordersSlice.reducer;
