import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrders } from '../../redux/slices/ordersSlice';
import { DataTable } from '../../components/DataTable';
import { Receipt, Calendar, Filter, X, FileText } from 'lucide-react';

export const Transactions = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const { history, pagination, status } = useSelector((state) => state.orders);
  const { availableBranches, selectedBranchId } = useSelector((state) => state.branchContext);

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [txnStatus, setTxnStatus] = useState('');
  const [selectedTxn, setSelectedTxn] = useState(null);

  useEffect(() => {
    loadTransactions(0);
  }, [dispatch, selectedBranchId, dateFrom, dateTo, txnStatus]);

  const loadTransactions = (page) => {
    const activeBranchId = selectedBranchId === 'ALL'
      ? (user?.managedBranchIds?.[0] || availableBranches[0]?.id)
      : selectedBranchId;
    
    dispatch(fetchOrders({
      page,
      size: 10,
      branchId: activeBranchId,
      dateFrom,
      dateTo,
      status: txnStatus
    }));
  };

  const columns = [
    { key: 'id', label: 'Txn ID' },
    { key: 'createdAt', label: 'Timestamp', render: (row) => new Date(row.createdAt).toLocaleString() },
    { key: 'branchName', label: 'Branch' },
    { key: 'cashierName', label: 'Operator' },
    { key: 'customerName', label: 'Customer', render: (row) => row.customerName || 'Walk-in' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
          row.status === 'PAID'
            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
            : row.status === 'PARTIALLY_REFUNDED'
            ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400'
            : row.status === 'REFUNDED'
            ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
        }`}>
          {row.status}
        </span>
      )
    },
    { key: 'totalAmount', label: 'Paid Amount', render: (row) => `₹${row.totalAmount.toFixed(2)}` },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <button
          onClick={() => setSelectedTxn(row)}
          className="text-xs text-brand-green font-bold hover:underline"
          type="button"
        >
          Audit Details
        </button>
      )
    }
  ];

  return (
    <div className="flex flex-col xl:flex-row gap-6 h-full min-h-0">
      
      {/* Table grid */}
      <div className="flex-1 flex flex-col min-h-0 space-y-4">
        {/* Filters */}
        <div className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-2.5 py-1.5 text-xs sm:text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 rounded-lg text-gray-700 dark:text-gray-200"
              />
              <span className="text-gray-400">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-2.5 py-1.5 text-xs sm:text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 rounded-lg text-gray-700 dark:text-gray-200"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={txnStatus}
                onChange={(e) => setTxnStatus(e.target.value)}
                className="px-2.5 py-1.5 text-xs sm:text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 rounded-lg text-gray-700 dark:text-gray-200 focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="PAID">PAID</option>
                <option value="PENDING">PENDING</option>
                <option value="PARTIALLY_REFUNDED">PARTIALLY_REFUNDED</option>
                <option value="REFUNDED">REFUNDED</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="flex-1 min-h-0">
          <DataTable
            columns={columns}
            rows={history}
            pagination={pagination}
            onPageChange={(page) => loadTransactions(page)}
            loading={status === 'loading'}
            emptyMessage="No transaction logs match the active parameters."
          />
        </div>
      </div>

      {/* Details Side Panel */}
      {selectedTxn && (
        <div className="w-full xl:w-96 shrink-0 flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-5 animate-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3 mb-4">
            <h3 className="font-extrabold text-base flex items-center gap-1.5">
              <Receipt className="w-5 h-5 text-brand-green" /> Transaction Audit
            </h3>
            <button onClick={() => setSelectedTxn(null)} type="button">
              <X className="w-5 h-5 text-gray-400 hover:text-gray-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-5 text-sm pr-1 min-h-0">
            <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 dark:bg-gray-950/20 border border-gray-100 dark:border-gray-850 p-3.5 rounded-xl">
              <div>
                <p className="text-gray-400 font-medium font-bold">Transaction ID</p>
                <p className="font-bold mt-0.5">#{selectedTxn.id}</p>
              </div>
              <div>
                <p className="text-gray-400 font-medium font-bold">Time</p>
                <p className="font-bold mt-0.5">{new Date(selectedTxn.createdAt).toLocaleTimeString()}</p>
              </div>
              <div>
                <p className="text-gray-400 font-medium font-bold">Cashier</p>
                <p className="font-bold mt-0.5">{selectedTxn.cashierName}</p>
              </div>
              <div>
                <p className="text-gray-400 font-medium font-bold">Branch</p>
                <p className="font-bold mt-0.5">{selectedTxn.branchName}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Purchased Items</p>
              <div className="space-y-2">
                {selectedTxn.items?.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-xs py-1 border-b border-dashed border-gray-100 dark:border-gray-850">
                    <div>
                      <p className="font-bold text-gray-800 dark:text-gray-200">{item.productName}</p>
                      <p className="text-gray-400 mt-0.5">₹{item.unitPrice.toFixed(2)} x {item.quantity}</p>
                    </div>
                    <span className="font-bold">₹{item.lineTotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 pt-4 space-y-2.5 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="text-gray-800 dark:text-gray-200">₹{selectedTxn.subtotal?.toFixed(2)}</span>
              </div>
              {selectedTxn.discountAmount > 0 && (
                <div className="flex justify-between text-rose-500">
                  <span>Discount:</span>
                  <span>-₹{selectedTxn.discountAmount?.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Tax amount:</span>
                <span className="text-gray-800 dark:text-gray-200">₹{selectedTxn.taxAmount?.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-150 dark:border-gray-800 pt-3 flex justify-between text-sm font-extrabold text-gray-800 dark:text-white">
                <span>Grand Total:</span>
                <span className="text-brand-green">₹{selectedTxn.totalAmount?.toFixed(2)}</span>
              </div>
            </div>

            {selectedTxn.orderNote && (
              <div className="p-3 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/40 dark:border-amber-800/20 rounded-xl text-xs">
                <p className="font-bold text-amber-800 dark:text-amber-400">Order Note</p>
                <p className="text-gray-600 dark:text-gray-300 mt-1">{selectedTxn.orderNote}</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default Transactions;
