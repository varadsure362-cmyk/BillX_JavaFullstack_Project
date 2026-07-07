import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCustomers, createCustomer, setSelectedCustomer } from '../../redux/slices/customersSlice';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { DataTable } from '../../components/DataTable';
import { FormField } from '../../components/FormField';
import { Search, UserPlus, X, ShoppingBag, Phone, Mail, Award, Loader2 } from 'lucide-react';
import api from '../../utils/api';

export const Customers = () => {
  const dispatch = useDispatch();
  const { list, selectedCustomer, status } = useSelector((state) => state.customers);
  const [searchVal, setSearchVal] = useState('');
  const [showRegForm, setShowRegForm] = useState(false);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchCustomers(searchVal));
  }, [dispatch, searchVal]);

  const handleSearch = (e) => {
    setSearchVal(e.target.value);
  };

  const handleRowClick = async (cust) => {
    dispatch(setSelectedCustomer(cust));
    setOrdersLoading(true);
    setCustomerOrders([]);
    try {
      // Fetch orders for this customer (scoped to cashier branch)
      const response = await api.get('/api/orders', {
        params: { customerId: cust.id, size: 50 }
      });
      if (response.data.success) {
        setCustomerOrders(response.data.data.content || []);
      }
    } catch (err) {
      console.error('Failed to fetch customer orders', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      fullName: '',
      phone: '',
      email: '',
    },
    validationSchema: Yup.object({
      fullName: Yup.string()
        .max(150, 'Name cannot exceed 150 characters')
        .required('Name is required'),
      phone: Yup.string()
        .matches(/^\d{10}$/, 'Phone number must be exactly 10 digits (e.g. 9876543210)')
        .required('Phone is required'),
      email: Yup.string()
        .email('Invalid email address')
        .max(150, 'Email cannot exceed 150 characters')
        .nullable(),
    }),
    onSubmit: async (values, { resetForm }) => {
      const result = await dispatch(createCustomer(values));
      if (createCustomer.fulfilled.match(result)) {
        setShowRegForm(false);
        resetForm();
        dispatch(fetchCustomers(''));
      }
    }
  });

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'fullName', label: 'Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email', render: (row) => row.email || '-' },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <button
          onClick={(e) => { e.stopPropagation(); handleRowClick(row); }}
          className="text-xs text-brand-green font-bold hover:underline"
          type="button"
        >
          View Spend History
        </button>
      )
    }
  ];

  // Calculate total spend
  const totalSpend = customerOrders.reduce((sum, o) => sum + (o.status === 'PAID' ? o.totalAmount : 0), 0);

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0">
      
      {/* List section */}
      <div className="flex-1 flex flex-col min-h-0 space-y-4">
        
        {/* Top Control Bar */}
        <div className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
            <input
              value={searchVal}
              onChange={handleSearch}
              placeholder="Search by name or phone..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-200 outline-none focus:border-brand-green"
            />
          </div>

          <button
            onClick={() => setShowRegForm(!showRegForm)}
            className="w-full sm:w-auto px-5 py-2 text-sm font-semibold rounded-xl bg-brand-green hover:bg-brand-green-700 text-white flex items-center justify-center gap-1.5 shadow-sm"
            type="button"
          >
            <UserPlus className="w-4.5 h-4.5" /> Register Customer
          </button>
        </div>

        {/* Quick add form */}
        {showRegForm && (
          <div className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-850 pb-2">
              <h3 className="font-bold text-gray-955 dark:text-white">Quick Customer Registration</h3>
              <button onClick={() => setShowRegForm(false)} type="button"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={formik.handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <FormField label="Full Name" name="fullName" placeholder="Jane Doe" formik={formik} />
              <FormField label="Phone" name="phone" placeholder="9876543210" formik={formik} />
              <FormField label="Email (Optional)" name="email" type="email" placeholder="jane@example.com" formik={formik} />
              <button
                type="submit"
                disabled={formik.isSubmitting}
                className="w-full py-2.5 bg-brand-green hover:bg-brand-green-700 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-1.5"
              >
                {formik.isSubmitting ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : 'Register'}
              </button>
            </form>
          </div>
        )}

        {/* Data Table */}
        <div className="flex-1 min-h-0">
          <DataTable
            columns={columns}
            rows={list}
            loading={status === 'loading'}
            emptyMessage="No customers registered yet."
          />
        </div>
      </div>

      {/* Spend detail panel */}
      {selectedCustomer && (
        <div className="w-full lg:w-96 shrink-0 flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-5 animate-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3 mb-4">
            <h3 className="font-extrabold text-base flex items-center gap-1.5">
              <Award className="w-5 h-5 text-brand-green" /> Profile Summary
            </h3>
            <button onClick={() => dispatch(setSelectedCustomer(null))} type="button">
              <X className="w-5 h-5 text-gray-400 hover:text-gray-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-6 text-sm pr-1 min-h-0">
            {/* Customer Details */}
            <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-950/20 border border-gray-100 dark:border-gray-850 rounded-2xl">
              <p className="text-base font-bold text-gray-900 dark:text-white">{selectedCustomer.fullName}</p>
              <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  <span>{selectedCustomer.phone}</span>
                </div>
                {selectedCustomer.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <span className="truncate">{selectedCustomer.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Loyalty Metric */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-50/45 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-800/10 rounded-2xl text-center">
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Sales</p>
                <p className="text-lg font-black text-brand-green mt-1">₹{totalSpend.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-blue-50/45 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-800/10 rounded-2xl text-center">
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Orders Made</p>
                <p className="text-lg font-black text-brand-blue mt-1">{customerOrders.length}</p>
              </div>
            </div>

            {/* Customer order list */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Order History</p>
              
              {ordersLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-6 h-6 text-brand-green animate-spin" />
                </div>
              ) : customerOrders.length === 0 ? (
                <p className="text-xs text-gray-400 py-3 text-center">No transactions recorded for this customer.</p>
              ) : (
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {customerOrders.map((order) => (
                    <div key={order.id} className="p-3 border border-gray-100 dark:border-gray-850 rounded-xl flex items-center justify-between text-xs hover:bg-gray-50/40 dark:hover:bg-gray-950/20">
                      <div>
                        <p className="font-bold text-gray-800 dark:text-gray-250">Order #{order.id}</p>
                        <p className="text-gray-400 font-medium mt-0.5">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-extrabold text-brand-green">₹{order.totalAmount.toFixed(2)}</p>
                        <p className="text-[9px] uppercase font-bold text-gray-400 tracking-wider mt-0.5">{order.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Customers;
