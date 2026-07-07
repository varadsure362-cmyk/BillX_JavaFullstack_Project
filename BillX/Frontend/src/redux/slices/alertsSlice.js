import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchAlerts = createAsyncThunk('alerts/fetchAlerts', async ({ branchId, all = false }, { rejectWithValue }) => {
  try {
    const params = { all };
    if (branchId && branchId !== 'ALL') params.branchId = branchId;
    // Note: Backend requires a branchId, so if selectedBranchId is 'ALL' or empty, we will handle that by passing first managed branch ID in component or handle default.
    // If branchId is null/undefined/'ALL', we can check in components and pass it.
    const response = await api.get('/api/alerts', { params });
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch alerts');
  }
});

export const markAlertAsRead = createAsyncThunk('alerts/markAlertAsRead', async (id, { rejectWithValue }) => {
  try {
    const response = await api.patch(`/api/alerts/${id}/read`);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to mark alert as read');
  }
});

const alertsSlice = createSlice({
  name: 'alerts',
  initialState: {
    list: [],
    unreadCount: 0,
    status: 'idle',
    error: null,
  },
  reducers: {
    setAlerts(state, action) {
      state.list = action.payload;
      state.unreadCount = action.payload.filter(a => !a.isRead).length;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAlerts.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchAlerts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload || [];
        state.unreadCount = state.list.filter(a => !a.isRead).length;
      })
      .addCase(fetchAlerts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(markAlertAsRead.fulfilled, (state, action) => {
        const index = state.list.findIndex(a => a.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
        state.unreadCount = state.list.filter(a => !a.isRead).length;
      });
  },
});

export const { setAlerts } = alertsSlice.actions;
export default alertsSlice.reducer;
