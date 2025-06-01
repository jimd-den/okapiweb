
// src/hooks/use-form-wizard-logic.ts
"use client";

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useForm, type UseFormReturn, type FieldValues, type SubmitHandler, type DefaultValues, type Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ZodSchema, ZodObject, ZodRawShape } from 'zod'; // Import ZodObject and ZodRawShape
import type { FormFieldDefinition } from '@/domain/entities/action-definition.entity';

export interface FormWizardStep<TData extends FieldValues = FieldValues> {
  title: string;
  fields: FormFieldDefinition[]; // Fields for this step
  schema?: ZodSchema<Partial<TData>>; // Zod schema for this step's fields
  description?: string;
}

interface UseFormWizardLogicProps<TData extends FieldValues> {
  steps: FormWizardStep<TData>[];
  onSubmit: SubmitHandler<TData>; // This is the final callback from the consuming component
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
  onSubmit, // This is the callback provided by the consuming component (e.g., onSubmitFinal in CreateSpaceDialog)
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

  const handleNextStep = useCallback(async () => {
    setGlobalError(null);
    const fieldsToValidate = currentStepConfig.fields.map(f => f.name as Path<TData>);
    const isValid = await formMethods.trigger(fieldsToValidate);

    if (isValid) {
      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
      }
    } else {
      console.log("Step validation failed for step", currentStepIndex, ":", formMethods.formState.errors);
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

  // This is the function that react-hook-form's handleSubmit will call.
  // The 'data' argument here is potentially filtered by the current step's Zod schema.
  const finalFormSubmitHandler: SubmitHandler<TData> = async (dataFromRHF) => {
    setGlobalError(null);
    setIsSubmittingOverall(true);

    const allFormData = formMethods.getValues(); // Get all values from the form instance
    console.log("useFormWizardLogic - Data from RHF handleSubmit:", dataFromRHF);
    console.log("useFormWizardLogic - All form data from getValues():", allFormData);

    try {
      // Attempt to create a combined schema for final validation (optional but good practice)
      let combinedSchema: ZodObject<ZodRawShape> | null = null;
      if (steps.every(step => step.schema && typeof (step.schema as any).extend === 'function')) {
        combinedSchema = steps.reduce((acc, step) => {
          // Ensure schema is a ZodObject before trying to merge
          if (step.schema && typeof (step.schema as any).shape === 'object') {
            return acc ? acc.merge(step.schema as ZodObject<ZodRawShape>) : (step.schema as ZodObject<ZodRawShape>);
          }
          return acc;
        }, null as ZodObject<ZodRawShape> | null);
      }

      let dataToSubmit = allFormData;

      if (combinedSchema) {
        const validationResult = combinedSchema.safeParse(allFormData);
        if (!validationResult.success) {
          console.error("Final combined validation failed:", validationResult.error.flatten());
          validationResult.error.errors.forEach(err => {
            formMethods.setError(err.path.join('.') as Path<TData>, { type: 'manual', message: err.message });
          });
          throw new Error("Please correct the errors in the form.");
        }
        dataToSubmit = validationResult.data as TData; // Use the parsed (and potentially transformed) data
      }
      
      // Call the onSubmit prop passed from the consuming component (e.g., CreateSpaceDialog's onSubmitFinal)
      // with the complete and potentially re-validated data.
      await onSubmit(dataToSubmit, formMethods); // Pass formMethods as the second argument if onSubmit expects it
    } catch (error: any) {
      console.error("Overall form submission error in useFormWizardLogic:", error);
      setGlobalError(error.message || "An unexpected error occurred during submission.");
      throw error; // Re-throw to allow individual dialogs to catch if needed
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
    // Expose formMethods, but ensure handleSubmit uses our finalFormSubmitHandler
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

