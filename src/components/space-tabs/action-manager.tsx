// src/components/space-tabs/action-manager.tsx
"use client";

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ActionDefinition } from '@/domain/entities/action-definition.entity';
import type { CreateActionDefinitionUseCase } from '@/application/use-cases/action-definition/create-action-definition.usecase';
import { CreateActionDefinitionDialog } from '@/components/dialogs/create-action-definition-dialog';
import { MultiStepActionDialog } from '@/components/dialogs/multi-step-action-dialog';
import { DataEntryFormDialog } from '@/components/dialogs/data-entry-form-dialog';
import { ActionDefinitionItem } from './action-definition-item';
import { Loader2, PlusCircle } from 'lucide-react';
import type { UpdateActionDefinitionUseCase } from '@/application/use-cases/action-definition/update-action-definition.usecase';
import type { DeleteActionDefinitionUseCase } from '@/application/use-cases/action-definition/delete-action-definition.usecase';
import { EditActionDefinitionDialog } from '@/components/dialogs/edit-action-definition-dialog';
import type { LogDataEntryUseCase, LogDataEntryInputDTO } from '@/application/use-cases/data-entry/log-data-entry.usecase';
import { useDialogState } from '@/hooks/use-dialog-state';

interface ActionManagerProps {
  spaceId: string;
  actionDefinitions: ActionDefinition[];
  isLoadingActionDefinitions: boolean;
  isLoggingAction: boolean;
  onLogAction: (actionDefinitionId: string, stepId?: string, stepOutcome?: 'completed' | 'skipped') => Promise<void>;
  onLogDataEntry: (data: LogDataEntryInputDTO) => Promise<void>;
  createActionDefinitionUseCase: CreateActionDefinitionUseCase;
  updateActionDefinitionUseCase: UpdateActionDefinitionUseCase;
  deleteActionDefinitionUseCase: DeleteActionDefinitionUseCase;
  logDataEntryUseCase: LogDataEntryUseCase; // Added for data entry
  addActionDefinition: (newDefinition: ActionDefinition) => void;
  updateActionDefinitionInState: (updatedDefinition: ActionDefinition) => void;
  removeActionDefinitionFromState: (definitionId: string) => void;
  onActionDefinitionsChanged: () => void; 
}

