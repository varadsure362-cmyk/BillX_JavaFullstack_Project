import React from 'react';

export const FormField = ({
  label = '',
  name = '',
  type = 'text',
  placeholder = '',
  formik = null,
  options = [], // For select input
  rows = 3,     // For textarea input
  className = '',
  ...props
}) => {
  const isTouched = formik ? formik.touched[name] : false;
  const error = formik ? formik.errors[name] : '';
  const value = formik ? formik.values[name] : '';
  const handleChange = formik ? formik.handleChange : () => {};
  const handleBlur = formik ? formik.handleBlur : () => {};

  const hasError = isTouched && !!error;

  const inputClass = `w-full px-4 py-2.5 text-sm rounded-xl border bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-all duration-200 outline-none focus:ring-2 ${
    hasError
      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200/50 dark:focus:ring-rose-800/30'
      : 'border-gray-200 dark:border-gray-800 focus:border-brand-green focus:ring-brand-green-500/20'
  }`;

  return (
    <div className={`flex flex-col space-y-1.5 w-full ${className}`}>
      {label && (
        <label 
          htmlFor={name} 
          className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}

      {type === 'select' ? (
        <select
          id={name}
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          className={inputClass}
          {...props}
        >
          <option value="" disabled>Select {label.toLowerCase()}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          rows={rows}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={inputClass}
          {...props}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={inputClass}
          {...props}
        />
      )}

      {hasError && (
        <span className="text-xs text-rose-500 dark:text-rose-400 font-medium">
          {error}
        </span>
      )}
    </div>
  );
};

export default FormField;
