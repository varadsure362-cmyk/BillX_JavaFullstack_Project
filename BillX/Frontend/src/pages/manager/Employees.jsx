import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEmployees, createEmployee, updateEmployee, deleteEmployee } from '../../redux/slices/employeesSlice';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { DataTable } from '../../components/DataTable';
import { FormField } from '../../components/FormField';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Plus, X, Pencil, Trash2, Users, Loader2 } from 'lucide-react';

export const Employees = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const { list, status } = useSelector((state) => state.employees);
  const { availableBranches, selectedBranchId } = useSelector((state) => state.branchContext);

  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [deletingEmployeeId, setDeletingEmployeeId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [serverError, setServerError] = useState(null);

  useEffect(() => {
    loadEmployees();
  }, [dispatch, selectedBranchId]);

  const loadEmployees = () => {
    dispatch(fetchEmployees(selectedBranchId));
  };

  const handleEditClick = (emp) => {
    setServerError(null);
    setEditingEmployee(emp);
    setShowModal(true);
  };

  const handleDeleteClick = (id) => {
    setDeletingEmployeeId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deletingEmployeeId) return;
    setIsDeleting(true);
    const result = await dispatch(deleteEmployee(deletingEmployeeId));
    
    // Clear state before alert to close dialog immediately
    setDeletingEmployeeId(null);
    setIsDeleting(false);

    if (deleteEmployee.fulfilled.match(result)) {
      loadEmployees();
    } else {
      alert(result.payload || 'Cannot delete this employee as they are currently linked to other records (like orders).');
    }
  };

  const formik = useFormik({
    initialValues: {
      fullName: editingEmployee ? editingEmployee.fullName : '',
      email: editingEmployee ? editingEmployee.email : '',
      password: '',
      phone: editingEmployee ? editingEmployee.phone || '' : '',
      role: 'CASHIER', // Managers can only register Cashiers in this system
      branchId: editingEmployee ? editingEmployee.branchId || '' : '',
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      fullName: Yup.string().max(150, 'Name is too long').required('Full name is required'),
      email: Yup.string().email('Invalid email format').required('Email is required'),
      password: editingEmployee
        ? Yup.string().nullable()
        : Yup.string().min(8, 'Password must be at least 8 characters long').required('Password is required'),
      phone: Yup.string().max(20, 'Phone too long').nullable(),
      branchId: Yup.string().required('Branch assignment is required'),
    }),
    onSubmit: async (values, { resetForm }) => {
      let result;
      // Format payload
      const payload = {
        fullName: values.fullName,
        email: values.email,
        phone: values.phone || null,
        role: 'CASHIER',
        branchId: Number(values.branchId),
        // Send password only if creating or if provided
        ...(values.password ? { password: values.password } : {})
      };

      setServerError(null);

      if (editingEmployee) {
        result = await dispatch(updateEmployee({ id: editingEmployee.id, employeeData: payload }));
      } else {
        result = await dispatch(createEmployee(payload));
      }

      if (createEmployee.fulfilled.match(result) || updateEmployee.fulfilled.match(result)) {
        setShowModal(false);
        setEditingEmployee(null);
        resetForm();
        loadEmployees(); // Refresh list
      } else {
        setServerError(result.payload || 'Failed to register cashier');
      }
    }
  });

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'fullName', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone', render: (row) => row.phone || '-' },
    { key: 'branchName', label: 'Assigned Branch' },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center space-x-3">
          <button onClick={() => handleEditClick(row)} className="text-gray-500 hover:text-brand-green" type="button">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => handleDeleteClick(row.id)} className="text-gray-500 hover:text-rose-500" type="button">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-1.5"><Users className="w-5 h-5 text-brand-green" /> Cashier registers</h2>
        <button
          onClick={() => { setServerError(null); setEditingEmployee(null); setShowModal(true); }}
          className="px-5 py-2.5 bg-brand-green hover:bg-brand-green-700 text-white font-bold rounded-xl text-sm flex items-center gap-1.5 shadow-sm"
          type="button"
        >
          <Plus className="w-4.5 h-4.5" /> Add Cashier
        </button>
      </div>

      <DataTable
        columns={columns}
        rows={list}
        loading={status === 'loading'}
        emptyMessage="No cashiers registered under your branch context."
      />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-sm transform rounded-2xl bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-500" type="button"><X className="w-5 h-5" /></button>
            
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5">
              {editingEmployee ? 'Edit Cashier Registry' : 'Register Cashier'}
            </h3>

            {serverError && (
              <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/30 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-semibold">
                {serverError}
              </div>
            )}

            <form onSubmit={formik.handleSubmit} className="space-y-4">
              <FormField label="Full Name" name="fullName" placeholder="John Miller" formik={formik} />
              <FormField label="Email" name="email" type="email" placeholder="john.m@example.com" formik={formik} />
              
              {!editingEmployee && (
                <FormField label="Password" name="password" type="password" placeholder="At least 8 characters" formik={formik} />
              )}
              
              <FormField label="Phone" name="phone" placeholder="9876543210" formik={formik} />

              <FormField
                label="Branch"
                name="branchId"
                type="select"
                options={availableBranches.map(b => ({ label: b.name, value: b.id }))}
                formik={formik}
              />

              <button
                type="submit"
                disabled={formik.isSubmitting}
                className="w-full py-2.5 bg-brand-green hover:bg-brand-green-700 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-1.5"
              >
                {formik.isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  editingEmployee ? 'Save Changes' : 'Register Cashier'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deletingEmployeeId !== null}
        title="Remove Cashier?"
        message="Are you sure you want to deactivate and remove this cashier? They will lose access to the terminal."
        confirmLabel={isDeleting ? 'Removing...' : 'Remove Employee'}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingEmployeeId(null)}
        isDestructive
      />

    </div>
  );
};

export default Employees;
