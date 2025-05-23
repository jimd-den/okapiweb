// src/hooks/use-editable-item.ts
"use client";

import { useState, useCallback, useEffect } from 'react';

interface UseEditableItemProps<T extends { id: string }> {
  initialData: T;
  onSave: (updatedData: T) => Promise<void>;
  editableFields: Array<keyof T>;
}

export function useEditableItem<T extends { id: string }>({
  initialData,
  onSave,
  editableFields,
}: UseEditableItemProps<T>) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<T>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    if (!isEditing) {
      setEditedData(initialData);
    }
  }, [initialData, isEditing]);

  const startEdit = useCallback(() => {
    setEditedData(initialData); 
    setIsEditing(true);
  }, [initialData]);

  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditedData(initialData);
  }, [initialData]);

  const handleFieldChange = useCallback((fieldName: keyof T, value: any) => {
    if (editableFields.includes(fieldName)) {
      setEditedData(prev => ({ ...prev, [fieldName]: value }));
    } else {
      console.warn(`Field "${String(fieldName)}" is not specified as editable.`);
    }
  }, [editableFields]);

  const handleSave = useCallback(async (): Promise<void> => {
    for (const fieldName of editableFields) {
        const value = editedData[fieldName];
        if (typeof value === 'string' && !value.trim() && initialData[fieldName] !== undefined) { 
             throw new Error(`Field "${String(fieldName)}" cannot be empty.`);
        }
    }

    setIsSubmitting(true);
    try {
      await onSave(editedData);
      setIsEditing(false);
    } catch (error: any) {
      throw error; // Re-throw for the component to handle
    } finally {
      setIsSubmitting(false);
    }
  }, [editedData, onSave, editableFields, initialData]);

  return {
    isEditing,
    editedData,
    isSubmitting,
    startEdit,
    cancelEdit,
    handleFieldChange,
    handleSave,
  };
}
