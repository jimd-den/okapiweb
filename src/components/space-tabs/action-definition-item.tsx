// src/components/space-tabs/action-definition-item.tsx
"use client";

import { useState } from 'react';
import type { ActionDefinition } from '@/domain/entities/action-definition.entity';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, ListChecks, Loader2, FileText, Edit3, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ANIMATION_ITEM_NEWLY_ADDED } from '@/lib/constants';

interface ActionDefinitionItemProps {
  actionDefinition: ActionDefinition;
  onLogSingleAction: (actionDefinitionId: string) => Promise<void>;
  onOpenMultiStepDialog: (actionDefinition: ActionDefinition) => void;
  onOpenDataEntryDialog: (actionDefinition: ActionDefinition) => void;
  onEditActionDefinition: (actionDefinition: ActionDefinition) => void;
  isLoggingAction: boolean;
  isNewlyAdded?: boolean;
}

export function ActionDefinitionItem({
  actionDefinition,
  onLogSingleAction,
  onOpenMultiStepDialog,
  onOpenDataEntryDialog,
  onEditActionDefinition,
  isLoggingAction: isLoggingActionOverall,
  isNewlyAdded,
}: ActionDefinitionItemProps) {
  const [isLoggingThisAction, setIsLoggingThisAction] = useState(false);
  const [logSuccess, setLogSuccess] = useState(false);

  const pointsText = actionDefinition.type === 'single' || actionDefinition.type === 'data-entry'
    ? `Points: ${actionDefinition.pointsForCompletion}`
    : `Points for full completion: ${actionDefinition.pointsForCompletion}`;

  const stepCountText = actionDefinition.type === 'multi-step' && actionDefinition.steps
    ? ` (${actionDefinition.steps.length} steps)`
    : '';
  
  const fieldCountText = actionDefinition.type === 'data-entry' && actionDefinition.formFields
    ? ` (${actionDefinition.formFields.length} fields)`
    : '';

  const handleSingleActionLog = async () => {
    if (!actionDefinition.isEnabled || isLoggingThisAction || isLoggingActionOverall) return;
    setIsLoggingThisAction(true);
    setLogSuccess(false);
    try {
      await onLogSingleAction(actionDefinition.id);
      setLogSuccess(true);
      setTimeout(() => setLogSuccess(false), 1500); 
    } catch (error) {
      console.error("Failed to log action:", error);
    } finally {
      setIsLoggingThisAction(false);
    }
  };

  return (
    <Card className={cn(
        "bg-card/50 p-4",
        isNewlyAdded && ANIMATION_ITEM_NEWLY_ADDED
      )}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex-grow">
          <h4 className="font-semibold text-lg">{actionDefinition.name}</h4>
          {actionDefinition.description && <p className="text-sm text-muted-foreground">{actionDefinition.description}</p>}
          <p className="text-xs text-primary">
            {pointsText}
            {stepCountText}
            {fieldCountText}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          {actionDefinition.type === 'single' && (
            <Button 
              size="lg" 
              className={cn(
                "text-md px-4 py-2 transition-all",
                logSuccess && "bg-green-500 hover:bg-green-600 animate-success-pulse"
              )}
              onClick={handleSingleActionLog}
              disabled={isLoggingThisAction || isLoggingActionOverall || !actionDefinition.isEnabled || logSuccess}
            >
              {isLoggingThisAction ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 
               logSuccess ? <CheckCircle2 className="mr-2 h-5 w-5" /> : 
               <Play className="mr-2 h-5 w-5" />} 
              {logSuccess ? "Logged!" : "Log Action"}
            </Button>
          )}
          {actionDefinition.type === 'multi-step' && (
            <Button 
              size="lg" 
              variant="outline" 
              className="text-md px-4 py-2" 
              onClick={() => onOpenMultiStepDialog(actionDefinition)} 
              disabled={isLoggingActionOverall || !actionDefinition.isEnabled || !actionDefinition.steps || actionDefinition.steps.length === 0}
            >
              <ListChecks className="mr-2 h-5 w-5" /> Start Checklist
            </Button>
          )}
          {actionDefinition.type === 'data-entry' && (
            <Button
              size="lg"
              variant="outline"
              className="text-md px-4 py-2"
              onClick={() => onOpenDataEntryDialog(actionDefinition)}
              disabled={isLoggingActionOverall || !actionDefinition.isEnabled || !actionDefinition.formFields || actionDefinition.formFields.length === 0}
            >
              <FileText className="mr-2 h-5 w-5" /> Log Data
            </Button>
          )}
           <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:text-foreground"
            onClick={() => onEditActionDefinition(actionDefinition)}
            aria-label="Edit Action Definition"
            disabled={isLoggingThisAction || isLoggingActionOverall}
          >
            <Edit3 className="h-5 w-5" />
          </Button>
        </div>
      </div>
      {!actionDefinition.isEnabled && (
        <p className="text-xs text-destructive mt-1">This action is currently disabled.</p>
      )}
    </Card>
  );
}
