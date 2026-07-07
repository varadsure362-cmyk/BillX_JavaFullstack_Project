import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchEmployees = createAsyncThunk('employees/fetchEmployees', async (branchId = '', { rejectWithValue }) => {
  try {
    const params = {};
    if (branchId && branchId !== 'ALL') params.branchId = branchId;
    const response = await api.get('/api/employees', { params });
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch employees');
  }
});

export const createEmployee = createAsyncThunk('employees/createEmployee', async (employeeData, { rejectWithValue }) => {
  try {
    const response = await api.post('/api/employees', employeeData);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create employee');
  }
});

export const updateEmployee = createAsyncThunk('employees/updateEmployee', async ({ id, employeeData }, { rejectWithValue }) => {
  try {
    const response = await api.put(`/api/employees/${id}`, employeeData);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update employee');
  }
});

export const deleteEmployee = createAsyncThunk('employees/deleteEmployee', async (id, { rejectWithValue }) => {
  try {
    const response = await api.delete(`/api/employees/${id}`);
    return { id, message: response.data.message };
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete employee');
  }
});

const employeesSlice = createSlice({
  name: 'employees',
  initialState: {
    list: [],
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployees.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.list = action.payload || [];
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(createEmployee.fulfilled, (state, action) => {
        state.list.push(action.payload);
      })
      .addCase(updateEmployee.fulfilled, (state, action) => {
        const index = state.list.findIndex((e) => e.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
      })
      .addCase(deleteEmployee.fulfilled, (state, action) => {
        state.list = state.list.filter((e) => e.id !== action.payload.id);
      });
  },
});

export default employeesSlice.reducer;
