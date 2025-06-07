
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
import { Loader2, Check, X, Sparkles, AlertTriangle, FileInput, ScanLine } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { LogDataEntryInputDTO } from '@/application/use-cases';
import { BarcodeScannerDialog } from './barcode-scanner-dialog'; 

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
        <DialogContent className="sm:max-w-lg p-0"> {/* Changed max-width for better mobile, p-0 */}
          <DialogHeader className="p-5 sm:p-6 pb-3 border-b shrink-0"> {/* Increased padding */}
            <DialogTitle className="text-xl sm:text-2xl">{actionDefinition.name}</DialogTitle> {/* Increased font size */}
            <DialogDescription className="text-sm sm:text-base"> {/* Increased font size */}
              Complete each step sequentially.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4"> {/* Increased padding and space-y */}
              {currentStep ? (
              <>
                  <div className="text-sm text-muted-foreground"> {/* Increased font size */}
                  Step {currentStepIndex + 1} of {totalSteps}
                  </div>
                  <Progress value={progressPercentage} className="w-full h-2.5 mb-4" /> {/* Increased height and mb */}
                  <p className="text-lg font-medium">{currentStep.description}</p> {/* Increased font size */}
                  {currentStep.pointsPerStep && currentStep.pointsPerStep > 0 && (
                      <p className="text-sm text-primary flex items-center"> {/* Increased font size */}
                          <Sparkles className="h-4 w-4 mr-1.5" /> Worth {currentStep.pointsPerStep} points. {/* Increased icon size and mr */}
                      </p>
                  )}

                  {currentStep.stepType === 'data-entry' && currentStep.formFields && (
                      <form className="space-y-3 mt-3 border-t pt-3"> {/* Increased space-y, mt, pt */}
                      {currentStep.formFields.sort((a,b)=> a.order - b.order).map(field => (
                          <div key={field.id} className="space-y-1"> {/* Increased space-y */}
                          <Label htmlFor={`step-${currentStep.id}-field-${field.id}`} className="text-base"> {/* Increased font size */}
                              {field.label} {field.isRequired && <span className="text-destructive">*</span>}
                          </Label>
                          {field.fieldType === 'textarea' ? (
                              <Textarea
                              id={`step-${currentStep.id}-field-${field.id}`}
                              value={stepFormData[field.name] || ''}
                              onChange={(e) => handleStepInputChange(field.name, e.target.value, field.fieldType)}
                              placeholder={field.placeholder || ''}
                              required={field.isRequired}
                              className="text-base p-2.5 min-h-[80px]" // Increased p and min-h
                              disabled={isSubmittingStep}
                              />
                          ) : field.fieldType === 'barcode' ? (
                            <div className="flex items-center gap-2.5"> {/* Increased gap */}
                              <Input
                                id={`step-${currentStep.id}-field-${field.id}`}
                                type="text"
                                value={stepFormData[field.name] || ''}
                                readOnly
                                placeholder={field.placeholder || 'Scan barcode...'}
                                className="text-base p-2.5 h-11 flex-grow bg-muted/50" // Increased p and h
                                disabled={isSubmittingStep}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => handleOpenBarcodeScannerStep(field.name, field.label)}
                                disabled={isSubmittingStep}
                                className="h-11 w-12" // Increased size
                                aria-label={`Scan barcode for ${field.label}`}
                              >
                                <ScanLine className="h-6 w-6" /> {/* Increased icon size */}
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
                              className="text-base p-2.5 h-11" // Increased p and h
                              disabled={isSubmittingStep}
                              step={field.fieldType === 'number' ? 'any' : undefined}
                              />
                          )}
                          </div>
                      ))}
                      </form>
                  )}
                  {error && (
                  <Alert variant="destructive" className="mt-2 p-3 text-sm"> {/* Increased mt, p, font-size */}
                      <AlertTriangle className="h-5 w-5" /> {/* Increased icon size */}
                      <AlertDescription>{error}</AlertDescription>
                  </Alert>
                  )}
              </>
              ) : (
              <div className="py-3 text-center text-muted-foreground text-base"> {/* Increased p and font-size */}
                  {totalSteps > 0 ? "Loading step..." : "No steps defined for this checklist."}
              </div>
              )}
          </div>

          <DialogFooter className="p-5 sm:p-6 pt-3 border-t shrink-0 sm:justify-between gap-3 mt-2"> {/* Increased p, gap, mt */}
            <Button
              type="button"
              variant="outline"
              onClick={() => handleLogStep('skipped')}
              disabled={isSubmittingStep || !currentStep}
              size="lg" // Use lg size
              className="w-full sm:w-auto"
            >
              {isSubmittingStep ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <X className="mr-2 h-5 w-5" />} {/* Increased icon size */}
              Skip / No
            </Button>
            <Button
              type="button"
              onClick={() => handleLogStep('completed')}
              disabled={isSubmittingStep || !currentStep}
              size="lg" // Use lg size
              className="w-full sm:w-auto"
            >
              {isSubmittingStep ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> 
              ) : (
                <Check className="mr-2 h-5 w-5" /> 
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

    