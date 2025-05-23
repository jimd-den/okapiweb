
// src/components/dialogs/multi-step-action-dialog.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from 'react'; 
import type { ActionDefinition, ActionStep } from '@/domain/entities/action-definition.entity';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, Check, X, Sparkles, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MultiStepActionDialogProps {
  actionDefinition: ActionDefinition | null;
  isOpen: boolean;
  onClose: () => void;
  onLogAction: (actionDefinitionId: string, stepId: string, outcome: 'completed' | 'skipped') => Promise<void>;
  // isSubmitting is now managed internally
}

export function MultiStepActionDialog({
  actionDefinition,
  isOpen,
  onClose,
  onLogAction,
}: MultiStepActionDialogProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSubmittingStep, setIsSubmittingStep] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previousActionIdRef = useRef<string | null | undefined>(null);
  const wasOpenRef = useRef<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      if (!wasOpenRef.current || (actionDefinition && previousActionIdRef.current !== actionDefinition.id)) {
        setCurrentStepIndex(0);
        setError(null);
        previousActionIdRef.current = actionDefinition?.id;
      }
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, actionDefinition]);


  const currentStep: ActionStep | undefined = actionDefinition?.steps?.[currentStepIndex];
  const totalSteps = actionDefinition?.steps?.length || 0;

  const handleNextStepOrClose = useCallback(() => {
    setError(null);
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(prevIndex => prevIndex + 1);
    } else {
      if (isOpen) { 
        onClose(); // Parent will handle any "completion" feedback
      }
    }
  }, [currentStepIndex, totalSteps, isOpen, onClose]);

  const handleLogStep = async (outcome: 'completed' | 'skipped') => {
    if (!actionDefinition || !currentStep || isSubmittingStep) return;
    
    setIsSubmittingStep(true);
    setError(null);
    try {
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
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">{actionDefinition.name}</DialogTitle>
          <DialogDescription>
            Complete each step sequentially.
          </DialogDescription>
        </DialogHeader>

        {currentStep ? (
          <div className="py-4 space-y-4">
            <div className="text-sm text-muted-foreground">
              Step {currentStepIndex + 1} of {totalSteps}
            </div>
            <Progress value={progressPercentage} className="w-full h-2 mb-4" />
            <p className="text-lg font-medium">{currentStep.description}</p>
            {currentStep.pointsPerStep && currentStep.pointsPerStep > 0 && (
                <p className="text-sm text-primary flex items-center">
                    <Sparkles className="h-4 w-4 mr-1" /> Completing this step is worth {currentStep.pointsPerStep} points.
                </p>
            )}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <div className="py-4 text-center text-muted-foreground">
            {totalSteps > 0 ? "Loading step..." : "No steps defined for this checklist."}
          </div>
        )}

        <DialogFooter className="sm:justify-between gap-2 mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleLogStep('skipped')}
            disabled={isSubmittingStep || !currentStep}
            className="text-lg px-6 py-3 w-full sm:w-auto"
          >
            {isSubmittingStep ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <X className="mr-2 h-5 w-5" />}
            Skip / No
          </Button>
          <Button
            type="button"
            onClick={() => handleLogStep('completed')}
            disabled={isSubmittingStep || !currentStep}
            className="text-lg px-6 py-3 w-full sm:w-auto"
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
  );
}
