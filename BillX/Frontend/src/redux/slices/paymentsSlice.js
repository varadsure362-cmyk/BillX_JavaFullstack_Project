import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const generateQr = createAsyncThunk('payments/generateQr', async ({ orderId }, { rejectWithValue }) => {
  try {
    const response = await api.post('/api/payments/qr', { orderId });
    return response.data.data; // QrPaymentResponse (includes qrImageUrl, qrId, etc.)
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to generate QR Code');
  }
});

export const processCashPayment = createAsyncThunk('payments/processCashPayment', async ({ orderId, amountReceived }, { rejectWithValue }) => {
  try {
    const response = await api.post('/api/payments/cash', { orderId, amountReceived });
    return response.data.data; // PaymentResponse
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to process cash payment');
  }
});

export const getPaymentStatus = createAsyncThunk('payments/getPaymentStatus', async (qrId, { rejectWithValue }) => {
  try {
    const response = await api.get(`/api/payments/status/${qrId}`);
    return response.data.data; // PaymentResponse (with paymentStatus)
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to check payment status');
  }
});

const paymentsSlice = createSlice({
  name: 'payments',
  initialState: {
    activeQr: null, // { qrImageUrl, qrId, razorpayOrderId }
    pollStatus: 'idle', // 'idle' | 'polling' | 'success' | 'failed'
    status: 'idle',
    error: null,
  },
  reducers: {
    clearActiveQr(state) {
      state.activeQr = null;
      state.pollStatus = 'idle';
      state.error = null;
    },
    setPollStatus(state, action) {
      state.pollStatus = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateQr.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(generateQr.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.activeQr = action.payload; // has qrImageUrl, qrId
        state.pollStatus = 'polling';
      })
      .addCase(generateQr.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
        state.pollStatus = 'idle';
      })
      .addCase(processCashPayment.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(processCashPayment.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(processCashPayment.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const { clearActiveQr, setPollStatus } = paymentsSlice.actions;
export default paymentsSlice.reducer;
