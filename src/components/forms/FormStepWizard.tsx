
// src/components/forms/FormStepWizard.tsx
"use client";

import React from 'react';
import { FormProvider, Controller, type UseFormReturn, type FieldValues } from 'react-hook-form';
import type { FormWizardStep, UseFormWizardLogicReturn } from '@/hooks/use-form-wizard-logic';
import { Button } from '@/components/ui/button';
import { FormFieldRenderer } from './FormFieldRenderer'; // Ensure this path is correct
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft, ArrowRight, CheckCircle, AlertTriangle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface FormStepWizardProps<TData extends FieldValues> {
  wizardTitle?: string;
  hookResult: UseFormWizardLogicReturn<TData>;
  // onScanBarcodeClick: (fieldDefinition: FormFieldDefinition) => void; // Passed to FormFieldRenderer
  // submitButtonText?: string; // Text for the final submit button
  // hideStepIndicator?: boolean;
  // Custom render function for specific fields if needed, could be complex
  // renderCustomField?: (fieldDef: FormFieldDefinition, formMethods: UseFormReturn<TData>) => React.ReactNode;
}

export function FormStepWizard<TData extends FieldValues>({
  wizardTitle,
  hookResult,
}: FormStepWizardProps<TData>) {
  const {
    currentStepIndex,
    totalSteps,
    currentStepConfig,
    isFirstStep,
    isLastStep,
    formMethods,
    handleNextStep,
    handlePreviousStep,
    globalError,
    isSubmittingOverall,
  } = hookResult;

  const { control, handleSubmit, formState: { errors, isSubmitting: isStepValidating } } = formMethods;

  // This will be the RHF onSubmit, which in the hook is wrapped to call the final prop onSubmit
  const onRHFSubmit = formMethods.handleSubmit;


  // Temporary onScanClick for barcode - will need proper implementation
  // when BarcodeScannerDialog is integrated with this wizard
  const handleScanClick = (fieldDef: any) => {
    console.warn("Barcode scanning not fully implemented in FormStepWizard yet for field:", fieldDef.label);
    // Here you would typically open the BarcodeScannerDialog
    // and pass a callback to update formMethods.setValue(fieldDef.name, scannedValue)
  };


  return (
    <FormProvider {...formMethods}>
      <div className="space-y-3 sm:space-y-4">
        {wizardTitle && (
          <h2 className="text-xl sm:text-2xl font-semibold text-center mb-1 sm:mb-2">{wizardTitle}</h2>
        )}

        <div className="text-center text-sm text-muted-foreground">
          Step {currentStepIndex + 1} of {totalSteps}
          {currentStepConfig.title ? `: ${currentStepConfig.title}` : ''}
        </div>
        
        {currentStepConfig.description && (
            <p className="text-xs text-center text-muted-foreground mb-2 sm:mb-3">{currentStepConfig.description}</p>
        )}

        {globalError && (
          <Alert variant="destructive" className="my-2 p-2 text-xs">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{globalError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={onRHFSubmit} className="space-y-3 sm:space-y-4">
          {currentStepConfig.fields.map((fieldDef) => (
            <Controller
              key={fieldDef.name}
              name={fieldDef.name as any}
              control={control}
              render={({ field, fieldState }) => (
                <FormFieldRenderer
                  fieldDefinition={fieldDef}
                  rhfField={field}
                  error={fieldState.error}
                  onScanClick={fieldDef.fieldType === 'barcode' ? () => handleScanClick(fieldDef) : undefined}
                />
              )}
            />
          ))}
          
          <Separator className="my-3 sm:my-4" />

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handlePreviousStep}
              disabled={isFirstStep || isStepValidating || isSubmittingOverall}
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Previous
            </Button>

            {!isLastStep ? (
              <Button
                type="button"
                onClick={handleNextStep}
                disabled={isStepValidating || isSubmittingOverall}
                className="w-full sm:w-auto"
              >
                {isStepValidating ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-1.5 h-4 w-4" />}
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isStepValidating || isSubmittingOverall}
                className="w-full sm:w-auto"
              >
                {isSubmittingOverall ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-1.5 h-4 w-4" />}
                Submit 
              </Button>
            )}
          </div>
        </form>
      </div>
    </FormProvider>
  );
}
