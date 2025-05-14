// src/components/space-tabs/action-manager.tsx
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ActionDefinition } from '@/domain/entities/action-definition.entity';
import type { CreateActionDefinitionUseCase, CreateActionDefinitionInputDTO } from '@/application/use-cases/action-definition/create-action-definition.usecase';
import { CreateActionDefinitionDialog } from '@/components/create-action-definition-dialog';
import { MultiStepActionDialog } from '@/components/multi-step-action-dialog';
import { ActionDefinitionItem } from './action-definition-item'; 
import { Loader2 } from 'lucide-react';

interface ActionManagerProps {
  spaceId: string;
  actionDefinitions: ActionDefinition[];
  isLoading: boolean; // Added isLoading prop
  onLogAction: (actionDefinitionId: string, stepId?: string, stepOutcome?: 'completed' | 'skipped') => Promise<void>;
  onActionDefinitionCreated: (newDefinition: ActionDefinition) => void; // This callback is invoked by CreateActionDefinitionDialog successfully
  createActionDefinitionUseCase: CreateActionDefinitionUseCase;
}

export function ActionManager({
  spaceId,
  actionDefinitions,
  isLoading, // Use isLoading prop
  onLogAction,
  onActionDefinitionCreated,
  createActionDefinitionUseCase
}: ActionManagerProps) {
  const [isMultiStepDialogOpen, setIsMultiStepDialogOpen] = useState(false);
  const [currentMultiStepAction, setCurrentMultiStepAction] = useState<ActionDefinition | null>(null);

  // This function is passed to CreateActionDefinitionDialog
  const executeCreateActionDefinition = async (data: CreateActionDefinitionInputDTO): Promise<ActionDefinition> => {
    const newDef = await createActionDefinitionUseCase.execute(data);
    // The onActionDefinitionCreated callback (which might call a parent's refresh function)
    // is handled within the useCreateActionDefinitionForm hook or CreateActionDefinitionDialog itself upon success.
    // Here, we ensure the parent (SpaceDashboardPage) is notified if it needs to refetch its own list of actionDefinitions.
    onActionDefinitionCreated(newDef); 
    return newDef;
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

  const handleSingleActionLog = (actionDefinitionId: string) => {
    onLogAction(actionDefinitionId);
  };

  return (
    <>
      <Card className="mt-4 shadow-lg">
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle className="text-xl">Log Actions</CardTitle>
          <CreateActionDefinitionDialog
            spaceId={spaceId}
            onActionDefinitionCreated={onActionDefinitionCreated} // Propagates to parent
            createActionDefinition={createActionDefinitionUseCase} // Pass the use case directly
          />
        </CardHeader>
        <CardContent>
          {isLoading ? (
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
        />
      )}
    </>
  );
}
