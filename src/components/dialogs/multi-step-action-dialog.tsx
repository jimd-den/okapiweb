// src/components/dialogs/multi-step-action-dialog.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from 'react'; // Added useRef
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
  isSubmitting: boolean; // General submitting state from parent
}

export function MultiStepActionDialog({
  actionDefinition,
  isOpen,
  onClose,
  onLogAction,
  isSubmitting,
}: MultiStepActionDialogProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const { toast } = useToast();
  const previousActionIdRef = useRef<string | null | undefined>(null);
  const wasOpenRef = useRef<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      // Only reset to the first step if:
      // 1. The dialog was previously closed (wasOpenRef.current is false)
      // OR
      // 2. The actionDefinition ID has changed since the last time it was open with this ID.
      if (!wasOpenRef.current || (actionDefinition && previousActionIdRef.current !== actionDefinition.id)) {
        setCurrentStepIndex(0);
        previousActionIdRef.current = actionDefinition?.id;
      }
    }
    // Update wasOpenRef *after* checking its previous state for the next render cycle
    wasOpenRef.current = isOpen;
  }, [isOpen, actionDefinition, actionDefinition?.id]);


  const currentStep: ActionStep | undefined = actionDefinition?.steps?.[currentStepIndex];
  const totalSteps = actionDefinition?.steps?.length || 0;

  const handleNextStepOrClose = () => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(prevIndex => prevIndex + 1);
    } else {
      if (isOpen) { 
        toast({
          title: "Checklist Finished",
          description: `You've gone through all steps for "${actionDefinition?.name}".`,
        });
        onClose();
      }
    }
  };

  const handleYes = async () => {
    if (!actionDefinition || !currentStep || isSubmitting) return;

    try {
      await onLogAction(actionDefinition.id, currentStep.id, 'completed');
      handleNextStepOrClose();
    } catch (error: any) {
      toast({
        title: "Error Logging Step",
        description: error.message || "Could not log this step as completed.",
        variant: "destructive",
      });
    } 
  };

  const handleNo = async () => {
    if (!actionDefinition || !currentStep || isSubmitting) return;
    
    try {
      await onLogAction(actionDefinition.id, currentStep.id, 'skipped');
      handleNextStepOrClose();
    } catch (error: any) {
      toast({
        title: "Error Logging Step",
        description: error.message || "Could not log this step as skipped.",
        variant: "destructive",
      });
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
            disabled={isSubmitting || !currentStep}
            className="text-lg px-6 py-3 w-full sm:w-auto"
          >
            {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <X className="mr-2 h-5 w-5" />}
            Skip / No
          </Button>
          <Button
            type="button"
            onClick={handleYes}
            disabled={isSubmitting || !currentStep}
            className="text-lg px-6 py-3 w-full sm:w-auto"
          >
            {isSubmitting ? (
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
