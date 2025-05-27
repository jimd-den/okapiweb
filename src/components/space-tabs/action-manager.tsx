
"use client";

import React, { useState, useCallback } from 'react'; // Added React import
import { Button } from '@/components/ui/button';
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
// CardHeader, CardTitle, CardContent, CardDescription are no longer used here as it's embedded

interface ActionManagerProps {
  isOpen: boolean; // Controlled from parent
  onClose: () => void; // Controlled from parent
  spaceId: string;
  actionDefinitions: ActionDefinition[];
  isLoadingActionDefinitions: boolean;
  isLoggingAction: boolean; // Overall logging state from parent for quick actions
  onLogAction: (actionDefinitionId: string, completedStepId?: string, stepOutcome?: 'completed' | 'skipped') => Promise<void>;
  onLogDataEntry: (data: LogDataEntryInputDTO) => Promise<void>;
  createActionDefinitionUseCase: CreateActionDefinitionUseCase;
  updateActionDefinitionUseCase: UpdateActionDefinitionUseCase;
  deleteActionDefinitionUseCase: DeleteActionDefinitionUseCase;
  logDataEntryUseCase: LogDataEntryUseCase;
  addActionDefinition: (newDefinition: ActionDefinition) => void;
  updateActionDefinitionInState: (updatedDefinition: ActionDefinition) => void;
  removeActionDefinitionFromState: (definitionId: string) => void;
  onActionDefinitionsChanged: () => void; 
}

export function ActionManager({
  isOpen,
  onClose,
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
    } else {
      console.warn("ActionManager: addActionDefinition prop is not a function.");
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
    } else {
        console.warn("ActionManager: updateActionDefinitionInState prop is not a function.");
    }
    closeEditDialogInternal();
    onActionDefinitionsChanged();
  }, [updateActionDefinitionInState, closeEditDialogInternal, onActionDefinitionsChanged]);

  const handleActionDefinitionDeletedAndClose = useCallback((deletedId: string) => {
    if (typeof removeActionDefinitionFromState === 'function') {
      removeActionDefinitionFromState(deletedId);
    } else {
        console.warn("ActionManager: removeActionDefinitionFromState prop is not a function.");
    }
    closeEditDialogInternal(); 
    onActionDefinitionsChanged();
  }, [removeActionDefinitionFromState, closeEditDialogInternal, onActionDefinitionsChanged]);

  // If this component is meant to be inside a modal, it will not use its own DialogTrigger for itself.
  // The parent (SpaceDashboardPage) will control its visibility via isOpen/onClose.

  if (!isOpen) return null; // Render nothing if not open (controlled by parent)

  return (
    <>
      {/* Content of the Action Manager, typically rendered inside a Dialog in SpaceDashboardPage */}
      <div className="flex flex-row justify-between items-center mb-4">
        {/* Title is now part of the DialogHeader in parent */}
        <Button size="lg" variant="outline" className="text-md" onClick={openCreateDialogInternal}>
          <PlusCircle className="mr-2 h-5 w-5" />
          Add New Action
        </Button>
      </div>
      
      {isLoadingActionDefinitions ? (
        <div className="flex justify-center items-center py-10"> 
          <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" /> Loading Actions...
        </div>
      ) : actionDefinitions.length === 0 ? (
        <div className="flex justify-center items-center py-10"> 
          <p className="text-muted-foreground text-center">No actions defined. Click 'Add New Action' to start.</p>
        </div>
      ) : (
        <div className="space-y-4"> 
          {actionDefinitions.map(def => (
            <ActionDefinitionItem
              key={def.id}
              actionDefinition={def}
              onLogSingleAction={handleSingleActionLog}
              onOpenMultiStepDialog={handleOpenMultiStepDialogInternal}
              onOpenDataEntryDialog={handleOpenDataEntryDialogInternal}
              onEditActionDefinition={handleOpenEditDialogInternal}
              isLoggingAction={isLoggingAction} // Use overall logging state for disabling
              isNewlyAdded={def.id === newlyAddedActionId}
            />
          ))}
        </div>
      )}

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
    </>
  );
}
