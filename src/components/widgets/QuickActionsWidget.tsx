
// src/components/widgets/QuickActionsWidget.tsx
"use client";

import React, { useMemo, useState, useCallback } from 'react';
import type { ActionDefinition } from '@/domain/entities/action-definition.entity';
import type { LogDataEntryInputDTO } from '@/application/use-cases';
import type { UseSpaceDialogsReturn } from '@/hooks/use-space-dialogs';
import type { UseSpaceActionsDataReturn } from '@/hooks/data/use-space-actions-data';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cog, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Dialog Imports
import { AdvancedActionsDialog } from '@/components/dialogs/advanced-actions-dialog';
import { MultiStepActionDialog } from '@/components/dialogs/multi-step-action-dialog';
import { DataEntryFormDialog } from '@/components/dialogs/data-entry-form-dialog';
import { TimerActionDialog } from '@/components/dialogs/timer-action-dialog';

interface QuickActionsWidgetProps {
  spaceId: string; // From useSpaceContext
  actionDefinitions: ActionDefinition[];
  isLoadingActionDefinitions: boolean;
  onLogAction: (actionDefinitionId: string, completedStepId?: string, stepOutcome?: 'completed' | 'skipped', notes?: string, durationMs?: number) => Promise<void>;
  onLogDataEntry: (data: Omit<LogDataEntryInputDTO, 'spaceId'>) => Promise<void>;
  isLoggingActionOrDataEntry: boolean;
  
  // From useSpaceDialogs hook
  dialogs: UseSpaceDialogsReturn;
  
  // From useSpaceActionsData hook (for AdvancedActionsDialog)
  actionsDataHook: Pick<
    UseSpaceActionsDataReturn,
    'createActionDefinitionUseCase' | 
    'updateActionDefinitionUseCase' | 
    'deleteActionDefinitionUseCase' |
    'addActionDefinitionInState' |
    'updateActionDefinitionInState' |
    'removeActionDefinitionFromState' |
    'refreshActionDefinitions'
  >;
}

