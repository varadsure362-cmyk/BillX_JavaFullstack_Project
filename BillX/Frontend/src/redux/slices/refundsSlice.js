import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const processRefund = createAsyncThunk('refunds/processRefund', async (refundData, { rejectWithValue }) => {
  try {
    const response = await api.post('/api/refunds', refundData);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to process refund');
  }
});

export const fetchRefundsByOrderId = createAsyncThunk('refunds/fetchRefundsByOrderId', async (orderId, { rejectWithValue }) => {
  try {
    const response = await api.get(`/api/refunds/order/${orderId}`);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch refunds for this order');
  }
});

const refundsSlice = createSlice({
  name: 'refunds',
  initialState: {
    list: [],
    status: 'idle',
    error: null,
  },
  reducers: {
    clearRefunds(state) {
      state.list = [];
      state.status = 'idle';
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(processRefund.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(processRefund.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list.unshift(action.payload);
      })
      .addCase(processRefund.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchRefundsByOrderId.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchRefundsByOrderId.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload || [];
      })
      .addCase(fetchRefundsByOrderId.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const { clearRefunds } = refundsSlice.actions;
export default refundsSlice.reducer;
