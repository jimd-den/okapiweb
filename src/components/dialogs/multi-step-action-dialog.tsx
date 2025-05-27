
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
        onClose(); 
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
      <DialogContent className="sm:max-w-sm p-4">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg">{actionDefinition.name}</DialogTitle>
          <DialogDescription className="text-xs">
            Complete each step sequentially.
          </DialogDescription>
        </DialogHeader>

        {currentStep ? (
          <div className="py-2 space-y-3">
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
            {error && (
              <Alert variant="destructive" className="mt-1 p-2 text-xs">
                <AlertTriangle className="h-3.5 w-3.5" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <div className="py-2 text-center text-muted-foreground text-sm">
            {totalSteps > 0 ? "Loading step..." : "No steps defined for this checklist."}
          </div>
        )}

        <DialogFooter className="sm:justify-between gap-2 mt-1">
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
  );
}

