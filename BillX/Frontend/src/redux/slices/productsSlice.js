import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async ({ page = 0, size = 10, search = '', categoryId = '', branchId = '' } = {}, { rejectWithValue }) => {
    try {
      const params = { page, size };
      if (search) params.search = search;
      if (categoryId) params.categoryId = categoryId;
      if (branchId) params.branchId = branchId;
      
      const response = await api.get('/api/products', { params });
      return response.data.data; // Page object containing content, totalElements, etc.
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch products');
    }
  }
);

export const createProduct = createAsyncThunk('products/createProduct', async (productData, { rejectWithValue }) => {
  try {
    const response = await api.post('/api/products', productData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create product');
  }
});

export const updateProduct = createAsyncThunk('products/updateProduct', async ({ id, productData }, { rejectWithValue }) => {
  try {
    const response = await api.put(`/api/products/${id}`, productData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update product');
  }
});

export const deleteProduct = createAsyncThunk('products/deleteProduct', async (id, { rejectWithValue }) => {
  try {
    const response = await api.delete(`/api/products/${id}`);
    return { id, message: response.data.message };
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete product');
  }
});

const productsSlice = createSlice({
  name: 'products',
  initialState: {
    list: [],
    pagination: {
      totalElements: 0,
      totalPages: 0,
      pageNumber: 0,
      pageSize: 10,
    },
    filters: {
      search: '',
      categoryId: '',
      branchId: '',
    },
    status: 'idle',
    error: null,
  },
  reducers: {
    setProductFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetProductFilters(state) {
      state.filters = { search: '', categoryId: '', branchId: '' };
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload.content || [];
        state.pagination = {
          totalElements: action.payload.totalElements || 0,
          totalPages: action.payload.totalPages || 0,
          pageNumber: action.payload.number || 0,
          pageSize: action.payload.size || 10,
        };
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        const index = state.list.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.list = state.list.filter((p) => p.id !== action.payload.id);
      });
  },
});

export const { setProductFilters, resetProductFilters } = productsSlice.actions;
export default productsSlice.reducer;
