import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedBranchId } from '../redux/slices/branchContextSlice';
import { Building2 } from 'lucide-react';

export const BranchSwitcher = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const { availableBranches, selectedBranchId } = useSelector((state) => state.branchContext);

  // Switcher is only visible if the user is a manager and manages more than one branch
  if (!user || user.role !== 'MANAGER' || user.managedBranchIds?.length <= 1) {
    return null;
  }

  const handleChange = (e) => {
    const val = e.target.value;
    dispatch(setSelectedBranchId(val === 'ALL' ? 'ALL' : Number(val)));
  };

  return (
    <div className="flex items-center space-x-2">
      <Building2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
      <select
        value={selectedBranchId}
        onChange={handleChange}
        className="text-xs sm:text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-green"
      >
        <option value="ALL">All Managed Branches</option>
        {availableBranches.map((branch) => (
          <option key={branch.id} value={branch.id}>
            {branch.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default BranchSwitcher;
