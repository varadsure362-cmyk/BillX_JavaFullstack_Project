import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from '../../utils/api';
import { processRefund } from '../../redux/slices/refundsSlice';
import { FormField } from '../../components/FormField';
import { Search, Undo2, AlertCircle, CheckCircle2, ChevronRight, CornerDownRight, Loader2 } from 'lucide-react';

export const ReturnsRefunds = () => {
  const dispatch = useDispatch();
  const [searchId, setSearchId] = useState('');
  const [order, setOrder] = useState(null);
  const [searchError, setSearchError] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [refundAmount, setRefundAmount] = useState(0);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchId) return;
    setSearchLoading(true);
    setSearchError(null);
    setSuccessMessage(null);
    setOrder(null);
    setSelectedItemIds([]);
    setRefundAmount(0);

    try {
      const response = await api.get(`/api/orders/${searchId}`);
      if (response.data.success && response.data.data) {
        const orderData = response.data.data;
        if (orderData.status === 'REFUNDED') {
          setSearchError('This order has already been fully refunded.');
        } else {
          setOrder(orderData);
        }
      } else {
        setSearchError('Order not found.');
      }
    } catch (err) {
      setSearchError(err.response?.data?.message || 'Order not found.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleCheckboxChange = (itemId, lineTotal) => {
    const isChecked = selectedItemIds.includes(itemId);
    let updatedIds = [];
    let updatedAmt = 0;

    if (isChecked) {
      updatedIds = selectedItemIds.filter(id => id !== itemId);
      updatedAmt = refundAmount - lineTotal;
    } else {
      updatedIds = [...selectedItemIds, itemId];
      updatedAmt = refundAmount + lineTotal;
    }

    setSelectedItemIds(updatedIds);
    setRefundAmount(Math.max(0, updatedAmt));
    formik.setFieldValue('amount', Math.max(0, updatedAmt));
  };

  const formik = useFormik({
    initialValues: {
      reason: '',
      amount: 0,
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      reason: Yup.string()
        .min(5, 'Reason must be at least 5 characters long')
        .required('Refund reason is required'),
      amount: Yup.number()
        .positive('Refund amount must be positive')
        .max(order ? order.totalAmount : 999999, 'Amount cannot exceed the total order amount')
        .required('Refund amount is required'),
    }),
    onSubmit: async (values, { resetForm }) => {
      if (selectedItemIds.length === 0) {
        setSearchError('Please select at least one item to refund.');
        return;
      }
      setSearchError(null);
      setSuccessMessage(null);

      const payload = {
        orderId: order.id,
        reason: values.reason,
        amount: values.amount,
        itemIds: selectedItemIds
      };

      const result = await dispatch(processRefund(payload));
      if (processRefund.fulfilled.match(result)) {
        setSuccessMessage('Refund processed successfully and inventory restocked!');
        setOrder(null);
        setSearchId('');
        resetForm();
        setSelectedItemIds([]);
        setRefundAmount(0);
      } else {
        setSearchError(result.payload || 'Failed to process refund.');
      }
    }
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Search Header */}
      <div className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-1.5 text-gray-900 dark:text-white">
          <Undo2 className="w-5 h-5 text-brand-green" /> Returns & Refunds
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Enter an Order Reference ID below to search for transactions eligible for returns or partial refunds.
        </p>

        <form onSubmit={handleSearch} className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
            <input
              type="number"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Enter Order ID (e.g. 1)"
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 outline-none focus:border-brand-green"
              required
            />
          </div>
          <button
            type="submit"
            disabled={searchLoading}
            className="px-6 py-2.5 bg-brand-green hover:bg-brand-green-700 text-white font-bold rounded-xl text-sm transition-colors flex items-center gap-1.5"
          >
            {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
          </button>
        </form>
      </div>

      {searchError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-800/30 rounded-2xl text-rose-600 dark:text-rose-400 flex items-start space-x-2 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span className="font-semibold">{searchError}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30 rounded-2xl text-emerald-600 dark:text-emerald-400 flex items-start space-x-2 text-sm animate-bounce">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Refund processing options */}
      {order && (
        <div className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm space-y-6 animate-in slide-in-from-bottom-3 duration-250">
          
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-base">Order #{order.id}</h3>
              <p className="text-xs text-gray-400 mt-0.5">Purchased by: {order.customerName || 'Walk-in'}</p>
            </div>
            <span className="text-sm font-black text-brand-green">Total: ₹{order.totalAmount.toFixed(2)}</span>
          </div>

          <form onSubmit={formik.handleSubmit} className="space-y-6">
            
            {/* Select items to return */}
            <div className="space-y-3">
              <label className="text-xs sm:text-sm font-bold text-gray-500">Select Items to Refund</label>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id={`item-${item.id}`}
                        checked={selectedItemIds.includes(item.id)}
                        onChange={() => handleCheckboxChange(item.id, item.lineTotal)}
                        className="w-4.5 h-4.5 text-brand-green rounded border-gray-300 focus:ring-brand-green"
                      />
                      <label htmlFor={`item-${item.id}`} className="text-sm font-bold text-gray-800 dark:text-gray-200 cursor-pointer">
                        {item.productName}
                      </label>
                    </div>
                    <div className="text-right text-xs">
                      <p className="font-semibold text-gray-500">Qty: {item.quantity} @ ₹{item.unitPrice.toFixed(2)}</p>
                      <p className="font-bold text-gray-900 dark:text-white mt-0.5">₹{item.lineTotal.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Refund detail inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Refund Amount (₹)"
                name="amount"
                type="number"
                formik={formik}
                readOnly
                className="bg-gray-50 dark:bg-gray-950"
              />
              <FormField
                label="Refund Reason"
                name="reason"
                placeholder="Reason for return (min 5 characters)"
                formik={formik}
              />
            </div>

            <button
              type="submit"
              disabled={selectedItemIds.length === 0 || formik.isSubmitting}
              className="w-full py-3 bg-brand-green hover:bg-brand-green-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-brand-green/20"
            >
              {formik.isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Undo2 className="w-4.5 h-4.5" /> Submit Refund Request
                </>
              )}
            </button>
          </form>

        </div>
      )}

    </div>
  );
};

export default ReturnsRefunds;
