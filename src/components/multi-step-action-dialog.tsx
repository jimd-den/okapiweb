// src/components/multi-step-action-dialog.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { ActionDefinition, ActionStep } from '@/domain/entities/action-definition.entity';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check, X, Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

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
  const [isLoadingStep, setIsLoadingStep] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && actionDefinition) {
      setCurrentStepIndex(0); // Reset to first step when dialog opens or action changes
    }
  }, [isOpen, actionDefinition]);

  const currentStep: ActionStep | undefined = actionDefinition?.steps?.[currentStepIndex];
  const totalSteps = actionDefinition?.steps?.length || 0;

  const handleNextStepAfterLogging = () => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(prevIndex => prevIndex + 1);
    } else {
      // All steps processed or dialog manually closed
      if (isOpen) { // Check if dialog is still open before toasting/closing
        toast({
          title: "Checklist Finished",
          description: `You've gone through all steps for "${actionDefinition?.name}".`,
        });
        onClose();
      }
    }
  };

  const handleYes = async () => {
    if (!actionDefinition || !currentStep) return;

    setIsLoadingStep(true);
    try {
      await onLogAction(actionDefinition.id, currentStep.id, 'completed');
      handleNextStepAfterLogging();
    } catch (error: any) {
      toast({
        title: "Error Logging Step",
        description: error.message || "Could not log this step as completed.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingStep(false);
    }
  };

  const handleNo = async () => {
    if (!actionDefinition || !currentStep) return;
    
    setIsLoadingStep(true);
    try {
      await onLogAction(actionDefinition.id, currentStep.id, 'skipped');
      handleNextStepAfterLogging();
    } catch (error: any) {
      toast({
        title: "Error Logging Step",
        description: error.message || "Could not log this step as skipped.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingStep(false);
    }
  };

  if (!actionDefinition) {
    return null;
  }

  const progressPercentage = totalSteps > 0 ? ((currentStepIndex + 1) / totalSteps) * 100 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
      }
    }}>
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
            onClick={handleNo}
            disabled={isLoadingStep || !currentStep}
            className="text-lg px-6 py-3 w-full sm:w-auto"
          >
            {isLoadingStep ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <X className="mr-2 h-5 w-5" />}
            Skip / No
          </Button>
          <Button
            type="button"
            onClick={handleYes}
            disabled={isLoadingStep || !currentStep}
            className="text-lg px-6 py-3 w-full sm:w-auto"
          >
            {isLoadingStep ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Check className="mr-2 h-5 w-5" />
            )}
            Complete / Yes
          </Button>
        </DialogFooter>
         <DialogClose asChild>
            <button className="sr-only">Close</button>
         </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
