// src/components/dialogs/data-entry-form-dialog.tsx
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import type { ActionDefinition, FormFieldDefinition } from '@/domain/entities/action-definition.entity';
import type { LogDataEntryInputDTO } from '@/application/use-cases/data-entry/log-data-entry.usecase';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileInput } from 'lucide-react';

interface DataEntryFormDialogProps {
  actionDefinition: ActionDefinition | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitLog: (data: LogDataEntryInputDTO) => Promise<void>;
  isSubmitting: boolean; // General submitting state from parent
}

export function DataEntryFormDialog({
  actionDefinition,
  isOpen,
  onClose,
  onSubmitLog,
  isSubmitting,
}: DataEntryFormDialogProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && actionDefinition && actionDefinition.formFields) {
      // Initialize formData based on formFields, setting default values if any
      const initialData: Record<string, any> = {};
      actionDefinition.formFields.forEach(field => {
        initialData[field.name] = field.fieldType === 'number' ? 0 : ''; // Basic default
      });
      setFormData(initialData);
    } else if (!isOpen) {
      setFormData({}); // Reset form data when dialog closes
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

    // Basic validation
    for (const field of actionDefinition.formFields) {
      if (field.isRequired && (formData[field.name] === undefined || formData[field.name] === '')) {
        toast({
          title: "Validation Error",
          description: `Field "${field.label}" is required.`,
          variant: "destructive",
        });
        return;
      }
    }
    
    try {
      await onSubmitLog({
        spaceId: actionDefinition.spaceId,
        actionDefinitionId: actionDefinition.id,
        formData: formData,
      });
      onClose(); // Close dialog on successful submission
    } catch (error: any) {
      // Toast for error is usually handled by the hook/page calling onSubmitLog
      // but we can add a fallback here if needed.
      console.error("Error submitting data entry form from dialog:", error);
    }
  };
  
  if (!actionDefinition) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{actionDefinition.name}</DialogTitle>
          {actionDefinition.description && (
            <DialogDescription>{actionDefinition.description}</DialogDescription>
          )}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
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
                />
              )}
            </div>
          ))}
          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button type="button" variant="outline" size="lg" disabled={isSubmitting}>Cancel</Button>
            </DialogClose>
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
