import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAlerts, markAlertAsRead } from '../../redux/slices/alertsSlice';
import { DataTable } from '../../components/DataTable';
import { Bell, Check, Eye } from 'lucide-react';

export const Alerts = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const { list, status } = useSelector((state) => state.alerts);
  const { availableBranches, selectedBranchId } = useSelector((state) => state.branchContext);

  useEffect(() => {
    loadAlerts();
  }, [dispatch, selectedBranchId]);

  const loadAlerts = () => {
    const activeBranchId = selectedBranchId === 'ALL'
      ? (user?.managedBranchIds?.[0] || availableBranches[0]?.id)
      : selectedBranchId;

    if (activeBranchId) {
      dispatch(fetchAlerts(activeBranchId));
    }
  };

  const handleMarkAsRead = async (id) => {
    const result = await dispatch(markAlertAsRead(id));
    if (markAlertAsRead.fulfilled.match(result)) {
      loadAlerts(); // Refresh list
    }
  };

  const columns = [
    { key: 'id', label: 'Alert ID' },
    { key: 'createdAt', label: 'Timestamp', render: (row) => new Date(row.createdAt).toLocaleString() },
    {
      key: 'alertType',
      label: 'Notification Type',
      render: (row) => (
        <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
          row.alertType === 'LOW_STOCK'
            ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400'
            : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400'
        }`}>
          {row.alertType}
        </span>
      )
    },
    { key: 'message', label: 'Message Details' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span className={`text-xs font-semibold ${row.isRead ? 'text-gray-400' : 'text-brand-green font-bold'}`}>
          {row.isRead ? 'READ' : 'UNREAD'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Action',
      render: (row) => (
        !row.isRead && (
          <button
            onClick={() => handleMarkAsRead(row.id)}
            className="text-xs text-brand-green font-bold hover:underline flex items-center gap-0.5"
            type="button"
          >
            <Check className="w-3.5 h-3.5" /> Acknowledge
          </button>
        )
      )
    }
  ];

  return (
    <div className="space-y-6">
      
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
          <Bell className="w-5 h-5 text-brand-green" /> Operations Alerts
        </h2>
      </div>

      <DataTable
        columns={columns}
        rows={list}
        loading={status === 'loading'}
        emptyMessage="No operations alerts currently active in this branch context."
      />

    </div>
  );
};

export default Alerts;
