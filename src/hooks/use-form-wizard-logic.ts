
// src/hooks/use-form-wizard-logic.ts
"use client";

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useForm, type UseFormReturn, type FieldValues, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ZodSchema } from 'zod';
import type { FormFieldDefinition } from '@/domain/entities/action-definition.entity';

export interface FormWizardStep {
  title: string;
  fields: FormFieldDefinition[];
  schema?: ZodSchema<any>; // Optional Zod schema for step validation
  description?: string;
}

interface UseFormWizardLogicProps<TData extends FieldValues> {
  steps: FormWizardStep[];
  onSubmit: SubmitHandler<TData>; // Called with all accumulated data on final submission
  initialData?: Partial<TData>;
}

export interface UseFormWizardLogicReturn<TData extends FieldValues> {
  currentStepIndex: number;
  totalSteps: number;
  currentStepConfig: FormWizardStep;
  isFirstStep: boolean;
  isLastStep: boolean;
  formMethods: UseFormReturn<TData>;
  handleNextStep: () => Promise<void>;
  handlePreviousStep: () => void;
  navigateToStep: (stepIndex: number) => Promise<void>;
  globalError: string | null;
  isSubmittingOverall: boolean; // True during the final submission process
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
    defaultValues: initialData as any, // RHF expects defaultValues, even if partial
    mode: 'onChange', // Or 'onBlur' for validation timing
  });

  // Re-initialize resolver when step changes
  useEffect(() => {
    formMethods.reset(formMethods.getValues(), {
      keepValues: true,
      keepDirty: true,
      keepDefaultValues: false, // Don't revert to initialData on step change
      keepErrors: false, // Clear previous step errors
      keepTouched: false,
      keepIsSubmitted: false,
      keepIsValid: false,
    });
    // Update resolver - RHF doesn't have a built-in way to swap resolvers dynamically.
    // This is a common challenge. For simplicity, we rely on trigger() before next.
    // A more advanced setup might involve re-initializing useForm or a custom resolver.
  }, [currentStepIndex, formMethods]);


  const handleNextStep = useCallback(async () => {
    setGlobalError(null);
    const fieldsToValidate = currentStepConfig.fields.map(f => f.name as keyof TData);
    const isValid = await formMethods.trigger(fieldsToValidate as any);

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
        const stepFields = steps[i].fields.map(f => f.name as keyof TData);
        const isValid = await formMethods.trigger(stepFields as any);
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
    } finally {
      setIsSubmittingOverall(false);
    }
  };
  
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
    isSubmittingOverall,
  };
}
