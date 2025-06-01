
// src/hooks/use-form-wizard-logic.ts
"use client";

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useForm, type UseFormReturn, type FieldValues, type SubmitHandler, type DefaultValues, type Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ZodSchema } from 'zod';
import type { FormFieldDefinition } from '@/domain/entities/action-definition.entity';

export interface FormWizardStep<TData extends FieldValues = FieldValues> {
  title: string;
  fields: FormFieldDefinition[]; // Fields for this step
  schema?: ZodSchema<Partial<TData>>; // Zod schema for this step's fields
  description?: string;
}

interface UseFormWizardLogicProps<TData extends FieldValues> {
  steps: FormWizardStep<TData>[];
  onSubmit: SubmitHandler<TData>;
  initialData?: Partial<TData>;
}

export interface UseFormWizardLogicReturn<TData extends FieldValues> {
  currentStepIndex: number;
  totalSteps: number;
  currentStepConfig: FormWizardStep<TData>;
  isFirstStep: boolean;
  isLastStep: boolean;
  formMethods: UseFormReturn<TData>;
  handleNextStep: () => Promise<void>;
  handlePreviousStep: () => void;
  navigateToStep: (stepIndex: number) => Promise<void>; // For direct navigation if needed
  globalError: string | null;
  setGlobalError: (error: string | null) => void; // Expose setter for global errors
  isSubmittingOverall: boolean;
  resetWizard: () => void;
}

export function useFormWizardLogic<TData extends FieldValues>({
  steps,
  onSubmit,
  initialData = {} as Partial<TData>,
}: UseFormWizardLogicProps<TData>): UseFormWizardLogicReturn<TData> {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isSubmittingOverall, setIsSubmittingOverall] = useState(false);

  const currentStepConfig = useMemo(() => steps[currentStepIndex], [steps, currentStepIndex]);

  const formMethods = useForm<TData>({
    resolver: currentStepConfig.schema ? zodResolver(currentStepConfig.schema) : undefined,
    defaultValues: initialData as DefaultValues<TData>,
    mode: 'onChange',
  });

 useEffect(() => {
    // This effect attempts to update the resolver when the step changes.
    // For react-hook-form, dynamically changing the resolver is complex.
    // A common approach is to re-initialize the form or use a resolver that can handle all steps.
    // For now, we rely on `trigger()` before advancing.
    // If schemas are very different, this might need a more robust solution.
    // Resetting the form with current values while potentially changing resolver:
    formMethods.reset(
        formMethods.getValues(), // Keep current values
        {
            keepDirty: true,
            keepDefaultValues: false, // Don't revert to initialData's defaults unless intended
            keepErrors: false, // Clear previous step's errors
            keepTouched: false,
            keepIsSubmitted: false,
            // Attempting to reflect the new schema for the resolver.
            // This is NOT a standard way to change resolver. RHF doesn't officially support dynamic resolver swapping.
            // The effective resolver change happens on the next validation trigger if the 'resolver' prop to useForm could be dynamic.
            // However, the `resolver` option to `useForm` is typically set once.
            // For now, let's assume `trigger` in `handleNextStep` uses the schema provided for THAT step's config for its specific validation.
        }
    );
  }, [currentStepIndex, formMethods, steps]); // currentStepConfig is derived, steps is more stable


  const handleNextStep = useCallback(async () => {
    setGlobalError(null);
    const fieldsToValidate = currentStepConfig.fields.map(f => f.name as Path<TData>); // Use Path<TData>
    const isValid = await formMethods.trigger(fieldsToValidate);

    if (isValid) {
      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
      }
    } else {
      // Errors will be displayed by the form due to RHF's error state
      console.log("Step validation failed:", formMethods.formState.errors);
    }
  }, [currentStepConfig, currentStepIndex, steps.length, formMethods]);

  const handlePreviousStep = useCallback(() => {
    setGlobalError(null);
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  }, [currentStepIndex]);
  
  const navigateToStep = useCallback(async (stepIndex: number) => {
    if (stepIndex === currentStepIndex) return;

    setGlobalError(null);
    // If moving forward, validate intermediate steps
    if (stepIndex > currentStepIndex) {
      for (let i = currentStepIndex; i < stepIndex; i++) {
        const stepFields = steps[i].fields.map(f => f.name as Path<TData>);
        const isValid = await formMethods.trigger(stepFields);
        if (!isValid) {
          setCurrentStepIndex(i); // Stay on the step that failed validation
          return;
        }
      }
    }
    setCurrentStepIndex(stepIndex);
  }, [currentStepIndex, steps, formMethods]);


  const finalFormSubmitHandler: SubmitHandler<TData> = async (data) => {
    setGlobalError(null);
    setIsSubmittingOverall(true);
    try {
      await onSubmit(data);
      // Success is handled by the onSubmit callback (e.g., closing dialog)
    } catch (error: any) {
      console.error("Overall form submission error:", error);
      setGlobalError(error.message || "An unexpected error occurred during submission.");
      // Do not re-throw here if setGlobalError is used for UI feedback
    } finally {
      setIsSubmittingOverall(false);
    }
  };

  const resetWizard = useCallback(() => {
    setCurrentStepIndex(0);
    setGlobalError(null);
    setIsSubmittingOverall(false);
    formMethods.reset(initialData as DefaultValues<TData>); // Reset react-hook-form state
  }, [formMethods, initialData, setCurrentStepIndex, setGlobalError, setIsSubmittingOverall]);
  
  return {
    currentStepIndex,
    totalSteps: steps.length,
    currentStepConfig,
    isFirstStep: currentStepIndex === 0,
    isLastStep: currentStepIndex === steps.length - 1,
    formMethods: { ...formMethods, handleSubmit: formMethods.handleSubmit(finalFormSubmitHandler) } as UseFormReturn<TData>,
    handleNextStep,
    handlePreviousStep,
    navigateToStep,
    globalError,
    setGlobalError, // Expose setGlobalError
    isSubmittingOverall,
    resetWizard,
  };
}
