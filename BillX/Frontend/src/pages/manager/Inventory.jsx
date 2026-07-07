import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '../../redux/slices/productsSlice';
import { updateInventory } from '../../redux/slices/inventorySlice';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { DataTable } from '../../components/DataTable';
import { FormField } from '../../components/FormField';
import { ClipboardList, PlusCircle, X, Search, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

export const Inventory = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const products = useSelector((state) => state.products);
  const { availableBranches, selectedBranchId } = useSelector((state) => state.branchContext);

  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    loadInventory(0);
  }, [dispatch, selectedBranchId, searchQuery]);

  const loadInventory = (page) => {
    const activeBranchId = selectedBranchId === 'ALL'
      ? (user?.managedBranchIds?.[0] || availableBranches[0]?.id)
      : selectedBranchId;

    if (activeBranchId) {
      dispatch(fetchProducts({
        branchId: activeBranchId,
        search: searchQuery,
        page,
        size: 10
      }));
    }
  };

  const handleUpdateStockClick = (prod) => {
    setSelectedProduct(prod);
    setSuccessMessage(null);
    setErrorMessage(null);
    setShowModal(true);
  };

  const formik = useFormik({
    initialValues: {
      changeType: 'RESTOCK', // 'RESTOCK' | 'ADJUSTMENT'
      quantityChanged: '',
    },
    validationSchema: Yup.object({
      changeType: Yup.string().required('Change type is required'),
      quantityChanged: Yup.number()
        .integer('Must be a whole number')
        .min(1, 'Value must be at least 1')
        .required('Quantity is required'),
    }),
    onSubmit: async (values, { resetForm }) => {
      setSuccessMessage(null);
      setErrorMessage(null);

      const activeBranchId = selectedBranchId === 'ALL'
        ? (user?.managedBranchIds?.[0] || availableBranches[0]?.id)
        : selectedBranchId;

      const result = await dispatch(updateInventory({
        id: selectedProduct.id,
        changeType: values.changeType,
        quantityChanged: Number(values.quantityChanged),
        branchId: activeBranchId
      }));

      if (updateInventory.fulfilled.match(result)) {
        setSuccessMessage(`Successfully updated inventory for ${selectedProduct.name}!`);
        setShowModal(false);
        resetForm();
        setSelectedProduct(null);
        loadInventory(products.pagination.pageNumber);
      } else {
        setErrorMessage(result.payload || 'Failed to update stock');
      }
    }
  });

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Product Name' },
    { key: 'sku', label: 'SKU / Barcode' },
    { key: 'stockQuantity', label: 'Current Stock', render: (row) => <span className="font-extrabold">{row.stockQuantity}</span> },
    { key: 'lowStockThreshold', label: 'Safety Threshold' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const isLow = row.stockQuantity <= row.lowStockThreshold;
        return (
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${
            isLow
              ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400'
              : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
          }`}>
            {isLow ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
            {isLow ? 'LOW STOCK' : 'OK'}
          </span>
        );
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <button
          onClick={() => handleUpdateStockClick(row)}
          className="text-xs text-brand-green font-bold hover:underline flex items-center gap-1"
          type="button"
        >
          <PlusCircle className="w-3.5 h-3.5" /> Adjust Stock
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Control row */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search catalog items..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-955 text-gray-955 outline-none focus:border-brand-green"
          />
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30 rounded-2xl text-emerald-600 dark:text-emerald-400 flex items-start space-x-2 text-sm">
          <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Grid */}
      <DataTable
        columns={columns}
        rows={products.list}
        pagination={products.pagination}
        onPageChange={(page) => loadInventory(page)}
        loading={products.status === 'loading'}
        emptyMessage="No catalog elements listed for inventory reviews."
      />

      {/* Adjust Stock Modal */}
      {showModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-sm transform rounded-2xl bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-500" type="button"><X className="w-5 h-5" /></button>
            
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Adjust Inventory Stock</h3>
            <p className="text-xs text-gray-400 mb-6">Product: <span className="font-bold">{selectedProduct.name}</span> (Current: {selectedProduct.stockQuantity})</p>

            {errorMessage && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 rounded-xl text-xs text-rose-600 mb-4 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={formik.handleSubmit} className="space-y-4">
              <FormField
                label="Adjustment Action"
                name="changeType"
                type="select"
                options={[
                  { label: 'RESTOCK (Add stock to shelf)', value: 'RESTOCK' },
                  { label: 'ADJUSTMENT (Audit/Shrinkage correction)', value: 'ADJUSTMENT' },
                ]}
                formik={formik}
              />

              <FormField
                label="Quantity Changed"
                name="quantityChanged"
                type="number"
                placeholder="e.g. 50"
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
                  'Commit Changes'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Inventory;
