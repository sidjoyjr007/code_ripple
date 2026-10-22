import { useState, useCallback } from 'react';

/**
 * A generalized custom hook for managing form state across the application.
 * 
 * @param {Object} initialState - The initial values for the form fields
 * @returns {Object} Form state and handlers
 */
export function useForm(initialState = {}) {
  const [values, setValues] = useState(initialState);

  // Handle standard HTML input change events (e.g. onChange={handleChange})
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }, []);

  // Set a specific field manually (useful for custom components like Select or MultiSelect)
  const setFieldValue = useCallback((field, value) => {
    setValues((prev) => ({
      ...prev,
      [field]: typeof value === 'function' ? value(prev[field]) : value
    }));
  }, []);

  // Completely overwrite the form state (e.g. when fetching existing data)
  const setFormValues = useCallback((newValues) => {
    setValues(newValues);
  }, []);

  // Reset the form back to its initial state
  const resetForm = useCallback(() => {
    setValues(initialState);
  }, [initialState]);

  return {
    values,
    handleChange,
    setFieldValue,
    setFormValues,
    resetForm
  };
}
