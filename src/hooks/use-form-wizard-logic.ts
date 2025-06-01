
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
  navigateToStep: (stepIndex: number) => Promise<void>; 
  globalError: string | null;
  setGlobalError: (error: string | null) => void;
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
    mode: 'onChange', // Or 'onBlur' or 'onSubmit' depending on desired UX
  });

  // REMOVED PROBLEMATIC useEffect that called formMethods.reset() on currentStepIndex change.
  // This was a likely source of infinite loops.
  // Step-specific schema validation will now be handled by formMethods.trigger in handleNextStep.

  const handleNextStep = useCallback(async () => {
    setGlobalError(null);
    const fieldsToValidate = currentStepConfig.fields.map(f => f.name as Path<TData>);
    const isValid = await formMethods.trigger(fieldsToValidate);

    if (isValid) {
      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
      }
    } else {
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
    if (stepIndex > currentStepIndex) {
      for (let i = currentStepIndex; i < stepIndex; i++) {
        const stepFields = steps[i].fields.map(f => f.name as Path<TData>);
        const isValid = await formMethods.trigger(stepFields);
        if (!isValid) {
          setCurrentStepIndex(i); 
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
    } catch (error: any) {
      console.error("Overall form submission error:", error);
      setGlobalError(error.message || "An unexpected error occurred during submission.");
    } finally {
      setIsSubmittingOverall(false);
    }
  };

  const resetWizard = useCallback(() => {
    setCurrentStepIndex(0);
    setGlobalError(null);
    setIsSubmittingOverall(false);
    formMethods.reset(initialData as DefaultValues<TData>); 
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
    setGlobalError,
    isSubmittingOverall,
    resetWizard,
  };
}
