
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
  // isSubmitting prop removed as dialog manages its own step submission state
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
        // Only reset if dialog is newly opened for this action or if the action ID itself changed
        setCurrentStepIndex(0);
        setError(null);
        previousActionIdRef.current = actionDefinition?.id;
      }
    }
    wasOpenRef.current = isOpen; // Track if dialog was open in the previous render
  }, [isOpen, actionDefinition]); // Dependency on actionDefinition ensures reset if a different checklist is opened


  const currentStep: ActionStep | undefined = actionDefinition?.steps?.[currentStepIndex];
  const totalSteps = actionDefinition?.steps?.length || 0;

  const handleNextStepOrClose = useCallback(() => {
    setError(null);
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(prevIndex => prevIndex + 1);
    } else {
      // All steps processed
      if (isOpen) { // Check if dialog is still open
        // Parent component (ActionManager or SpaceDashboardPage) will handle any "completion" feedback
        // by observing data changes from onLogAction.
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
    if (isSubmittingStep) return; // Don't close if a step submission is in progress
    onClose();
  }, [isSubmittingStep, onClose]);

  if (!actionDefinition) {
    // This should ideally not happen if isOpen is true and actionDefinition is null,
    // but good for safety.
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
              <Alert variant="destructive" className="mt-2"> {/* Added mt-2 for spacing */}
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
