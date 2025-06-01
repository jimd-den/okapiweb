
// src/components/dialogs/create-space-dialog.tsx
"use client";

import { useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Space } from '@/domain/entities/space.entity';
import type { CreateSpaceInputDTO } from '@/application/use-cases/space/create-space.usecase';
import { AlertTriangle } from 'lucide-react';
import * as z from 'zod';
import { format } from 'date-fns';
import type { UseFormReturn } from 'react-hook-form';

import { useFormWizardLogic, type FormWizardStep } from '@/hooks/use-form-wizard-logic';
import { FormStepWizard } from '@/components/forms/FormStepWizard';
import type { FormFieldDefinition } from '@/domain/entities/action-definition.entity';

const step1Schema = z.object({
  name: z.string().min(1, { message: "Space name is required." }).max(100, { message: "Space name must be 100 characters or less." }),
});

const step2Schema = z.object({
  description: z.string().max(500, { message: "Description must be 500 characters or less." }).optional().or(z.literal('')),
  tags: z.string().optional().or(z.literal('')),
  goal: z.string().max(200, { message: "Goal must be 200 characters or less." }).optional().or(z.literal('')),
});

const step1Fields: FormFieldDefinition[] = [
  { id: 'name', name: 'name', label: 'Space Name', fieldType: 'text', isRequired: true, placeholder: 'e.g., Morning Focus Block', order: 0 },
];

const step2Fields: FormFieldDefinition[] = [
  { id: 'description', name: 'description', label: 'Description (Optional)', fieldType: 'textarea', isRequired: false, placeholder: 'A brief overview...', order: 0 },
  { id: 'goal', name: 'goal', label: 'Goal for this Space (Optional)', fieldType: 'text', isRequired: false, placeholder: 'e.g., Complete report draft', order: 1 },
  { id: 'tags', name: 'tags', label: 'Tags (Optional, comma-separated)', fieldType: 'text', isRequired: false, placeholder: 'e.g., work, deep-work', order: 2 },
];

interface CreateSpaceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSpaceCreated: (newSpace: Space) => void;
  createSpace: (data: Omit<CreateSpaceInputDTO, 'date'>) => Promise<Space>;
  selectedDate?: Date;
}

type SpaceWizardData = {
  name: string;
  description?: string;
  tags?: string; // Kept as string for form input, converted on submission
  goal?: string;
};

export function CreateSpaceDialog({ isOpen, onClose, onSpaceCreated, createSpace, selectedDate }: CreateSpaceDialogProps) {

  const wizardSteps = useMemo((): FormWizardStep<SpaceWizardData>[] => [
    { title: 'Name Your Space', fields: step1Fields, schema: step1Schema as z.ZodSchema<Partial<SpaceWizardData>>, description: "Every great space starts with a name." },
    { title: 'Add Optional Details', fields: step2Fields, schema: step2Schema as z.ZodSchema<Partial<SpaceWizardData>>, description: "Flesh out your space with more information." },
  ], []);

  const onSubmitFinal = useCallback(async (data: SpaceWizardData, wizardCtrl: UseFormReturn<SpaceWizardData>) => {
    if (!selectedDate) {
      wizardCtrl.setError('root' as any, { type: 'manual', message: "No date selected. Please select a date on the calendar."});
      throw new Error("No date selected for creating space.");
    }

    if (typeof data.name !== 'string' || !data.name.trim()) {
      console.error("onSubmitFinal: data.name is not a string or is empty. Data:", JSON.stringify(data));
      const errorMessage = "Space name is missing or empty. Please complete the first step.";
      wizardCtrl.setError('name' as any, { type: 'manual', message: errorMessage });
      throw new Error(errorMessage);
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
      if (wizardHookResult && typeof wizardHookResult.resetWizard === 'function') {
        wizardHookResult.resetWizard();
      }
      onClose(); // Close dialog after successful creation
    } catch (err: any) {
      console.error("Failed to create space (onSubmitFinal):", err);
      wizardCtrl.setError('root' as any, {type: 'manual', message: err.message || "Could not save the new space. Please try again."});
      throw err; 
    }
  }, [selectedDate, createSpace, onSpaceCreated, onClose]); // wizardHookResult removed from here as it's closed over by the hook itself.

  const initialWizardData = useMemo(() => ({ name: '', description: '', tags: '', goal: '' }), []);

  const wizardHookResult = useFormWizardLogic<SpaceWizardData>({
    steps: wizardSteps,
    onSubmit: onSubmitFinal,
    initialData: initialWizardData,
  });

  const { globalError, isSubmittingOverall, resetWizard: wizardResetFn } = wizardHookResult || {};

  const resetAndClose = useCallback(() => {
    if (wizardResetFn && typeof wizardResetFn === 'function') {
      wizardResetFn();
    } else {
       console.error("CreateSpaceDialog: resetWizard function not available during resetAndClose.");
    }
    onClose();
  }, [wizardResetFn, onClose]);

  useEffect(() => {
    if (isOpen) {
      if (wizardResetFn && typeof wizardResetFn === 'function') {
        wizardResetFn();
      } else if (isOpen) {
        console.error("CreateSpaceDialog: resetWizard function not available during useEffect open.");
      }
    }
  }, [isOpen, wizardResetFn]);

  const dialogTitle = `Create New Space for ${selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'Selected Date'}`;
  const dialogDescription = selectedDate ? "Fill in the details for your new space." : "Please select a date on the main page first.";

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && resetAndClose()}>
      <DialogContent className="sm:max-w-md p-4">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg">{dialogTitle}</DialogTitle>
          <DialogDescription className="text-xs">{dialogDescription}</DialogDescription>
        </DialogHeader>

        {globalError && !isSubmittingOverall && (
            <Alert variant="destructive" className="my-2 p-2 text-xs">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{globalError}</AlertDescription>
            </Alert>
        )}
        
        {selectedDate && wizardHookResult ? (
            <FormStepWizard<SpaceWizardData>
                hookResult={wizardHookResult}
                wizardTitle="" 
            />
        ) : (
             <div className="py-4 text-center">
                <Alert variant="default">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>Please select a date on the calendar before creating a space.</AlertDescription>
                </Alert>
            </div>
        )}
        
        <DialogFooter className="mt-4">
            <Button type="button" variant="outline" size="sm" onClick={resetAndClose} disabled={!!isSubmittingOverall}>
              Cancel
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
