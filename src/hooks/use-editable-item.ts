// src/hooks/use-editable-item.ts
"use client";

import { useState, useCallback, useEffect } from 'react';
import { useToast } from './use-toast';

interface UseEditableItemProps<T extends { id: string }> {
  initialData: T;
  onSave: (updatedData: T) => Promise<void>;
  // Add specific field names that are editable
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
  const { toast } = useToast();

  useEffect(() => {
    // If the initialData prop changes externally (e.g., parent re-fetches),
    // update our local copy, but only if not currently editing.
    if (!isEditing) {
      setEditedData(initialData);
    }
  }, [initialData, isEditing]);

  const startEdit = useCallback(() => {
    setEditedData(initialData); // Reset to fresh initialData on starting edit
    setIsEditing(true);
  }, [initialData]);

  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditedData(initialData); // Revert changes
  }, [initialData]);

  const handleFieldChange = useCallback((fieldName: keyof T, value: any) => {
    if (editableFields.includes(fieldName)) {
      setEditedData(prev => ({ ...prev, [fieldName]: value }));
    } else {
      console.warn(`Field "${String(fieldName)}" is not specified as editable.`);
    }
  }, [editableFields]);

  const handleSave = useCallback(async () => {
    // Basic validation: ensure required editable string fields are not empty
    // This could be made more sophisticated
    for (const fieldName of editableFields) {
        const value = editedData[fieldName];
        if (typeof value === 'string' && !value.trim() && initialData[fieldName] !== undefined) { // Assuming empty strings are not allowed if a field was initially defined
             toast({ title: "Validation Error", description: `Field "${String(fieldName)}" cannot be empty.`, variant: "destructive" });
             return;
        }
    }

    setIsSubmitting(true);
    try {
      await onSave(editedData);
      setIsEditing(false);
      // Toast for success should ideally be handled by the onSave callback or its caller
    } catch (error: any) {
      toast({ title: "Error Saving Item", description: error.message || "Could not save changes.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }, [editedData, onSave, editableFields, initialData, toast]);

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
