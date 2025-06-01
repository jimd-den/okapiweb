
// src/hooks/use-form-wizard-logic.ts
"use client";

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useForm, type UseFormReturn, type FieldValues, type SubmitHandler, type DefaultValues, type Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ZodSchema, ZodObject, ZodRawShape } from 'zod';
import type { FormFieldDefinition } from '@/domain/entities/action-definition.entity';

export interface FormWizardStep<TData extends FieldValues = FieldValues> {
  title: string;
  fields: FormFieldDefinition[];
  schema?: ZodSchema<Partial<TData>>;
  description?: string;
}

interface UseFormWizardLogicProps<TData extends FieldValues> {
  steps: FormWizardStep<TData>[];
  onSubmit: (data: TData, wizardControl: UseFormReturn<TData>) => Promise<void>; // Updated signature
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
    mode: 'onChange',
  });

  // Update resolver when step changes
  useEffect(() => {
    formMethods.reset(formMethods.getValues(), {
        keepValues: true, // Keep existing values
        keepDirty: true, 
        keepErrors: false, // Clear previous step's errors potentially
        // @ts-ignore - RHF types might not perfectly align with dynamic resolver
        resolver: currentStepConfig.schema ? zodResolver(currentStepConfig.schema) : undefined 
    });
  }, [currentStepConfig.schema, formMethods]);


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

  const finalFormSubmitHandler: SubmitHandler<TData> = async (dataFromRHFCurrentStep) => {
    setGlobalError(null);
    setIsSubmittingOverall(true);

    const allFormData = formMethods.getValues();
    console.log("useFormWizardLogic - Data from RHF handleSubmit (current step's schema):", dataFromRHFCurrentStep);
    console.log("useFormWizardLogic - All form data from getValues():", allFormData);

    try {
      let combinedSchema: ZodObject<ZodRawShape> | null = null;
      if (steps.every(step => step.schema && typeof (step.schema as any).extend === 'function')) {
        combinedSchema = steps.reduce((acc, step) => {
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
             if (err.path && err.path.length > 0) {
                 formMethods.setError(err.path.join('.') as Path<TData>, { type: 'manual', message: err.message });
            } else {
                setGlobalError(`Validation Error: ${err.message}`);
            }
          });
          throw new Error("Please correct the errors in the form.");
        }
        dataToSubmit = validationResult.data as TData;
      }
      
      await onSubmit(dataToSubmit, formMethods); // Pass formMethods as wizardControl
    } catch (error: any) {
      console.error("Overall form submission error in useFormWizardLogic:", error);
      // If the error isn't already a global one set by combined schema validation
      if (!globalError && error.message !== "Please correct the errors in the form.") {
        setGlobalError(error.message || "An unexpected error occurred during submission.");
      }
      // No need to re-throw if onSubmit is expected to handle its own errors via formMethods.setError
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
