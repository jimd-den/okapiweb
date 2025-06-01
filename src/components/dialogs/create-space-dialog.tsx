
// src/components/dialogs/create-space-dialog.tsx
"use client";

import { useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Space } from '@/domain/entities/space.entity';
import type { CreateSpaceInputDTO } from '@/application/use-cases/space/create-space.usecase';
import { Loader2, AlertTriangle } from 'lucide-react';
import * as z from 'zod';
import { format } from 'date-fns';

import { useFormWizardLogic, type FormWizardStep } from '@/hooks/use-form-wizard-logic';
import { FormStepWizard } from '@/components/forms/FormStepWizard';
import type { FormFieldDefinition } from '@/domain/entities/action-definition.entity';

// Define Zod schemas for each step
const step1Schema = z.object({
  name: z.string().min(1, { message: "Space name is required." }).max(100, { message: "Space name must be 100 characters or less." }),
});

const step2Schema = z.object({
  description: z.string().max(500, { message: "Description must be 500 characters or less." }).optional().or(z.literal('')),
  tags: z.string().optional().or(z.literal('')),
  goal: z.string().max(200, { message: "Goal must be 200 characters or less." }).optional().or(z.literal('')),
});

// Define field configurations for each step
const step1Fields: FormFieldDefinition[] = [
  { id: 'name', name: 'name', label: 'Space Name', fieldType: 'text', isRequired: true, placeholder: 'e.g., Morning Focus Block', order: 0 },
];

const step2Fields: FormFieldDefinition[] = [
  { id: 'description', name: 'description', label: 'Description (Optional)', fieldType: 'textarea', isRequired: false, placeholder: 'A brief overview...', order: 0 },
  { id: 'goal', name: 'goal', label: 'Goal for this Space (Optional)', fieldType: 'text', isRequired: false, placeholder: 'e.g., Complete report draft', order: 1 },
  { id: 'tags', name: 'tags', label: 'Tags (Optional, comma-separated)', fieldType: 'text', isRequired: false, placeholder: 'e.g., work, deep-work', order: 2 },
];

const wizardSteps: FormWizardStep[] = [
  { title: 'Name Your Space', fields: step1Fields, schema: step1Schema, description: "Every great space starts with a name." },
  { title: 'Add Optional Details', fields: step2Fields, schema: step2Schema, description: "Flesh out your space with more information." },
];

interface CreateSpaceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSpaceCreated: (newSpace: Space) => void;
  createSpace: (data: Omit<CreateSpaceInputDTO, 'date'>) => Promise<Space>;
  selectedDate?: Date;
}

export function CreateSpaceDialog({ isOpen, onClose, onSpaceCreated, createSpace, selectedDate }: CreateSpaceDialogProps) {

  const onSubmitFinal = async (data: any) => {
    if (!selectedDate) {
      // This error should ideally be caught before final submission if date is critical
      // For now, setting it on the wizard's global error
      wizardHookResult.setGlobalError("No date selected. Please select a date on the calendar.");
      throw new Error("No date selected.");
    }

    const spaceInput: Omit<CreateSpaceInputDTO, 'date'> = {
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
      tags: data.tags ? data.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag) : [],
      goal: data.goal?.trim() || undefined,
    };

    try {
      const createdSpace = await createSpace(spaceInput);
      onSpaceCreated(createdSpace);
      resetAndClose(); // Close and reset on successful creation
    } catch (err: any) {
      console.error("Failed to create space:", err);
      wizardHookResult.setGlobalError(err.message || "Could not save the new space. Please try again.");
      throw err; // Re-throw to let the wizard know submission failed
    }
  };

  const wizardHookResult = useFormWizardLogic({
    steps: wizardSteps,
    onSubmit: onSubmitFinal,
    initialData: { name: '', description: '', tags: '', goal: '' },
  });

  const { formMethods, globalError, isSubmittingOverall, resetWizard } = wizardHookResult;

  const resetAndClose = useCallback(() => {
    resetWizard();
    onClose();
  }, [resetWizard, onClose]);

  useEffect(() => {
    if (isOpen) {
      resetWizard(); // Reset wizard state when dialog opens
    }
  }, [isOpen, resetWizard]);

  const dialogTitle = `Create New Space for ${selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'Selected Date'}`;
  const dialogDescription = selectedDate ? "Fill in the details for your new space." : "Please select a date on the main page first.";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && resetAndClose()}>
      <DialogContent className="sm:max-w-md p-4">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg">{dialogTitle}</DialogTitle>
          <DialogDescription className="text-xs">{dialogDescription}</DialogDescription>
        </DialogHeader>

        {globalError && (
            <Alert variant="destructive" className="my-2 p-2 text-xs">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{globalError}</AlertDescription>
            </Alert>
        )}
        
        {isOpen && selectedDate && ( // Only render wizard if dialog is open and date selected
            <FormStepWizard
                hookResult={wizardHookResult}
                wizardTitle="" // Title is handled by DialogHeader
            />
        )}

        {!selectedDate && isOpen && (
             <div className="py-4 text-center">
                <Alert variant="default">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>Please select a date on the calendar before creating a space.</AlertDescription>
                </Alert>
            </div>
        )}
        
        {/* Footer for Cancel button, submit is handled by FormStepWizard */}
        <DialogFooter className="mt-4">
            <Button type="button" variant="outline" size="sm" onClick={resetAndClose} disabled={isSubmittingOverall}>
              Cancel
            </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
