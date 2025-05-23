// src/components/space-tabs/action-definition-item.tsx
"use client";

import type { ActionDefinition } from '@/domain/entities/action-definition.entity';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, ListChecks, Loader2, FileText, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionDefinitionItemProps {
  actionDefinition: ActionDefinition;
  onLogSingleAction: (actionDefinitionId: string) => void;
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
  isLoggingAction,
  isNewlyAdded,
}: ActionDefinitionItemProps) {
  const pointsText = actionDefinition.type === 'single' || actionDefinition.type === 'data-entry'
    ? `Points: ${actionDefinition.pointsForCompletion}`
    : `Points for full completion: ${actionDefinition.pointsForCompletion}`;

  const stepCountText = actionDefinition.type === 'multi-step' && actionDefinition.steps
    ? ` (${actionDefinition.steps.length} steps)`
    : '';
  
  const fieldCountText = actionDefinition.type === 'data-entry' && actionDefinition.formFields
    ? ` (${actionDefinition.formFields.length} fields)`
    : '';

  return (
    <Card className={cn(
        "bg-card/50 p-4",
        isNewlyAdded && "animate-in fade-in-50 slide-in-from-top-5 duration-500 ease-out"
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
              className="text-md px-4 py-2" 
              onClick={() => onLogSingleAction(actionDefinition.id)}
              disabled={isLoggingAction || !actionDefinition.isEnabled}
            >
              {isLoggingAction ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />} 
              Log Action
            </Button>
          )}
          {actionDefinition.type === 'multi-step' && (
            <Button 
              size="lg" 
              variant="outline" 
              className="text-md px-4 py-2" 
              onClick={() => onOpenMultiStepDialog(actionDefinition)} 
              disabled={isLoggingAction || !actionDefinition.isEnabled || !actionDefinition.steps || actionDefinition.steps.length === 0}
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
              disabled={isLoggingAction || !actionDefinition.isEnabled || !actionDefinition.formFields || actionDefinition.formFields.length === 0}
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
            disabled={isLoggingAction}
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
