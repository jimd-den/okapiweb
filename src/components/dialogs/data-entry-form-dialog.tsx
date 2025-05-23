
// src/components/dialogs/data-entry-form-dialog.tsx
"use client";

import { useState, useEffect, type FormEvent, useCallback } from 'react';
import type { ActionDefinition, FormFieldDefinition } from '@/domain/entities/action-definition.entity';
import type { LogDataEntryInputDTO } from '@/application/use-cases/data-entry/log-data-entry.usecase';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, FileInput, AlertTriangle } from 'lucide-react';

interface DataEntryFormDialogProps {
  actionDefinition: ActionDefinition | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitLog: (data: LogDataEntryInputDTO) => Promise<void>;
  // isSubmitting is now managed internally by this component or a hook if it gets more complex
}

export function DataEntryFormDialog({
  actionDefinition,
  isOpen,
  onClose,
  onSubmitLog,
}: DataEntryFormDialogProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && actionDefinition && actionDefinition.formFields) {
      const initialData: Record<string, any> = {};
      actionDefinition.formFields.forEach(field => {
        initialData[field.name] = field.fieldType === 'number' ? '' : ''; // Default to empty string
      });
      setFormData(initialData);
      setError(null); // Reset error when dialog opens
    } else if (!isOpen) {
      setFormData({}); 
    }
  }, [isOpen, actionDefinition]);

  const handleInputChange = (fieldName: string, value: any, fieldType: FormFieldDefinition['fieldType']) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: fieldType === 'number' ? (value === '' ? '' : Number(value)) : value,
    }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!actionDefinition || !actionDefinition.formFields) return;
    setError(null);

    for (const field of actionDefinition.formFields) {
      if (field.isRequired && (formData[field.name] === undefined || String(formData[field.name]).trim() === '')) {
        setError(`Field "${field.label}" is required.`);
        return;
      }
      if (field.fieldType === 'number' && formData[field.name] !== '' && isNaN(Number(formData[field.name]))) {
        setError(`Field "${field.label}" must be a valid number.`);
        return;
      }
    }
    
    setIsSubmitting(true);
    try {
      await onSubmitLog({
        spaceId: actionDefinition.spaceId,
        actionDefinitionId: actionDefinition.id,
        formData: formData,
      });
      // Success: parent's onSubmitLog should handle UI feedback (e.g., closing dialog, refreshing data)
      // The onClose prop will be called by the parent after successful submission.
    } catch (err: any) {
      console.error("Error submitting data entry form from dialog:", err);
      setError(err.message || "Failed to log data.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDialogClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  },[isSubmitting, onClose]);
  
  if (!actionDefinition) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{actionDefinition.name}</DialogTitle>
          {actionDefinition.description && (
            <DialogDescription>{actionDefinition.description}</DialogDescription>
          )}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {actionDefinition.formFields?.sort((a,b) => a.order - b.order).map(field => (
            <div key={field.id} className="space-y-1">
              <Label htmlFor={field.id} className="text-md">
                {field.label} {field.isRequired && <span className="text-destructive">*</span>}
              </Label>
              {field.fieldType === 'textarea' ? (
                <Textarea
                  id={field.id}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleInputChange(field.name, e.target.value, field.fieldType)}
                  placeholder={field.placeholder || ''}
                  required={field.isRequired}
                  className="text-md p-2 min-h-[100px]"
                  disabled={isSubmitting}
                />
              ) : (
                <Input
                  id={field.id}
                  type={field.fieldType === 'date' ? 'date' : field.fieldType === 'number' ? 'number' : 'text'}
                  value={formData[field.name] || ''}
                  onChange={(e) => handleInputChange(field.name, e.target.value, field.fieldType)}
                  placeholder={field.placeholder || ''}
                  required={field.isRequired}
                  className="text-md p-3"
                  disabled={isSubmitting}
                  step={field.fieldType === 'number' ? 'any' : undefined}
                />
              )}
            </div>
          ))}
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" size="lg" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <FileInput className="mr-2 h-5 w-5" />}
              Log Data
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
