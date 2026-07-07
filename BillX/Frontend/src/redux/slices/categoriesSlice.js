import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchCategories = createAsyncThunk('categories/fetchCategories', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/api/categories');
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch categories');
  }
});

export const createCategory = createAsyncThunk('categories/createCategory', async (categoryData, { rejectWithValue }) => {
  try {
    const response = await api.post('/api/categories', categoryData);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create category');
  }
});

export const updateCategory = createAsyncThunk('categories/updateCategory', async ({ id, categoryData }, { rejectWithValue }) => {
  try {
    const response = await api.put(`/api/categories/${id}`, categoryData);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update category');
  }
});

export const deleteCategory = createAsyncThunk('categories/deleteCategory', async (id, { rejectWithValue }) => {
  try {
    const response = await api.delete(`/api/categories/${id}`);
    return { id, message: response.data.message };
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete category');
  }
});

const categoriesSlice = createSlice({
  name: 'categories',
  initialState: {
    list: [],
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload || [];
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.list.push(action.payload);
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        const index = state.list.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.list = state.list.filter((c) => c.id !== action.payload.id);
      });
  },
});

export default categoriesSlice.reducer;
