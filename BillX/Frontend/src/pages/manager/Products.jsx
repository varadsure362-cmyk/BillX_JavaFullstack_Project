import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, createProduct, updateProduct, deleteProduct } from '../../redux/slices/productsSlice';
import { fetchCategories } from '../../redux/slices/categoriesSlice';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { DataTable } from '../../components/DataTable';
import { FormField } from '../../components/FormField';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Plus, X, Pencil, Trash2, Package, Search, Image, Loader2 } from 'lucide-react';

export const Products = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const products = useSelector((state) => state.products);
  const categories = useSelector((state) => state.categories);
  const { availableBranches, selectedBranchId } = useSelector((state) => state.branchContext);

  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProductId, setDeletingProductId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [serverError, setServerError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryId, setCategoryId] = useState('');

  // Reload products whenever filters, pagination, or branch changes
  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    loadProducts(0);
  }, [dispatch, selectedBranchId, categoryId, searchQuery]);

  const loadProducts = (page) => {
    // If selectedBranchId is ALL, we fetch using the first managed branch ID
    // since the product API requires a specific branchId parameter.
    const activeBranchId = selectedBranchId === 'ALL'
      ? (user?.managedBranchIds?.[0] || availableBranches[0]?.id)
      : selectedBranchId;

    if (activeBranchId) {
      dispatch(fetchProducts({
        branchId: activeBranchId,
        categoryId,
        search: searchQuery,
        page,
        size: 10
      }));
    }
  };

  const handleEditClick = (product) => {
    setServerError(null);
    setEditingProduct(product);
    setImagePreview(product.imageUrl || null);
    setImageFile(null);
    setShowModal(true);
  };

  const handleDeleteClick = (id) => {
    setDeletingProductId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deletingProductId) return;
    setIsDeleting(true);
    const result = await dispatch(deleteProduct(deletingProductId));
    
    // Clear state before alert to close dialog immediately
    setDeletingProductId(null);
    setIsDeleting(false);

    if (deleteProduct.fulfilled.match(result)) {
      loadProducts(products.pagination.pageNumber);
    } else {
      alert(result.payload || 'Cannot delete this product as it is currently linked to other records (like orders).');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const formik = useFormik({
    initialValues: {
      name: editingProduct ? editingProduct.name : '',
      sku: editingProduct ? editingProduct.sku : '',
      price: editingProduct ? editingProduct.price : '',
      stockQuantity: editingProduct ? editingProduct.stockQuantity : '',
      lowStockThreshold: editingProduct ? editingProduct.lowStockThreshold : '',
      categoryId: editingProduct ? editingProduct.categoryId || '' : '',
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      name: Yup.string().max(100, 'Name too long').required('Product name is required'),
      sku: Yup.string().max(50, 'SKU too long').required('SKU is required'),
      price: Yup.number().positive('Price must be positive').required('Price is required'),
      stockQuantity: Yup.number().integer('Must be an integer').min(0, 'Cannot be negative').required('Stock quantity is required'),
      lowStockThreshold: Yup.number().integer('Must be an integer').min(0, 'Cannot be negative').required('Threshold is required'),
      categoryId: Yup.string().required('Category is required'),
    }),
    onSubmit: async (values, { resetForm }) => {
      // Must use FormData since we are supporting image file uploads
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('sku', values.sku);
      formData.append('price', values.price);
      formData.append('stockQuantity', values.stockQuantity);
      formData.append('lowStockThreshold', values.lowStockThreshold);
      formData.append('categoryId', values.categoryId);

      if (imageFile) {
        formData.append('image', imageFile);
      }

      setServerError(null);

      let result;
      if (editingProduct) {
        result = await dispatch(updateProduct({ id: editingProduct.id, productData: formData }));
      } else {
        const activeBranchId = selectedBranchId === 'ALL'
          ? (user?.managedBranchIds?.[0] || availableBranches[0]?.id)
          : selectedBranchId;
        
        formData.append('branchId', activeBranchId);
        result = await dispatch(createProduct(formData));
      }

      if (createProduct.fulfilled.match(result) || updateProduct.fulfilled.match(result)) {
        setShowModal(false);
        setEditingProduct(null);
        setImageFile(null);
        setImagePreview(null);
        resetForm();
        loadProducts(products.pagination.pageNumber);
      } else {
        setServerError(result.payload || 'Failed to save product');
      }
    }
  });

  const columns = [
    { key: 'id', label: 'ID' },
    {
      key: 'image',
      label: 'Image',
      render: (row) => (
        <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-150 dark:border-gray-800 bg-gray-50 flex items-center justify-center">
          {row.imageUrl ? (
            <img src={row.imageUrl} alt={row.name} className="w-full h-full object-cover" />
          ) : (
            <Package className="w-5 h-5 text-gray-300" />
          )}
        </div>
      )
    },
    { key: 'name', label: 'Product Name' },
    { key: 'sku', label: 'SKU' },
    { key: 'categoryName', label: 'Category' },
    { key: 'price', label: 'Price', render: (row) => `₹${row.price.toFixed(2)}` },
    { 
      key: 'stockQuantity', 
      label: 'Stock Level', 
      render: (row) => (
        <span className={`font-bold ${row.stockQuantity <= row.lowStockThreshold ? 'text-amber-500' : 'text-gray-500'}`}>
          {row.stockQuantity} {row.stockQuantity <= row.lowStockThreshold && '(Low)'}
        </span>
      )
    },
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
      
      {/* Search and control row */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full sm:w-56 pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 outline-none focus:border-brand-green"
            />
          </div>
          
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-700 dark:text-gray-200 rounded-xl focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.list.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => { setServerError(null); setEditingProduct(null); setImagePreview(null); setShowModal(true); }}
          className="w-full sm:w-auto px-5 py-2.5 bg-brand-green hover:bg-brand-green-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-1.5 shadow-sm"
          type="button"
        >
          <Plus className="w-4.5 h-4.5" /> Add Product
        </button>
      </div>

      {/* Main Grid */}
      <DataTable
        columns={columns}
        rows={products.list}
        pagination={products.pagination}
        onPageChange={(page) => loadProducts(page)}
        loading={products.status === 'loading'}
        emptyMessage="No products listed under this branch context."
      />

      {/* Product Edit/Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-md transform rounded-2xl bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-500" type="button"><X className="w-5 h-5" /></button>
            
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5">
              {editingProduct ? 'Modify Product Specifications' : 'Catalog New Product'}
            </h3>

            {serverError && (
              <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/30 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-semibold">
                {serverError}
              </div>
            )}

            <form onSubmit={formik.handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              
              <FormField label="Product Name" name="name" placeholder="e.g. Organic Apples" formik={formik} />
              <FormField label="SKU / Barcode" name="sku" placeholder="e.g. APP-ORG-01" formik={formik} />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Price (₹)" name="price" type="number" placeholder="45" formik={formik} />
                <FormField
                  label="Category"
                  name="categoryId"
                  type="select"
                  options={categories.list.map(c => ({ label: c.name, value: c.id }))}
                  formik={formik}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Opening Stock" name="stockQuantity" type="number" placeholder="100" formik={formik} />
                <FormField label="Low Stock Alarm" name="lowStockThreshold" type="number" placeholder="15" formik={formik} />
              </div>

              {/* Image Drag-n-Drop */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <Image className="w-4 h-4 text-gray-450" /> Product Image
                </label>
                <div className="flex items-center space-x-4 p-3 border border-dashed border-gray-200 dark:border-gray-850 rounded-xl">
                  {imagePreview ? (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        onClick={() => { setImagePreview(null); setImageFile(null); }}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center text-white"
                        type="button"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg border border-gray-250 bg-gray-50 flex items-center justify-center text-gray-300">
                      <Package className="w-6 h-6" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    id="product-image-file"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="product-image-file"
                    className="px-3.5 py-2 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Select File
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={formik.isSubmitting}
                className="w-full py-2.5 bg-brand-green hover:bg-brand-green-700 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-1.5"
              >
                {formik.isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  editingProduct ? 'Save Specifications' : 'Publish Product'
                )}
              </button>

            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={deletingProductId !== null}
        title="Delete Product?"
        message="Are you sure you want to permanently delete this product from the catalog?"
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete Product'}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingProductId(null)}
        isDestructive
      />

    </div>
  );
};

export default Products;
