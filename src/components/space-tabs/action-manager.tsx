// src/components/space-tabs/action-manager.tsx
"use client";

import { useState, useCallback } from 'react'; // Added useCallback
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ActionDefinition } from '@/domain/entities/action-definition.entity';
import type { CreateActionDefinitionUseCase, CreateActionDefinitionInputDTO } from '@/application/use-cases/action-definition/create-action-definition.usecase';
import { CreateActionDefinitionDialog } from '@/components/dialogs/create-action-definition-dialog';
import { MultiStepActionDialog } from '@/components/dialogs/multi-step-action-dialog';
import { DataEntryFormDialog } from '@/components/dialogs/data-entry-form-dialog';
import { ActionDefinitionItem } from './action-definition-item';
import { Loader2 } from 'lucide-react';
import type { UpdateActionDefinitionUseCase, UpdateActionDefinitionInputDTO } from '@/application/use-cases/action-definition/update-action-definition.usecase';
import type { DeleteActionDefinitionUseCase } from '@/application/use-cases/action-definition/delete-action-definition.usecase';
import { EditActionDefinitionDialog } from '@/components/dialogs/edit-action-definition-dialog';
import type { LogDataEntryUseCase, LogDataEntryInputDTO } from '@/application/use-cases/data-entry/log-data-entry.usecase';

interface ActionManagerProps {
  spaceId: string;
  actionDefinitions: ActionDefinition[];
  isLoadingActionDefinitions: boolean;
  isLoggingAction: boolean;
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
  logDataEntryUseCase,
}: ActionManagerProps) {
  const [isMultiStepDialogOpen, setIsMultiStepDialogOpen] = useState(false);
  const [currentMultiStepAction, setCurrentMultiStepAction] = useState<ActionDefinition | null>(null);

  const [isDataEntryDialogOpen, setIsDataEntryDialogOpen] = useState(false);
  const [currentDataEntryAction, setCurrentDataEntryAction] = useState<ActionDefinition | null>(null);

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
                  isLoggingAction={isLoggingAction}
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
          onLogAction={onLogAction}
          isSubmitting={isLoggingAction}
        />
      )}

      {currentDataEntryAction && (
        <DataEntryFormDialog
          actionDefinition={currentDataEntryAction}
          isOpen={isDataEntryDialogOpen}
          onClose={handleCloseDataEntryDialog}
          onSubmitLog={onLogDataEntry}
          isSubmitting={isLoggingAction}
        />
      )}

      {actionDefinitionToEdit && (
        <EditActionDefinitionDialog
          actionDefinition={actionDefinitionToEdit}
          isOpen={isEditActionDefinitionDialogOpen}
          onClose={handleCloseEditActionDefinitionDialog}
          updateActionDefinitionUseCase={updateActionDefinitionUseCase}
          deleteActionDefinitionUseCase={deleteActionDefinitionUseCase}
          onActionDefinitionUpdated={onActionDefinitionUpdated}
          onActionDefinitionDeleted={onActionDefinitionDeleted}
        />
      )}
    </>
  );
}
