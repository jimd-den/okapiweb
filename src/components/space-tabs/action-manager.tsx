
// src/components/space-tabs/action-manager.tsx
"use client";

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import type { ActionDefinition } from '@/domain/entities';
import { 
  CreateActionDefinitionDialog, 
  MultiStepActionDialog, 
  DataEntryFormDialog, 
  EditActionDefinitionDialog 
} from '@/components/dialogs';
import { ActionDefinitionItem } from './action-definition-item'; 
import { Loader2, PlusCircle } from 'lucide-react';
import type { LogDataEntryInputDTO } from '@/application/use-cases';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDialogState } from '@/hooks';

import type { CreateActionDefinitionUseCase, UpdateActionDefinitionUseCase, DeleteActionDefinitionUseCase } from '@/application/use-cases';

interface ActionManagerProps {
  spaceId: string;
  actionDefinitions: ActionDefinition[];
  isLoadingActionDefinitions: boolean;
  isLoggingAction: boolean; 
  onLogAction: (actionDefinitionId: string, completedStepId?: string, stepOutcome?: 'completed' | 'skipped', notes?: string, durationMs?: number) => Promise<void>;
  onLogDataEntry: (data: Omit<LogDataEntryInputDTO, 'spaceId'>) => Promise<void>;
  
  createActionDefinitionUseCase: CreateActionDefinitionUseCase;
  updateActionDefinitionUseCase: UpdateActionDefinitionUseCase;
  deleteActionDefinitionUseCase: DeleteActionDefinitionUseCase;
  
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
    openDialog: openMultiStepDialogInternal, 
    closeDialog: closeMultiStepDialog 
  } = useDialogState();
  const { 
    isOpen: isDataEntryDialogOpen, 
    openDialog: openDataEntryDialogInternal, 
    closeDialog: closeDataEntryDialog 
  } = useDialogState();
  
  const [currentMultiStepAction, setCurrentMultiStepAction] = useState<ActionDefinition | null>(null);
  const [currentDataEntryAction, setCurrentDataEntryAction] = useState<ActionDefinition | null>(null);
  const [actionDefinitionToEdit, setActionDefinitionToEdit] = useState<ActionDefinition | null>(null);
  const [newlyAddedActionId, setNewlyAddedActionId] = useState<string | null>(null);

  const handleActionDefinitionCreatedAndClose = useCallback((newDef: ActionDefinition) => {
    addActionDefinition(newDef);
    setNewlyAddedActionId(newDef.id);
    setTimeout(() => setNewlyAddedActionId(null), 1000); 
    closeCreateDialog();
    onActionDefinitionsChanged();
  }, [addActionDefinition, closeCreateDialog, onActionDefinitionsChanged]);

  const handleOpenMultiStepDialog = useCallback((actionDef: ActionDefinition) => {
    if (actionDef.steps && actionDef.steps.length > 0) {
      setCurrentMultiStepAction(actionDef);
      openMultiStepDialogInternal();
    }
  }, [openMultiStepDialogInternal]);

  const handleOpenDataEntryDialog = useCallback((actionDef: ActionDefinition) => {
    if (actionDef.formFields && actionDef.formFields.length > 0) {
      setCurrentDataEntryAction(actionDef);
      openDataEntryDialogInternal();
    }
  }, [openDataEntryDialogInternal]);

  const handleSubmitDataEntryLog = useCallback(async (data: Omit<LogDataEntryInputDTO, 'spaceId'>) => {
    try {
      await onLogDataEntry(data);
      closeDataEntryDialog(); 
    } catch (error) {
      console.error("Error during data entry submission in ActionManager:", error);
      throw error; 
    }
  }, [onLogDataEntry, closeDataEntryDialog]);

  // Wrapper function to adapt the signature for DataEntryFormDialog
  const handleDataEntryFormSubmit = useCallback(async (formData: Record<string, any>, existingEntryId?: string) => {
    if (!currentDataEntryAction) return;
    
    const logData: Omit<LogDataEntryInputDTO, 'spaceId'> = {
      actionDefinitionId: currentDataEntryAction.id,
      formData: formData,
      // Note: stepId is optional and not used for top-level data-entry actions
    };
    
    await handleSubmitDataEntryLog(logData);
  }, [currentDataEntryAction, handleSubmitDataEntryLog]);

  const handleOpenEditDialog = useCallback((actionDef: ActionDefinition) => {
    setActionDefinitionToEdit(actionDef);
    openEditDialog();
  }, [openEditDialog]);
  
  const handleActionDefinitionUpdatedAndClose = useCallback((updatedDef: ActionDefinition) => {
    updateActionDefinitionInState(updatedDef);
    closeEditDialog();
    onActionDefinitionsChanged();
  }, [updateActionDefinitionInState, closeEditDialog, onActionDefinitionsChanged]);

  const handleActionDefinitionDeletedAndClose = useCallback((deletedId: string) => {
    removeActionDefinitionFromState(deletedId);
    closeEditDialog(); 
    onActionDefinitionsChanged();
  }, [removeActionDefinitionFromState, closeEditDialog, onActionDefinitionsChanged]);

  return (
    <div className="h-full flex flex-col"> 
      <div className="flex flex-row justify-end items-center mb-2 shrink-0">
        <Button size="sm" variant="outline" className="text-xs" onClick={openCreateDialog}>
          <PlusCircle className="mr-1.5 h-4 w-4" /> Add New Action Definition
        </Button>
      </div>
      
      <ScrollArea className="flex-1 pr-1">
        {isLoadingActionDefinitions ? (
          <div className="flex justify-center items-center py-6"> 
            <Loader2 className="mr-2 h-6 w-6 animate-spin text-primary" /> Loading Action Definitions...
          </div>
        ) : actionDefinitions.length === 0 ? (
          <div className="flex justify-center items-center py-6"> 
            <p className="text-muted-foreground text-center text-sm">No action definitions. Click 'Add New' to start.</p>
          </div>
        ) : (
          <div className="space-y-2"> 
            {actionDefinitions.map(def => (
              <ActionDefinitionItem
                key={def.id}
                actionDefinition={def}
                onLogSingleAction={onLogAction} 
                onOpenMultiStepDialog={handleOpenMultiStepDialog}
                onOpenDataEntryDialog={handleOpenDataEntryDialog}
                onEditActionDefinition={handleOpenEditDialog}
                isLoggingAction={isLoggingAction} 
                isNewlyAdded={def.id === newlyAddedActionId}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {isCreateDialogOpen && (
        <CreateActionDefinitionDialog
          isOpen={isCreateDialogOpen}
          onClose={closeCreateDialog}
          spaceId={spaceId}
          onActionDefinitionCreated={handleActionDefinitionCreatedAndClose}
          createActionDefinitionUseCase={createActionDefinitionUseCase}
        />
      )}

      {currentMultiStepAction && isMultiStepDialogOpen && (
        <MultiStepActionDialog
          actionDefinition={currentMultiStepAction}
          isOpen={isMultiStepDialogOpen}
          onClose={closeMultiStepDialog}
          onLogAction={onLogAction}
          onLogDataEntry={onLogDataEntry} 
        />
      )}

      {currentDataEntryAction && isDataEntryDialogOpen && (
        <DataEntryFormDialog
          formFields={currentDataEntryAction.formFields || []}
          dialogTitle={currentDataEntryAction.name}
          dialogDescription={currentDataEntryAction.description}
          isOpen={isDataEntryDialogOpen}
          onClose={closeDataEntryDialog}
          onSubmitLog={handleDataEntryFormSubmit}
        />
      )}

      {actionDefinitionToEdit && isEditDialogOpen && (
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
    </div>
  );
}
