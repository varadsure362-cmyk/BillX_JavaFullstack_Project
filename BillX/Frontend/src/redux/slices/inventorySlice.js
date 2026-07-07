import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';
import { fetchProducts } from './productsSlice';

export const updateInventory = createAsyncThunk(
  'inventory/updateInventory',
  async ({ id, changeType, quantityChanged, branchId }, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.put(`/api/products/${id}/inventory`, {
        changeType,
        quantityChanged,
      });
      // Refetch products for the current branch to get updated stock values
      if (branchId) {
        dispatch(fetchProducts({ branchId, page: 0, size: 20 }));
      }
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update inventory');
    }
  }
);

const inventorySlice = createSlice({
  name: 'inventory',
  initialState: {
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(updateInventory.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(updateInventory.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(updateInventory.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export default inventorySlice.reducer;
