
"use client";

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import type { ActionDefinition } from '@/domain/entities/action-definition.entity';
import type { CreateActionDefinitionUseCase, CreateActionDefinitionInputDTO } from '@/application/use-cases/action-definition/create-action-definition.usecase';
import { CreateActionDefinitionDialog } from '@/components/dialogs/create-action-definition-dialog';
import { MultiStepActionDialog } from '@/components/dialogs/multi-step-action-dialog';
import { DataEntryFormDialog } from '@/components/dialogs/data-entry-form-dialog';
import { ActionDefinitionItem } from './action-definition-item'; 
import { Loader2, PlusCircle } from 'lucide-react';
import type { UpdateActionDefinitionUseCase } from '@/application/use-cases/action-definition/update-action-definition.usecase';
import type { DeleteActionDefinitionUseCase } from '@/application/use-cases/action-definition/delete-action-definition.usecase';
import { EditActionDefinitionDialog } from '@/components/dialogs/edit-action-definition-dialog';
import type { LogDataEntryInputDTO } from '@/application/use-cases/data-entry/log-data-entry.usecase';
import { useDialogState } from '@/hooks/use-dialog-state';
import { ScrollArea } from '@/components/ui/scroll-area'; // Added ScrollArea

interface ActionManagerProps {
  // isOpen and onClose are removed as this is now embedded or part of a modal controlled by parent
  spaceId: string;
  actionDefinitions: ActionDefinition[];
  isLoadingActionDefinitions: boolean;
  isLoggingAction: boolean; 
  onLogAction: (actionDefinitionId: string, completedStepId?: string, stepOutcome?: 'completed' | 'skipped') => Promise<void>;
  onLogDataEntry: (data: LogDataEntryInputDTO) => Promise<void>;
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
    openDialog: openCreateDialogInternal, 
    closeDialog: closeCreateDialogInternal 
  } = useDialogState();
  const { 
    isOpen: isEditDialogOpen, 
    openDialog: openEditDialogInternal, 
    closeDialog: closeEditDialogInternal 
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
    }
    setNewlyAddedActionId(newDef.id);
    setTimeout(() => setNewlyAddedActionId(null), 1000); 
    closeCreateDialogInternal();
    onActionDefinitionsChanged();
  }, [addActionDefinition, closeCreateDialogInternal, onActionDefinitionsChanged]);

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
    openEditDialogInternal();
  }, [openEditDialogInternal]);
  
  const handleActionDefinitionUpdatedAndClose = useCallback((updatedDef: ActionDefinition) => {
    if (typeof updateActionDefinitionInState === 'function') {
       updateActionDefinitionInState(updatedDef);
    }
    closeEditDialogInternal();
    onActionDefinitionsChanged();
  }, [updateActionDefinitionInState, closeEditDialogInternal, onActionDefinitionsChanged]);

  const handleActionDefinitionDeletedAndClose = useCallback((deletedId: string) => {
    if (typeof removeActionDefinitionFromState === 'function') {
      removeActionDefinitionFromState(deletedId);
    }
    closeEditDialogInternal(); 
    onActionDefinitionsChanged();
  }, [removeActionDefinitionFromState, closeEditDialogInternal, onActionDefinitionsChanged]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-row justify-end items-center mb-3 shrink-0">
        <Button size="sm" variant="outline" className="text-xs" onClick={openCreateDialogInternal}>
          <PlusCircle className="mr-1.5 h-4 w-4" /> Add New Action Definition
        </Button>
      </div>
      
      <ScrollArea className="flex-1 pr-1"> {/* Added pr-1 for scrollbar space */}
        {isLoadingActionDefinitions ? (
          <div className="flex justify-center items-center py-6"> 
            <Loader2 className="mr-2 h-6 w-6 animate-spin text-primary" /> Loading Action Definitions...
          </div>
        ) : actionDefinitions.length === 0 ? (
          <div className="flex justify-center items-center py-6"> 
            <p className="text-muted-foreground text-center text-sm">No action definitions. Click 'Add New' to start.</p>
          </div>
        ) : (
          <div className="space-y-2.5"> 
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
        )}
      </ScrollArea>

      <CreateActionDefinitionDialog
        isOpen={isCreateDialogOpen}
        onClose={closeCreateDialogInternal}
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
          onClose={closeEditDialogInternal}
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
