import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchBranches = createAsyncThunk('branches/fetchBranches', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/api/branches');
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch branches');
  }
});

export const createBranch = createAsyncThunk('branches/createBranch', async (branchData, { rejectWithValue }) => {
  try {
    const response = await api.post('/api/branches', branchData);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create branch');
  }
});

export const updateBranch = createAsyncThunk('branches/updateBranch', async ({ id, branchData }, { rejectWithValue }) => {
  try {
    const response = await api.put(`/api/branches/${id}`, branchData);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update branch');
  }
});

export const deleteBranch = createAsyncThunk('branches/deleteBranch', async (id, { rejectWithValue }) => {
  try {
    const response = await api.delete(`/api/branches/${id}`);
    return { id, message: response.data.message };
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete branch');
  }
});

const branchesSlice = createSlice({
  name: 'branches',
  initialState: {
    list: [],
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBranches.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchBranches.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload || [];
      })
      .addCase(fetchBranches.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(createBranch.fulfilled, (state, action) => {
        state.list.push(action.payload);
      })
      .addCase(updateBranch.fulfilled, (state, action) => {
        const index = state.list.findIndex((b) => b.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
      })
      .addCase(deleteBranch.fulfilled, (state, action) => {
        state.list = state.list.filter((b) => b.id !== action.payload.id);
      });
  },
});

export default branchesSlice.reducer;
