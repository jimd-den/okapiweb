// src/components/space-tabs/action-manager.tsx
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ActionDefinition } from '@/domain/entities/action-definition.entity';
import type { CreateActionDefinitionUseCase, CreateActionDefinitionInputDTO } from '@/application/use-cases/action-definition/create-action-definition.usecase';
import { CreateActionDefinitionDialog } from '@/components/create-action-definition-dialog';
import { MultiStepActionDialog } from '@/components/dialogs/multi-step-action-dialog';
import { DataEntryFormDialog } from '@/components/dialogs/data-entry-form-dialog'; // New Dialog
import { ActionDefinitionItem } from './action-definition-item'; 
import { Loader2 } from 'lucide-react';
import type { UpdateActionDefinitionUseCase, UpdateActionDefinitionInputDTO } from '@/application/use-cases/action-definition/update-action-definition.usecase';
import type { DeleteActionDefinitionUseCase } from '@/application/use-cases/action-definition/delete-action-definition.usecase';
import { EditActionDefinitionDialog } from '@/components/dialogs/edit-action-definition-dialog';
import type { LogDataEntryUseCase, LogDataEntryInputDTO } from '@/application/use-cases/data-entry/log-data-entry.usecase'; // For data entry

interface ActionManagerProps {
  spaceId: string;
  actionDefinitions: ActionDefinition[];
  isLoadingActionDefinitions: boolean; 
  isLoggingAction: boolean; // General logging state
  onLogAction: (actionDefinitionId: string, stepId?: string, stepOutcome?: 'completed' | 'skipped') => Promise<void>; // For single/multi-step
  onLogDataEntry: (data: LogDataEntryInputDTO) => Promise<void>; // New for data entry
  onActionDefinitionCreated: (newDefinition: ActionDefinition) => void;
  onActionDefinitionUpdated: (updatedDefinition: ActionDefinition) => void;
  onActionDefinitionDeleted: (deletedDefinitionId: string) => void;
  createActionDefinitionUseCase: CreateActionDefinitionUseCase;
  updateActionDefinitionUseCase: UpdateActionDefinitionUseCase;
  deleteActionDefinitionUseCase: DeleteActionDefinitionUseCase;
  logDataEntryUseCase: LogDataEntryUseCase; // Added
}

export function ActionManager({
  spaceId,
  actionDefinitions,
  isLoadingActionDefinitions,
  isLoggingAction,
  onLogAction,
  onLogDataEntry, // Added
  onActionDefinitionCreated,
  onActionDefinitionUpdated,
  onActionDefinitionDeleted,
  createActionDefinitionUseCase,
  updateActionDefinitionUseCase,
  deleteActionDefinitionUseCase,
  logDataEntryUseCase, // Added
}: ActionManagerProps) {
  const [isMultiStepDialogOpen, setIsMultiStepDialogOpen] = useState(false);
  const [currentMultiStepAction, setCurrentMultiStepAction] = useState<ActionDefinition | null>(null);
  
  const [isDataEntryDialogOpen, setIsDataEntryDialogOpen] = useState(false); // For data entry
  const [currentDataEntryAction, setCurrentDataEntryAction] = useState<ActionDefinition | null>(null); // For data entry

  const [isEditActionDefinitionDialogOpen, setIsEditActionDefinitionDialogOpen] = useState(false);
  const [actionDefinitionToEdit, setActionDefinitionToEdit] = useState<ActionDefinition | null>(null);

  const executeCreateActionDefinition = async (data: CreateActionDefinitionInputDTO): Promise<ActionDefinition> => {
    return createActionDefinitionUseCase.execute(data);
  };

  const executeUpdateActionDefinition = async (data: UpdateActionDefinitionInputDTO): Promise<ActionDefinition> => {
    const updatedDef = await updateActionDefinitionUseCase.execute(data);
    onActionDefinitionUpdated(updatedDef);
    return updatedDef;
  };

  const executeDeleteActionDefinition = async (id: string): Promise<void> => {
    await deleteActionDefinitionUseCase.execute(id);
    onActionDefinitionDeleted(id);
  };

  const handleOpenMultiStepDialog = (actionDef: ActionDefinition) => {
    if (actionDef.steps && actionDef.steps.length > 0) {
      setCurrentMultiStepAction(actionDef);
      setIsMultiStepDialogOpen(true);
    }
  };

  const handleCloseMultiStepDialog = () => {
    setIsMultiStepDialogOpen(false);
    setCurrentMultiStepAction(null);
  };

  const handleOpenDataEntryDialog = (actionDef: ActionDefinition) => {
    if (actionDef.formFields && actionDef.formFields.length > 0) {
      setCurrentDataEntryAction(actionDef);
      setIsDataEntryDialogOpen(true);
    }
  };

  const handleCloseDataEntryDialog = () => {
    setIsDataEntryDialogOpen(false);
    setCurrentDataEntryAction(null);
  };

  const handleSingleActionLog = (actionDefinitionId: string) => {
    onLogAction(actionDefinitionId); 
  };

  const handleOpenEditActionDefinitionDialog = (actionDef: ActionDefinition) => {
    setActionDefinitionToEdit(actionDef);
    setIsEditActionDefinitionDialogOpen(true);
  };

  const handleCloseEditActionDefinitionDialog = () => {
    setIsEditActionDefinitionDialogOpen(false);
    setActionDefinitionToEdit(null);
  };

  return (
    <>
      <Card className="mt-4 shadow-lg">
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle className="text-xl">Log Actions</CardTitle>
          <CreateActionDefinitionDialog
            spaceId={spaceId}
            onActionDefinitionCreated={onActionDefinitionCreated} 
            createActionDefinition={executeCreateActionDefinition}
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
                  onOpenDataEntryDialog={handleOpenDataEntryDialog} // Pass handler
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
          onLogAction={onLogAction} // For steps
          isSubmitting={isLoggingAction}
        />
      )}

      {currentDataEntryAction && (
        <DataEntryFormDialog
          actionDefinition={currentDataEntryAction}
          isOpen={isDataEntryDialogOpen}
          onClose={handleCloseDataEntryDialog}
          onSubmitLog={onLogDataEntry} // For form data
          isSubmitting={isLoggingAction}
        />
      )}

      {actionDefinitionToEdit && (
        <EditActionDefinitionDialog
          actionDefinition={actionDefinitionToEdit}
          isOpen={isEditActionDefinitionDialogOpen}
          onClose={handleCloseEditActionDefinitionDialog}
          updateActionDefinition={executeUpdateActionDefinition}
          deleteActionDefinition={executeDeleteActionDefinition}
        />
      )}
    </>
  );
}
