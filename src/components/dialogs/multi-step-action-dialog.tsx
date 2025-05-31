
"use client";

import { useState, useEffect, useCallback, useRef, type FormEvent } from 'react';
import type { ActionDefinition, ActionStep, FormFieldDefinition } from '@/domain/entities/action-definition.entity';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, Check, X, Sparkles, AlertTriangle, FileInput, ScanLine } from 'lucide-react'; // Added ScanLine
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { LogDataEntryInputDTO } from '@/application/use-cases';
import { BarcodeScannerDialog } from './barcode-scanner-dialog'; // Import BarcodeScannerDialog

interface MultiStepActionDialogProps {
  actionDefinition: ActionDefinition | null;
  isOpen: boolean;
  onClose: () => void;
  onLogAction: (actionDefinitionId: string, stepId: string, outcome: 'completed' | 'skipped') => Promise<void>;
  onLogDataEntry: (data: Omit<LogDataEntryInputDTO, 'spaceId'>) => Promise<void>;
}

export function MultiStepActionDialog({
  actionDefinition,
  isOpen,
  onClose,
  onLogAction,
  onLogDataEntry,
}: MultiStepActionDialogProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSubmittingStep, setIsSubmittingStep] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stepFormData, setStepFormData] = useState<Record<string, any>>({});
  const previousActionIdRef = useRef<string | null | undefined>(null);
  const wasOpenRef = useRef<boolean>(false);

  // State for barcode scanner within steps
  const [isBarcodeScannerOpenStep, setIsBarcodeScannerOpenStep] = useState(false);
  const [currentScanningFieldStep, setCurrentScanningFieldStep] = useState<{ name: string; label: string } | null>(null);

  const currentStep: ActionStep | undefined = actionDefinition?.steps?.[currentStepIndex];
  const totalSteps = actionDefinition?.steps?.length || 0;

  const initializeStepFormData = useCallback(() => {
    if (currentStep?.stepType === 'data-entry' && currentStep.formFields) {
      const initialData: Record<string, any> = {};
      currentStep.formFields.forEach(field => {
        initialData[field.name] = field.fieldType === 'number' ? '' : (field.fieldType === 'barcode' ? '' : '');
      });
      setStepFormData(initialData);
    } else {
      setStepFormData({});
    }
  }, [currentStep]);

  useEffect(() => {
    if (isOpen) {
      if (!wasOpenRef.current || (actionDefinition && previousActionIdRef.current !== actionDefinition.id)) {
        setCurrentStepIndex(0);
        setError(null);
        previousActionIdRef.current = actionDefinition?.id;
      }
      initializeStepFormData();
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, actionDefinition, currentStepIndex, initializeStepFormData]);


  const handleStepInputChange = (fieldName: string, value: any, fieldType: FormFieldDefinition['fieldType']) => {
    setStepFormData(prev => ({
      ...prev,
      [fieldName]: fieldType === 'number' ? (value === '' ? '' : Number(value)) : value,
    }));
  };
  
  const handleOpenBarcodeScannerStep = (fieldName: string, fieldLabel: string) => {
    setCurrentScanningFieldStep({ name: fieldName, label: fieldLabel });
    setIsBarcodeScannerOpenStep(true);
  };

  const handleBarcodeScanSuccessStep = (scannedValue: string) => {
    if (currentScanningFieldStep) {
      setStepFormData(prev => ({
        ...prev,
        [currentScanningFieldStep.name]: scannedValue,
      }));
    }
    setIsBarcodeScannerOpenStep(false);
    setCurrentScanningFieldStep(null);
  };


  const handleNextStepOrClose = useCallback(() => {
    setError(null);
    setStepFormData({}); 
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(prevIndex => prevIndex + 1);
    } else {
      if (isOpen) { 
        onClose(); 
      }
    }
  }, [currentStepIndex, totalSteps, isOpen, onClose]);

  const handleLogStep = async (outcome: 'completed' | 'skipped') => {
    if (!actionDefinition || !currentStep || isSubmittingStep) return;
    
    setIsSubmittingStep(true);
    setError(null);
    try {
      if (outcome === 'completed' && currentStep.stepType === 'data-entry' && currentStep.formFields) {
        for (const field of currentStep.formFields) {
          if (field.isRequired && (stepFormData[field.name] === undefined || String(stepFormData[field.name]).trim() === '')) {
            throw new Error(`Field "${field.label}" is required for this step.`);
          }
          if (field.fieldType === 'number' && stepFormData[field.name] !== '' && isNaN(Number(stepFormData[field.name]))) {
             throw new Error(`Field "${field.label}" must be a valid number.`);
          }
        }
        await onLogDataEntry({
          actionDefinitionId: actionDefinition.id, 
          stepId: currentStep.id,
          formData: stepFormData,
        });
      }
      await onLogAction(actionDefinition.id, currentStep.id, outcome);
      handleNextStepOrClose();
    } catch (err: any) {
      console.error("Error logging step:", err);
      setError(err.message || `Could not log step as ${outcome}.`);
    } finally {
      setIsSubmittingStep(false);
    }
  };
  
  const handleDialogClose = useCallback(() => {
    if (isSubmittingStep) return;
    onClose();
  }, [isSubmittingStep, onClose]);

  if (!actionDefinition) {
    return null;
  }

  const progressPercentage = totalSteps > 0 ? ((currentStepIndex + 1) / totalSteps) * 100 : 0;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col p-0">
          <DialogHeader className="p-4 pb-2 border-b shrink-0">
            <DialogTitle className="text-lg">{actionDefinition.name}</DialogTitle>
            <DialogDescription className="text-xs">
              Complete each step sequentially.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {currentStep ? (
              <>
                  <div className="text-xs text-muted-foreground">
                  Step {currentStepIndex + 1} of {totalSteps}
                  </div>
                  <Progress value={progressPercentage} className="w-full h-1.5 mb-3" />
                  <p className="text-md font-medium">{currentStep.description}</p>
                  {currentStep.pointsPerStep && currentStep.pointsPerStep > 0 && (
                      <p className="text-xs text-primary flex items-center">
                          <Sparkles className="h-3.5 w-3.5 mr-1" /> Worth {currentStep.pointsPerStep} points.
                      </p>
                  )}

                  {currentStep.stepType === 'data-entry' && currentStep.formFields && (
                      <form className="space-y-2 mt-2 border-t pt-2">
                      {currentStep.formFields.sort((a,b)=> a.order - b.order).map(field => (
                          <div key={field.id} className="space-y-0.5">
                          <Label htmlFor={`step-${currentStep.id}-field-${field.id}`} className="text-xs">
                              {field.label} {field.isRequired && <span className="text-destructive">*</span>}
                          </Label>
                          {field.fieldType === 'textarea' ? (
                              <Textarea
                              id={`step-${currentStep.id}-field-${field.id}`}
                              value={stepFormData[field.name] || ''}
                              onChange={(e) => handleStepInputChange(field.name, e.target.value, field.fieldType)}
                              placeholder={field.placeholder || ''}
                              required={field.isRequired}
                              className="text-sm p-1.5 min-h-[60px] h-auto"
                              disabled={isSubmittingStep}
                              />
                          ) : field.fieldType === 'barcode' ? (
                            <div className="flex items-center gap-2">
                              <Input
                                id={`step-${currentStep.id}-field-${field.id}`}
                                type="text"
                                value={stepFormData[field.name] || ''}
                                readOnly
                                placeholder={field.placeholder || 'Scan barcode...'}
                                className="text-sm p-1.5 h-8 flex-grow bg-muted/50"
                                disabled={isSubmittingStep}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => handleOpenBarcodeScannerStep(field.name, field.label)}
                                disabled={isSubmittingStep}
                                className="h-8 w-9"
                                aria-label={`Scan barcode for ${field.label}`}
                              >
                                <ScanLine className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                              <Input
                              id={`step-${currentStep.id}-field-${field.id}`}
                              type={field.fieldType === 'date' ? 'date' : field.fieldType === 'number' ? 'number' : 'text'}
                              value={stepFormData[field.name] || ''}
                              onChange={(e) => handleStepInputChange(field.name, e.target.value, field.fieldType)}
                              placeholder={field.placeholder || ''}
                              required={field.isRequired}
                              className="text-sm p-1.5 h-8"
                              disabled={isSubmittingStep}
                              step={field.fieldType === 'number' ? 'any' : undefined}
                              />
                          )}
                          </div>
                      ))}
                      </form>
                  )}
                  {error && (
                  <Alert variant="destructive" className="mt-1 p-2 text-xs">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <AlertDescription>{error}</AlertDescription>
                  </Alert>
                  )}
              </>
              ) : (
              <div className="py-2 text-center text-muted-foreground text-sm">
                  {totalSteps > 0 ? "Loading step..." : "No steps defined for this checklist."}
              </div>
              )}
          </div>

          <DialogFooter className="p-4 pt-2 border-t shrink-0 sm:justify-between gap-2 mt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleLogStep('skipped')}
              disabled={isSubmittingStep || !currentStep}
              size="sm"
              className="w-full sm:w-auto"
            >
              {isSubmittingStep ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin"/> : <X className="mr-1.5 h-4 w-4" />}
              Skip / No
            </Button>
            <Button
              type="button"
              onClick={() => handleLogStep('completed')}
              disabled={isSubmittingStep || !currentStep}
              size="sm"
              className="w-full sm:w-auto"
            >
              {isSubmittingStep ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-1.5 h-4 w-4" />
              )}
              Complete / Yes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {currentScanningFieldStep && (
        <BarcodeScannerDialog
          isOpen={isBarcodeScannerOpenStep}
          onClose={() => {
            setIsBarcodeScannerOpenStep(false);
            setCurrentScanningFieldStep(null);
          }}
          onScanSuccess={handleBarcodeScanSuccessStep}
          fieldLabel={currentScanningFieldStep.label}
        />
      )}
    </>
  );
}
