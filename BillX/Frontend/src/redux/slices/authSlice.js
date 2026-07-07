import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const response = await api.post('/api/auth/login', credentials);
    const data = response.data;
    if (data.success && data.data) {
      localStorage.setItem('token', data.data.token);
      return data.data;
    }
    return rejectWithValue(data.message || 'Login failed');
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Login failed');
  }
});

export const signup = createAsyncThunk('auth/signup', async (userDetails, { rejectWithValue }) => {
  try {
    const response = await api.post('/api/auth/signup', userDetails);
    const data = response.data;
    if (data.success && data.data) {
      localStorage.setItem('token', data.data.token);
      return data.data;
    }
    return rejectWithValue(data.message || 'Signup failed');
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Signup failed');
  }
});

export const fetchCurrentUser = createAsyncThunk('auth/fetchCurrentUser', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/api/auth/me');
    const data = response.data;
    if (data.success) {
      return data.data; // User details
    }
    return rejectWithValue(data.message || 'Failed to fetch current user');
  } catch (error) {
    localStorage.removeItem('token');
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch current user');
  }
});

const initialState = {
  user: null,
  token: localStorage.getItem('token') || null,
  status: localStorage.getItem('token') ? 'loading' : 'idle',
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      localStorage.removeItem('token');
      state.user = null;
      state.token = null;
      state.status = 'idle';
      state.error = null;
    },
    setToken(state, action) {
      localStorage.setItem('token', action.payload);
      state.token = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'authenticated';
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.payload;
        state.token = null;
      })
      // Signup
      .addCase(signup.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.status = 'authenticated';
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(signup.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.payload;
        state.token = null;
      })
      // Current User
      .addCase(fetchCurrentUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.status = 'authenticated';
        state.user = action.payload;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.payload;
        state.token = null;
        state.user = null;
      });
  },
});

export const { logout, setToken } = authSlice.actions;
export default authSlice.reducer;
