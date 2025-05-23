
// src/components/space-tabs/action-manager.tsx
"use client";

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ActionDefinition } from '@/domain/entities/action-definition.entity';
import type { CreateActionDefinitionUseCase, CreateActionDefinitionInputDTO } from '@/application/use-cases/action-definition/create-action-definition.usecase';
import { CreateActionDefinitionDialog } from '@/components/dialogs/create-action-definition-dialog';
import { MultiStepActionDialog } from '@/components/dialogs/multi-step-action-dialog';
import { DataEntryFormDialog } from '@/components/dialogs/data-entry-form-dialog';
import { ActionDefinitionItem } from './action-definition-item';
import { Loader2, PlusCircle } from 'lucide-react';
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
  createActionDefinitionUseCase: CreateActionDefinitionUseCase;
  updateActionDefinitionUseCase: UpdateActionDefinitionUseCase;
  deleteActionDefinitionUseCase: DeleteActionDefinitionUseCase;
  logDataEntryUseCase: LogDataEntryUseCase;
  addActionDefinition: (newDefinition: ActionDefinition) => void;
  updateActionDefinitionInState: (updatedDefinition: ActionDefinition) => void;
  removeActionDefinitionFromState: (definitionId: string) => void;
  onActionDefinitionsChanged: () => void; // Callback when an action definition is created, updated, or deleted
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
  const [isCreateActionDefinitionDialogOpen, setIsCreateActionDefinitionDialogOpen] = useState(false);
  const [isMultiStepDialogOpen, setIsMultiStepDialogOpen] = useState(false);
  const [currentMultiStepAction, setCurrentMultiStepAction] = useState<ActionDefinition | null>(null);
  const [isDataEntryDialogOpen, setIsDataEntryDialogOpen] = useState(false);
  const [currentDataEntryAction, setCurrentDataEntryAction] = useState<ActionDefinition | null>(null);
  const [isSubmittingDataEntry, setIsSubmittingDataEntry] = useState(false);
  const [isEditActionDefinitionDialogOpen, setIsEditActionDefinitionDialogOpen] = useState(false);
  const [actionDefinitionToEdit, setActionDefinitionToEdit] = useState<ActionDefinition | null>(null);
  const [newlyAddedActionId, setNewlyAddedActionId] = useState<string | null>(null);


  const handleOpenCreateActionDefinitionDialog = useCallback(() => {
    setIsCreateActionDefinitionDialogOpen(true);
  }, []);

  const handleCloseCreateActionDefinitionDialog = useCallback(() => {
    setIsCreateActionDefinitionDialogOpen(false);
  }, []);

  const handleActionDefinitionCreatedAndClose = useCallback((newDef: ActionDefinition) => {
    addActionDefinition(newDef); 
    setNewlyAddedActionId(newDef.id);
    setTimeout(() => setNewlyAddedActionId(null), 1000); 
    setIsCreateActionDefinitionDialogOpen(false);
    onActionDefinitionsChanged();
  }, [addActionDefinition, onActionDefinitionsChanged]);


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

  const handleSubmitDataEntryLog = useCallback(async (data: LogDataEntryInputDTO) => {
    setIsSubmittingDataEntry(true);
    try {
      await onLogDataEntry(data);
      handleCloseDataEntryDialog(); 
    } catch (error) {
      console.error("Error during data entry submission in ActionManager:", error);
      throw error; 
    } finally {
      setIsSubmittingDataEntry(false);
    }
  }, [onLogDataEntry, handleCloseDataEntryDialog]);

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
  
  const handleActionDefinitionUpdatedAndClose = useCallback((updatedDef: ActionDefinition) => {
    updateActionDefinitionInState(updatedDef); 
    setIsEditActionDefinitionDialogOpen(false);
    onActionDefinitionsChanged();
  }, [updateActionDefinitionInState, onActionDefinitionsChanged]);

  const handleActionDefinitionDeletedAndClose = useCallback((deletedId: string) => {
    removeActionDefinitionFromState(deletedId);
    setIsEditActionDefinitionDialogOpen(false); 
    onActionDefinitionsChanged();
  }, [removeActionDefinitionFromState, onActionDefinitionsChanged]);


  return (
    <>
      <Card className="shadow-lg h-full flex flex-col">
        <CardHeader className="flex flex-row justify-between items-center shrink-0">
          <CardTitle className="text-xl">Available Actions</CardTitle>
          <Button size="lg" variant="outline" className="text-md" onClick={handleOpenCreateActionDefinitionDialog}>
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
                    onOpenMultiStepDialog={handleOpenMultiStepDialog}
                    onOpenDataEntryDialog={handleOpenDataEntryDialog}
                    onEditActionDefinition={handleOpenEditActionDefinitionDialog}
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
        isOpen={isCreateActionDefinitionDialogOpen}
        onClose={handleCloseCreateActionDefinitionDialog}
        spaceId={spaceId}
        onActionDefinitionCreated={handleActionDefinitionCreatedAndClose}
        createActionDefinitionUseCase={createActionDefinitionUseCase}
      />

      {currentMultiStepAction && (
        <MultiStepActionDialog
          actionDefinition={currentMultiStepAction}
          isOpen={isMultiStepDialogOpen}
          onClose={handleCloseMultiStepDialog}
          onLogAction={onLogAction}
        />
      )}

      {currentDataEntryAction && (
        <DataEntryFormDialog
          actionDefinition={currentDataEntryAction}
          isOpen={isDataEntryDialogOpen}
          onClose={handleCloseDataEntryDialog}
          onSubmitLog={handleSubmitDataEntryLog}
        />
      )}

      {actionDefinitionToEdit && (
        <EditActionDefinitionDialog
          isOpen={isEditActionDefinitionDialogOpen}
          onClose={handleCloseEditActionDefinitionDialog}
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
