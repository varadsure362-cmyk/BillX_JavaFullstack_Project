import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCategories, createCategory, updateCategory, deleteCategory } from '../../redux/slices/categoriesSlice';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { DataTable } from '../../components/DataTable';
import { FormField } from '../../components/FormField';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Plus, X, Pencil, Trash2, Tag, Loader2 } from 'lucide-react';

export const Categories = () => {
  const dispatch = useDispatch();
  const { list, status } = useSelector((state) => state.categories);

  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleEditClick = (category) => {
    setEditingCategory(category);
    setShowModal(true);
  };

  const handleDeleteClick = (id) => {
    setDeletingCategoryId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategoryId) return;
    setIsDeleting(true);
    const result = await dispatch(deleteCategory(deletingCategoryId));
    
    // Clear state before alert to close dialog immediately
    setDeletingCategoryId(null);
    setIsDeleting(false);

    if (deleteCategory.fulfilled.match(result)) {
      dispatch(fetchCategories());
    } else {
      alert(result.payload || 'Cannot delete this category as it is currently linked to other records (like products).');
    }
  };

  const formik = useFormik({
    initialValues: {
      name: editingCategory ? editingCategory.name : '',
      description: editingCategory ? editingCategory.description || '' : '',
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      name: Yup.string().max(50, 'Name too long').required('Category name is required'),
      description: Yup.string().max(250, 'Description too long').nullable(),
    }),
    onSubmit: async (values, { resetForm }) => {
      let result;
      if (editingCategory) {
        result = await dispatch(updateCategory({ id: editingCategory.id, categoryData: values }));
      } else {
        result = await dispatch(createCategory(values));
      }

      if (createCategory.fulfilled.match(result) || updateCategory.fulfilled.match(result)) {
        setShowModal(false);
        setEditingCategory(null);
        resetForm();
        dispatch(fetchCategories()); // Refresh
      }
    }
  });

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Category Name' },
    { key: 'description', label: 'Description', render: (row) => row.description || '-' },
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
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-1.5"><Tag className="w-5 h-5 text-brand-green" /> Product Categories</h2>
        <button
          onClick={() => { setEditingCategory(null); setShowModal(true); }}
          className="px-5 py-2.5 bg-brand-green hover:bg-brand-green-700 text-white font-bold rounded-xl text-sm flex items-center gap-1.5 shadow-sm"
          type="button"
        >
          <Plus className="w-4.5 h-4.5" /> Add Category
        </button>
      </div>

      <DataTable
        columns={columns}
        rows={list}
        loading={status === 'loading'}
        emptyMessage="No catalog categories registered."
      />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-sm transform rounded-2xl bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-500" type="button"><X className="w-5 h-5" /></button>
            
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5">
              {editingCategory ? 'Update Category Specs' : 'Add New Category'}
            </h3>

            <form onSubmit={formik.handleSubmit} className="space-y-4">
              <FormField label="Category Name" name="name" placeholder="e.g. Beverages" formik={formik} />
              <FormField label="Description" name="description" type="textarea" placeholder="Brief description of catalog scope" formik={formik} />

              <button
                type="submit"
                disabled={formik.isSubmitting}
                className="w-full py-2.5 bg-brand-green hover:bg-brand-green-700 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-1.5"
              >
                {formik.isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  editingCategory ? 'Save Changes' : 'Create Category'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deletingCategoryId !== null}
        title="Delete Category?"
        message="Are you sure you want to delete this category? Products currently assigned to it will be unclassified."
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete Category'}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingCategoryId(null)}
        isDestructive
      />

    </div>
  );
};

export default Categories;
