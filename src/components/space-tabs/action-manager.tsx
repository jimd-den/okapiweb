
// src/components/space-tabs/action-manager.tsx
"use client";

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ActionDefinition } from '@/domain/entities/action-definition.entity';
import type { CreateActionDefinitionUseCase } from '@/application/use-cases/action-definition/create-action-definition.usecase';
import { CreateActionDefinitionDialog } from '@/components/dialogs/create-action-definition-dialog';
import { MultiStepActionDialog } from '@/components/dialogs/multi-step-action-dialog';
import { DataEntryFormDialog } from '@/components/dialogs/data-entry-form-dialog';
import { ActionDefinitionItem } from './action-definition-item';
import { Loader2 } from 'lucide-react';
import type { UpdateActionDefinitionUseCase } from '@/application/use-cases/action-definition/update-action-definition.usecase';
import type { DeleteActionDefinitionUseCase } from '@/application/use-cases/action-definition/delete-action-definition.usecase';
import { EditActionDefinitionDialog } from '@/components/dialogs/edit-action-definition-dialog';
import type { LogDataEntryUseCase, LogDataEntryInputDTO } from '@/application/use-cases/data-entry/log-data-entry.usecase';

interface ActionManagerProps {
  spaceId: string;
  actionDefinitions: ActionDefinition[];
  isLoadingActionDefinitions: boolean;
  isLoggingAction: boolean; // This prop seems specific to direct action logging, not data entry or multi-step
  onLogAction: (actionDefinitionId: string, stepId?: string, stepOutcome?: 'completed' | 'skipped') => Promise<void>;
  onLogDataEntry: (data: LogDataEntryInputDTO) => Promise<void>;
  onActionDefinitionCreated: (newDefinition: ActionDefinition) => void;
  onActionDefinitionUpdated: (updatedDefinition: ActionDefinition) => void;
  onActionDefinitionDeleted: (deletedDefinitionId: string) => void;
  createActionDefinitionUseCase: CreateActionDefinitionUseCase;
  updateActionDefinitionUseCase: UpdateActionDefinitionUseCase;
  deleteActionDefinitionUseCase: DeleteActionDefinitionUseCase;
  logDataEntryUseCase: LogDataEntryUseCase;
}

