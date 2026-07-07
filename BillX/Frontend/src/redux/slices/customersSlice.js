import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchCustomers = createAsyncThunk('customers/fetchCustomers', async (search = '', { rejectWithValue }) => {
  try {
    const params = {};
    if (search) params.search = search;
    const response = await api.get('/api/customers', { params });
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch customers');
  }
});

export const createCustomer = createAsyncThunk('customers/createCustomer', async (customerData, { rejectWithValue }) => {
  try {
    const response = await api.post('/api/customers', customerData);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create customer');
  }
});

const customersSlice = createSlice({
  name: 'customers',
  initialState: {
    list: [],
    selectedCustomer: null,
    status: 'idle',
    error: null,
  },
  reducers: {
    setSelectedCustomer(state, action) {
      state.selectedCustomer = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload || [];
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      });
  },
});

export const { setSelectedCustomer } = customersSlice.actions;
export default customersSlice.reducer;
