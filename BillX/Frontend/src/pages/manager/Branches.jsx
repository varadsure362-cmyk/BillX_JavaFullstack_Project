import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBranches, createBranch, updateBranch, deleteBranch } from '../../redux/slices/branchesSlice';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { DataTable } from '../../components/DataTable';
import { FormField } from '../../components/FormField';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Plus, X, Building, Pencil, Trash2, Calendar, Loader2, CreditCard, Copy, Check, AlertCircle } from 'lucide-react';
import api from '../../utils/api';

export const Branches = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const { list, status } = useSelector((state) => state.branches);

  // Modal / dialog states
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [deletingBranchId, setDeletingBranchId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Razorpay Connect States
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [razorpayBranch, setRazorpayBranch] = useState(null);
  const [razorpayStatus, setRazorpayStatus] = useState(null); // { connected: boolean }
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [keyId, setKeyId] = useState('');
  const [keySecret, setKeySecret] = useState('');
  const [webhookInfo, setWebhookInfo] = useState(null); // { webhookSecret: string }
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleConnectRazorpayClick = async (branch) => {
    setRazorpayBranch(branch);
    setKeyId('');
    setKeySecret('');
    setWebhookInfo(null);
    setConnectError(null);
    setLoadingStatus(true);
    setShowRazorpayModal(true);

    try {
      const res = await api.get(`/api/branches/${branch.id}/razorpay/status`);
      setRazorpayStatus(res.data.data);
    } catch (err) {
      console.error("Failed to load Razorpay status", err);
      setConnectError(err.response?.data?.message || "Failed to load connection status");
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleRazorpayConnectSubmit = async (e) => {
    e.preventDefault();
    if (!keyId || !keySecret) return;
    setConnecting(true);
    setConnectError(null);
    setWebhookInfo(null);

    try {
      const res = await api.put(`/api/branches/${razorpayBranch.id}/razorpay`, {
        keyId,
        keySecret
      });
      setWebhookInfo(res.data.data);
      setRazorpayStatus({ connected: true });
    } catch (err) {
      console.error("Failed to connect Razorpay", err);
      setConnectError(err.response?.data?.message || "Failed to connect Razorpay account. Check credentials.");
    } finally {
      setConnecting(false);
    }
  };

  useEffect(() => {
    dispatch(fetchBranches());
  }, [dispatch]);

  // List of branches manager is allowed to see (pre-filtered by backend)
  const managedBranches = list;

  const handleEditClick = (branch) => {
    const daysArray = typeof branch.workingDays === 'string'
      ? branch.workingDays.split(',').map(d => d.trim()).filter(Boolean)
      : Array.isArray(branch.workingDays) ? branch.workingDays : [];
    setEditingBranch({
      ...branch,
      workingDays: daysArray
    });
    setShowModal(true);
  };

  const handleDeleteClick = (id) => {
    setDeletingBranchId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deletingBranchId) return;
    setIsDeleting(true);
    const result = await dispatch(deleteBranch(deletingBranchId));
    
    // Clear state before alert to close dialog immediately
    setDeletingBranchId(null);
    setIsDeleting(false);

    if (deleteBranch.fulfilled.match(result)) {
      dispatch(fetchBranches());
    } else {
      alert(result.payload || 'Cannot delete this branch as it is currently linked to other records (like employees or products).');
    }
  };

  const formik = useFormik({
    initialValues: {
      name: editingBranch ? editingBranch.name : '',
      address: editingBranch ? editingBranch.address : '',
      workingDays: editingBranch ? editingBranch.workingDays : [],
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      name: Yup.string().max(100, 'Name too long').required('Branch name is required'),
      address: Yup.string().max(250, 'Address too long').required('Address is required'),
      workingDays: Yup.array().min(1, 'Select at least one working day').required('Working days required'),
    }),
    onSubmit: async (values, { resetForm }) => {
      const payload = {
        ...values,
        workingDays: Array.isArray(values.workingDays)
          ? values.workingDays.join(',')
          : values.workingDays || ''
      };

      let result;
      if (editingBranch) {
        result = await dispatch(updateBranch({ id: editingBranch.id, branchData: payload }));
      } else {
        result = await dispatch(createBranch(payload));
      }

      if (createBranch.fulfilled.match(result) || updateBranch.fulfilled.match(result)) {
        setShowModal(false);
        setEditingBranch(null);
        resetForm();
        dispatch(fetchBranches()); // Refresh
      }
    }
  });

  const weekdays = [
    { label: 'Monday', value: 'MONDAY' },
    { label: 'Tuesday', value: 'TUESDAY' },
    { label: 'Wednesday', value: 'WEDNESDAY' },
    { label: 'Thursday', value: 'THURSDAY' },
    { label: 'Friday', value: 'FRIDAY' },
    { label: 'Saturday', value: 'SATURDAY' },
    { label: 'Sunday', value: 'SUNDAY' },
  ];

  const handleCheckboxChange = (dayValue) => {
    const current = formik.values.workingDays || [];
    const updated = current.includes(dayValue)
      ? current.filter(d => d !== dayValue)
      : [...current, dayValue];
    formik.setFieldValue('workingDays', updated);
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Branch Name' },
    { key: 'address', label: 'Address' },
    { 
      key: 'workingDays', 
      label: 'Working Days', 
      render: (row) => (
        <span className="text-xs text-gray-500 max-w-xs block truncate">
          {typeof row.workingDays === 'string'
            ? row.workingDays
            : Array.isArray(row.workingDays)
              ? row.workingDays.join(', ')
              : 'None'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleConnectRazorpayClick(row)}
            className="text-gray-500 hover:text-brand-green"
            title="Connect Razorpay"
            type="button"
          >
            <CreditCard className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleEditClick(row)}
            className="text-gray-500 hover:text-brand-green"
            type="button"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteClick(row.id)}
            className="text-gray-500 hover:text-rose-500"
            type="button"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Header control block */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-1.5"><Building className="w-5 h-5 text-brand-green" /> Branch Outlets</h2>
        <button
          onClick={() => { setEditingBranch(null); setShowModal(true); }}
          className="px-5 py-2.5 bg-brand-green hover:bg-brand-green-700 text-white font-bold rounded-xl text-sm flex items-center gap-1.5 shadow-sm"
          type="button"
        >
          <Plus className="w-4.5 h-4.5" /> Add Branch
        </button>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        rows={managedBranches}
        loading={status === 'loading'}
        emptyMessage="No branch outlets registered under your management profile."
      />

      {/* Create / Edit Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-md transform rounded-2xl bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-500" type="button"><X className="w-5 h-5" /></button>
            
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5">
              {editingBranch ? 'Update Branch Outlet' : 'Add New Branch'}
            </h3>

            <form onSubmit={formik.handleSubmit} className="space-y-4">
              <FormField
                label="Branch Name"
                name="name"
                placeholder="e.g. Downtown POS"
                formik={formik}
              />
              
              <FormField
                label="Address"
                name="address"
                type="textarea"
                placeholder="Full address of the branch"
                formik={formik}
              />

              {/* Weekday multi-selector */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-gray-450" /> Working Days
                </label>
                <div className="grid grid-cols-2 gap-2 p-3 border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-950/20 max-h-36 overflow-y-auto">
                  {weekdays.map((day) => {
                    const isChecked = formik.values.workingDays?.includes(day.value);
                    return (
                      <div key={day.value} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`day-${day.value}`}
                          checked={isChecked}
                          onChange={() => handleCheckboxChange(day.value)}
                          className="w-4 h-4 text-brand-green rounded border-gray-300"
                        />
                        <label htmlFor={`day-${day.value}`} className="text-xs text-gray-700 dark:text-gray-300 font-semibold cursor-pointer">
                          {day.label}
                        </label>
                      </div>
                    );
                  })}
                </div>
                {formik.touched.workingDays && formik.errors.workingDays && (
                  <span className="text-xs text-rose-500 font-medium">{formik.errors.workingDays}</span>
                )}
              </div>

              <button
                type="submit"
                disabled={formik.isSubmitting}
                className="w-full py-2.5 bg-brand-green hover:bg-brand-green-700 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-1.5"
              >
                {formik.isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  editingBranch ? 'Save Changes' : 'Register Branch'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={deletingBranchId !== null}
        title="Delete Branch Outlet?"
        message="Are you sure you want to delete this branch? All associated employee registers and terminals will lose access."
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete Outlet'}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingBranchId(null)}
        isDestructive
      />

      {/* Razorpay Connection Modal */}
      {showRazorpayModal && razorpayBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowRazorpayModal(false)} />
          <div className="relative w-full max-w-lg transform rounded-2xl bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setShowRazorpayModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-500" type="button"><X className="w-5 h-5" /></button>
            
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-brand-green" />
              <span>Razorpay Integration</span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
              Connect a custom Razorpay payment gateway for <span className="font-bold text-gray-700 dark:text-gray-303">{razorpayBranch.name}</span>.
            </p>

            {loadingStatus ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-2">
                <Loader2 className="w-8 h-8 text-brand-green animate-spin" />
                <span className="text-xs text-gray-500">Checking connection status...</span>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Status indicator */}
                <div className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-gray-950/20 border border-gray-100 dark:border-gray-800 rounded-xl">
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Connection Status</span>
                  {razorpayStatus?.connected ? (
                    <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-lg border border-emerald-250 dark:border-emerald-900">
                      Connected
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 text-xs font-bold rounded-lg border border-gray-200 dark:border-gray-705">
                      Not Connected
                    </span>
                  )}
                </div>

                {connectError && (
                  <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/30 rounded-xl text-rose-600 dark:text-rose-450 flex items-start space-x-2 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{connectError}</span>
                  </div>
                )}

                {/* Webhook Configuration Section on Success */}
                {webhookInfo && (
                  <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-200 dark:border-emerald-900/50 rounded-xl space-y-3.5 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center space-x-1.5 text-emerald-700 dark:text-emerald-455">
                      <Check className="w-4.5 h-4.5 font-bold" />
                      <span className="text-xs font-bold">Integration connected successfully!</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                      To complete setup, register the webhook in your Razorpay Dashboard with events <code className="px-1.5 py-0.5 bg-gray-155 dark:bg-gray-800 text-zinc-650 dark:text-zinc-350 rounded font-semibold text-[10px]">payment.captured</code> and <code className="px-1.5 py-0.5 bg-gray-155 dark:bg-gray-800 text-zinc-650 dark:text-zinc-350 rounded font-semibold text-[10px]">payment.failed</code>.
                    </p>
                    
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-gray-450 font-semibold block mb-1">Webhook URL</span>
                        <div className="flex items-center gap-1.5 bg-white dark:bg-gray-950 p-2.5 rounded-lg border border-gray-150 dark:border-gray-855">
                          <code className="text-gray-700 dark:text-gray-300 select-all font-semibold break-all flex-1 text-[11px]">
                            {(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082') + '/api/payments/webhook'}
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText((import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082') + '/api/payments/webhook');
                              alert("Webhook URL copied to clipboard!");
                            }}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-855 rounded text-gray-400 hover:text-gray-600 shrink-0"
                            type="button"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-gray-450 font-semibold block mb-1">Webhook Secret</span>
                        <div className="flex items-center gap-1.5 bg-white dark:bg-gray-950 p-2.5 rounded-lg border border-gray-150 dark:border-gray-855">
                          <code className="text-gray-700 dark:text-gray-300 select-all font-semibold break-all flex-1 text-[11px] font-mono">
                            {webhookInfo.webhookSecret}
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(webhookInfo.webhookSecret);
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                            }}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-855 rounded text-gray-400 hover:text-gray-600 shrink-0"
                            type="button"
                          >
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Connection Form */}
                <form onSubmit={handleRazorpayConnectSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-350">Razorpay Key ID</label>
                    <input
                      value={keyId}
                      onChange={(e) => setKeyId(e.target.value)}
                      placeholder="rzp_live_xxxxxxxxxxxxx"
                      required
                      className="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-955 text-gray-900 dark:text-gray-100 outline-none focus:border-brand-green font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-355">Razorpay Key Secret</label>
                    <input
                      type="password"
                      value={keySecret}
                      onChange={(e) => setKeySecret(e.target.value)}
                      placeholder="••••••••••••••••••••"
                      required
                      className="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-955 text-gray-900 dark:text-gray-100 outline-none focus:border-brand-green"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={connecting || !keyId || !keySecret}
                    className="w-full py-2.5 bg-brand-green hover:bg-brand-green-700 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {connecting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      'Save & Connect Credentials'
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default Branches;