export function ActionManager({
  spaceId,
  actionDefinitions,
  isLoadingActionDefinitions,
  isLoggingAction,
  onLogAction,
  onLogDataEntry,
  createActionDefinitionUseCase,
  updateActionDefinitionUseCase,
  deleteActionDefinitionUseCase,
  logDataEntryUseCase,
  addActionDefinition,
  updateActionDefinitionInState,
  removeActionDefinitionFromState,
  onActionDefinitionsChanged,
}: ActionManagerProps) {
  const { 
    isOpen: isCreateDialogOpen, 
    openDialog: openCreateDialog, 
    closeDialog: closeCreateDialog 
  } = useDialogState();
  const { 
    isOpen: isEditDialogOpen, 
    openDialog: openEditDialog, 
    closeDialog: closeEditDialog 
  } = useDialogState();
  const { 
    isOpen: isMultiStepDialogOpen, 
    openDialog: openMultiStepDialog, 
    closeDialog: closeMultiStepDialog 
  } = useDialogState();
  const { 
    isOpen: isDataEntryDialogOpen, 
    openDialog: openDataEntryDialog, 
    closeDialog: closeDataEntryDialog 
  } = useDialogState();
  
  const [currentMultiStepAction, setCurrentMultiStepAction] = useState<ActionDefinition | null>(null);
  const [currentDataEntryAction, setCurrentDataEntryAction] = useState<ActionDefinition | null>(null);
  const [actionDefinitionToEdit, setActionDefinitionToEdit] = useState<ActionDefinition | null>(null);
  const [newlyAddedActionId, setNewlyAddedActionId] = useState<string | null>(null);

  const handleActionDefinitionCreatedAndClose = useCallback((newDef: ActionDefinition) => {
    if (typeof addActionDefinition === 'function') {
      addActionDefinition(newDef);
    } else {
      console.warn("ActionManager: addActionDefinition prop is not a function.");
    }
    setNewlyAddedActionId(newDef.id);
    setTimeout(() => setNewlyAddedActionId(null), 1000); 
    closeCreateDialog();
    onActionDefinitionsChanged();
  }, [addActionDefinition, closeCreateDialog, onActionDefinitionsChanged]);

  const handleOpenMultiStepDialogInternal = useCallback((actionDef: ActionDefinition) => {
    if (actionDef.steps && actionDef.steps.length > 0) {
      setCurrentMultiStepAction(actionDef);
      openMultiStepDialog();
    }
  }, [openMultiStepDialog]);

  const handleOpenDataEntryDialogInternal = useCallback((actionDef: ActionDefinition) => {
    if (actionDef.formFields && actionDef.formFields.length > 0) {
      setCurrentDataEntryAction(actionDef);
      openDataEntryDialog();
    }
  }, [openDataEntryDialog]);

  const handleSubmitDataEntryLog = useCallback(async (data: LogDataEntryInputDTO) => {
    try {
      await onLogDataEntry(data);
      closeDataEntryDialog(); 
    } catch (error) {
      console.error("Error during data entry submission in ActionManager:", error);
      throw error; 
    }
  }, [onLogDataEntry, closeDataEntryDialog]);

  const handleSingleActionLog = useCallback((actionDefinitionId: string) => {
    onLogAction(actionDefinitionId);
  }, [onLogAction]);

  const handleOpenEditDialogInternal = useCallback((actionDef: ActionDefinition) => {
    setActionDefinitionToEdit(actionDef);
    openEditDialog();
  }, [openEditDialog]);
  
  const handleActionDefinitionUpdatedAndClose = useCallback((updatedDef: ActionDefinition) => {
    if (typeof updateActionDefinitionInState === 'function') {
       updateActionDefinitionInState(updatedDef);
    } else {
        console.warn("ActionManager: updateActionDefinitionInState prop is not a function.");
    }
    closeEditDialog();
    onActionDefinitionsChanged();
  }, [updateActionDefinitionInState, closeEditDialog, onActionDefinitionsChanged]);

  const handleActionDefinitionDeletedAndClose = useCallback((deletedId: string) => {
    if (typeof removeActionDefinitionFromState === 'function') {
      removeActionDefinitionFromState(deletedId);
    } else {
        console.warn("ActionManager: removeActionDefinitionFromState prop is not a function.");
    }
    closeEditDialog(); 
    onActionDefinitionsChanged();
  }, [removeActionDefinitionFromState, closeEditDialog, onActionDefinitionsChanged]);


  return (
    <>
      <Card className="shadow-lg h-full flex flex-col">
        <CardHeader className="flex flex-row justify-between items-center shrink-0">
          <CardTitle className="text-xl">Available Actions</CardTitle>
          <Button size="lg" variant="outline" className="text-md" onClick={openCreateDialog}>
            <PlusCircle className="mr-2 h-5 w-5" />
            Add New Action
          </Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0 sm:p-4">
          {isLoadingActionDefinitions ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" /> Loading Actions...
            </div>
          ) : actionDefinitions.length === 0 ? (
            <div className="flex justify-center items-center h-full">
              <p className="text-muted-foreground text-center py-4">No actions defined. Click 'Add New Action' to start.</p>
            </div>
          ) : (
            <ScrollArea className="h-full pr-3"> 
              <div className="space-y-4">
                {actionDefinitions.map(def => (
                  <ActionDefinitionItem
                    key={def.id}
                    actionDefinition={def}
                    onLogSingleAction={handleSingleActionLog}
                    onOpenMultiStepDialog={handleOpenMultiStepDialogInternal}
                    onOpenDataEntryDialog={handleOpenDataEntryDialogInternal}
                    onEditActionDefinition={handleOpenEditDialogInternal}
                    isLoggingAction={isLoggingAction}
                    isNewlyAdded={def.id === newlyAddedActionId}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <CreateActionDefinitionDialog
        isOpen={isCreateDialogOpen}
        onClose={closeCreateDialog}
        spaceId={spaceId}
        onActionDefinitionCreated={handleActionDefinitionCreatedAndClose}
        createActionDefinitionUseCase={createActionDefinitionUseCase}
      />

      {currentMultiStepAction && (
        <MultiStepActionDialog
          actionDefinition={currentMultiStepAction}
          isOpen={isMultiStepDialogOpen}
          onClose={closeMultiStepDialog}
          onLogAction={onLogAction}
        />
      )}

      {currentDataEntryAction && (
        <DataEntryFormDialog
          actionDefinition={currentDataEntryAction}
          isOpen={isDataEntryDialogOpen}
          onClose={closeDataEntryDialog}
          onSubmitLog={handleSubmitDataEntryLog}
        />
      )}

      {actionDefinitionToEdit && (
        <EditActionDefinitionDialog
          isOpen={isEditDialogOpen}
          onClose={closeEditDialog}
          actionDefinition={actionDefinitionToEdit}
          updateActionDefinitionUseCase={updateActionDefinitionUseCase}
          deleteActionDefinitionUseCase={deleteActionDefinitionUseCase}
          onActionDefinitionUpdated={handleActionDefinitionUpdatedAndClose}
          onActionDefinitionDeleted={handleActionDefinitionDeletedAndClose}
        />
      )}
    </>
  );
}
