import { createSlice } from '@reduxjs/toolkit';

const branchContextSlice = createSlice({
  name: 'branchContext',
  initialState: {
    availableBranches: [],
    selectedBranchId: 'ALL',
  },
  reducers: {
    setAvailableBranches(state, action) {
      state.availableBranches = action.payload;
    },
    setSelectedBranchId(state, action) {
      state.selectedBranchId = action.payload;
    },
    clearBranchContext(state) {
      state.availableBranches = [];
      state.selectedBranchId = 'ALL';
    }
  }
});

export const { setAvailableBranches, setSelectedBranchId, clearBranchContext } = branchContextSlice.actions;
export default branchContextSlice.reducer;