export function QuickActionsWidget({
  spaceId,
  actionDefinitions,
  isLoadingActionDefinitions,
  onLogAction,
  onLogDataEntry,
  isLoggingActionOrDataEntry,
  dialogs,
  actionsDataHook,
}: QuickActionsWidgetProps) {
  const [animatingActionId, setAnimatingActionId] = useState<string | null>(null);

  const quickActions = useMemo(() => 
    (actionDefinitions || []).filter(ad => ad.isEnabled).slice(0, 6), 
    [actionDefinitions]
  );

  const getActionInitials = (name: string) => {
    const words = name.split(' ').filter(Boolean);
    if (words.length === 1) return name.substring(0, 2).toUpperCase();
    return words.slice(0, 2).map(word => word[0]).join('').toUpperCase();
  };

  const handleBaseLogActionWithAnimation = async (
    actionDefinitionId: string, 
    completedStepId?: string, 
    stepOutcome?: 'completed' | 'skipped', 
    notes?: string, 
    durationMs?: number
  ) => {
    setAnimatingActionId(actionDefinitionId);
    try {
      await onLogAction(actionDefinitionId, completedStepId, stepOutcome, notes, durationMs);
    } finally {
      setTimeout(() => setAnimatingActionId(null), 600);
    }
  };
  
  const handleLogDataEntryWithAnimation = async (data: Omit<LogDataEntryInputDTO, 'spaceId'>) => {
    setAnimatingActionId(data.actionDefinitionId);
    try {
      await onLogDataEntry(data);
    } finally {
      setTimeout(() => setAnimatingActionId(null), 600);
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2 pt-3 px-3 flex flex-row justify-between items-center">
          <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
          <Button variant="outline" size="sm" className="text-xs h-7 px-2 py-1" onClick={dialogs.openAdvancedActionsDialog}>
            <Cog className="mr-1.5 h-3.5 w-3.5"/> Manage Actions
          </Button>
        </CardHeader>
        <CardContent className="p-2 sm:p-3">
          {isLoadingActionDefinitions ? (
            <div className="flex justify-center items-center py-4"> <Loader2 className="h-6 w-6 animate-spin text-primary" /> </div>
          ) : quickActions.length === 0 ? (
            <p className="text-xs sm:text-sm text-muted-foreground text-center py-2">No quick actions. Use "Manage Actions" to add.</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5 sm:gap-2">
              {quickActions.map(def => (
                <Button
                  key={def.id}
                  variant="outline"
                  className={cn(
                    "flex flex-col items-center justify-center h-16 sm:h-20 text-[0.6rem] sm:text-xs p-1 break-all text-center leading-tight transition-transform duration-200",
                    animatingActionId === def.id && "animate-pop-in scale-110 bg-primary/20"
                  )}
                  onClick={async () => {
                    if (def.type === 'single') await handleBaseLogActionWithAnimation(def.id, undefined, undefined, undefined, undefined);
                    else if (def.type === 'multi-step') dialogs.openMultiStepActionDialog(def);
                    else if (def.type === 'data-entry') dialogs.openDataEntryFormDialog(def);
                    else if (def.type === 'timer') dialogs.openTimerActionDialog(def);
                  }}
                  disabled={isLoggingActionOrDataEntry || !def.isEnabled || (def.type !== 'single' && def.type !== 'timer' && (!def.steps?.length && !def.formFields?.length))}
                  title={def.name}
                >
                  <span className="text-sm sm:text-base font-bold mb-0.5">{getActionInitials(def.name)}</span>
                  <span className="truncate w-full block">{def.name}</span>
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs managed by this widget */}
      <AdvancedActionsDialog
        isOpen={dialogs.isAdvancedActionsDialogOpen}
        onClose={dialogs.closeAdvancedActionsDialog}
        spaceId={spaceId}
        actionDefinitions={actionDefinitions || []}
        isLoadingActionDefinitions={isLoadingActionDefinitions}
        createActionDefinitionUseCase={actionsDataHook.createActionDefinitionUseCase}
        updateActionDefinitionUseCase={actionsDataHook.updateActionDefinitionUseCase}
        deleteActionDefinitionUseCase={actionsDataHook.deleteActionDefinitionUseCase}
        addActionDefinition={actionsDataHook.addActionDefinitionInState}
        updateActionDefinitionInState={actionsDataHook.updateActionDefinitionInState}
        removeActionDefinitionFromState={actionsDataHook.removeActionDefinitionFromState}
        onActionDefinitionsChanged={actionsDataHook.refreshActionDefinitions}
        onLogAction={onLogAction}
        onLogDataEntry={onLogDataEntry}
      />

      {dialogs.currentMultiStepAction && dialogs.isMultiStepDialogOpen && (
        <MultiStepActionDialog
          actionDefinition={dialogs.currentMultiStepAction}
          isOpen={dialogs.isMultiStepDialogOpen}
          onClose={dialogs.closeMultiStepDialog}
          onLogAction={onLogAction} // Log step completion
          onLogDataEntry={handleLogDataEntryWithAnimation} // Log data entry within a step
        />
      )}

      {dialogs.currentDataEntryAction && dialogs.isDataEntryDialogOpen && (
        <DataEntryFormDialog
          actionDefinition={dialogs.currentDataEntryAction}
          isOpen={dialogs.isDataEntryDialogOpen}
          onClose={dialogs.closeDataEntryDialog}
          onSubmitLog={async (data: Omit<LogDataEntryInputDTO, 'spaceId'>) => {
            await handleLogDataEntryWithAnimation(data); // Use animated logger
            dialogs.closeDataEntryDialog();
          }}
        />
      )}
       {dialogs.currentTimerAction && dialogs.isTimerActionDialogOpen && (
        <TimerActionDialog
          actionDefinition={dialogs.currentTimerAction}
          isOpen={dialogs.isTimerActionDialogOpen}
          onClose={dialogs.closeTimerActionDialog}
          onLogAction={async (actionDefId, notes, durationMs) => {
            await handleBaseLogActionWithAnimation(actionDefId, undefined, undefined, notes, durationMs); // Use animated logger
            dialogs.closeTimerActionDialog();
          }}
        />
      )}
    </>
  );
}
    