export function ActionManager({
  spaceId,
  actionDefinitions,
  isLoadingActionDefinitions,
  isLoggingAction,
  onLogAction,
  onLogDataEntry,
  onActionDefinitionCreated,
  onActionDefinitionUpdated,
  onActionDefinitionDeleted,
  createActionDefinitionUseCase,
  updateActionDefinitionUseCase,
  deleteActionDefinitionUseCase,
}: ActionManagerProps) {
  const [isMultiStepDialogOpen, setIsMultiStepDialogOpen] = useState(false);
  const [currentMultiStepAction, setCurrentMultiStepAction] = useState<ActionDefinition | null>(null);

  const [isDataEntryDialogOpen, setIsDataEntryDialogOpen] = useState(false);
  const [currentDataEntryAction, setCurrentDataEntryAction] = useState<ActionDefinition | null>(null);
  const [isSubmittingDataEntry, setIsSubmittingDataEntry] = useState(false); // Specific loading state for data entry

  const [isEditActionDefinitionDialogOpen, setIsEditActionDefinitionDialogOpen] = useState(false);
  const [actionDefinitionToEdit, setActionDefinitionToEdit] = useState<ActionDefinition | null>(null);


  const handleOpenMultiStepDialog = useCallback((actionDef: ActionDefinition) => {
    if (actionDef.steps && actionDef.steps.length > 0) {
      setCurrentMultiStepAction(actionDef);
      setIsMultiStepDialogOpen(true);
    }
  }, []);

  const handleCloseMultiStepDialog = useCallback(() => {
    setIsMultiStepDialogOpen(false);
    setCurrentMultiStepAction(null);
  }, []);

  const handleOpenDataEntryDialog = useCallback((actionDef: ActionDefinition) => {
    if (actionDef.formFields && actionDef.formFields.length > 0) {
      setCurrentDataEntryAction(actionDef);
      setIsDataEntryDialogOpen(true);
    }
  }, []);

  const handleCloseDataEntryDialog = useCallback(() => {
    setIsDataEntryDialogOpen(false);
    setCurrentDataEntryAction(null);
  }, []);

  // Specific submit handler for the data entry form dialog
  const handleSubmitDataEntryLog = useCallback(async (data: LogDataEntryInputDTO) => {
    setIsSubmittingDataEntry(true);
    try {
      await onLogDataEntry(data);
      // Success toast is handled by onLogDataEntry in the parent (SpaceDashboardPage)
    } catch (error) {
      // Error toast is handled by onLogDataEntry in the parent
      console.error("Error during data entry submission in ActionManager:", error);
    } finally {
      setIsSubmittingDataEntry(false);
      // Do not close dialog here if onLogDataEntry handles it or if parent needs to decide
    }
  }, [onLogDataEntry]);


  const handleSingleActionLog = useCallback((actionDefinitionId: string) => {
    onLogAction(actionDefinitionId);
  }, [onLogAction]);

  const handleOpenEditActionDefinitionDialog = useCallback((actionDef: ActionDefinition) => {
    setActionDefinitionToEdit(actionDef);
    setIsEditActionDefinitionDialogOpen(true);
  }, []);

  const handleCloseEditActionDefinitionDialog = useCallback(() => {
    setIsEditActionDefinitionDialogOpen(false);
    setActionDefinitionToEdit(null);
  }, []);
  
  // Ensure these callbacks passed to EditActionDefinitionDialog are stable
  const memoizedOnActionDefinitionUpdated = useCallback((updatedDef: ActionDefinition) => {
    onActionDefinitionUpdated(updatedDef);
  }, [onActionDefinitionUpdated]);

  const memoizedOnActionDefinitionDeleted = useCallback((deletedId: string) => {
    onActionDefinitionDeleted(deletedId);
  }, [onActionDefinitionDeleted]);


  return (
    <>
      <Card className="mt-4 shadow-lg">
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle className="text-xl">Log Actions</CardTitle>
          <CreateActionDefinitionDialog
            spaceId={spaceId}
            onActionDefinitionCreated={onActionDefinitionCreated}
            createActionDefinitionUseCase={createActionDefinitionUseCase}
          />
        </CardHeader>
        <CardContent>
          {isLoadingActionDefinitions ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" /> Loading Actions...
            </div>
          ) : actionDefinitions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No actions defined for this space yet. Click 'Add New Action' to get started.</p>
          ) : (
            <div className="space-y-4">
              {actionDefinitions.map(def => (
                <ActionDefinitionItem
                  key={def.id}
                  actionDefinition={def}
                  onLogSingleAction={handleSingleActionLog}
                  onOpenMultiStepDialog={handleOpenMultiStepDialog}
                  onOpenDataEntryDialog={handleOpenDataEntryDialog}
                  onEditActionDefinition={handleOpenEditActionDefinitionDialog}
                  isLoggingAction={isLoggingAction} // For single action button
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {currentMultiStepAction && (
        <MultiStepActionDialog
          actionDefinition={currentMultiStepAction}
          isOpen={isMultiStepDialogOpen}
          onClose={handleCloseMultiStepDialog}
          onLogAction={onLogAction} // onLogAction from props is already stable if from useActionLogger
          isSubmitting={isLoggingAction} // Use the general isLoggingAction from parent for consistency here
        />
      )}

      {currentDataEntryAction && (
        <DataEntryFormDialog
          actionDefinition={currentDataEntryAction}
          isOpen={isDataEntryDialogOpen}
          onClose={handleCloseDataEntryDialog}
          onSubmitLog={handleSubmitDataEntryLog} // Use the local submit handler
          isSubmitting={isSubmittingDataEntry} // Use specific submitting state for this dialog
        />
      )}

      {actionDefinitionToEdit && (
        <EditActionDefinitionDialog
          actionDefinition={actionDefinitionToEdit}
          isOpen={isEditActionDefinitionDialogOpen}
          onClose={handleCloseEditActionDefinitionDialog}
          updateActionDefinitionUseCase={updateActionDefinitionUseCase}
          deleteActionDefinitionUseCase={deleteActionDefinitionUseCase}
          onActionDefinitionUpdated={memoizedOnActionDefinitionUpdated}
          onActionDefinitionDeleted={memoizedOnActionDefinitionDeleted}
        />
      )}
    </>
  );
}
