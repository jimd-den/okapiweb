// src/components/space-tabs/action-manager.tsx
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ActionDefinition } from '@/domain/entities/action-definition.entity';
import type { CreateActionDefinitionUseCase, CreateActionDefinitionInputDTO } from '@/application/use-cases/action-definition/create-action-definition.usecase';
import { CreateActionDefinitionDialog } from '@/components/create-action-definition-dialog';
import { MultiStepActionDialog } from '@/components/multi-step-action-dialog'; // Import new dialog
import { Play, ListChecks } from 'lucide-react';

interface ActionManagerProps {
  spaceId: string;
  actionDefinitions: ActionDefinition[];
  onLogAction: (actionDefinitionId: string, stepId?: string) => Promise<void>;
  onActionDefinitionCreated: (newDefinition: ActionDefinition) => void;
  createActionDefinitionUseCase: CreateActionDefinitionUseCase;
}

export function ActionManager({
  spaceId,
  actionDefinitions,
  onLogAction,
  onActionDefinitionCreated,
  createActionDefinitionUseCase
}: ActionManagerProps) {
  const [isMultiStepDialogOpen, setIsMultiStepDialogOpen] = useState(false);
  const [currentMultiStepAction, setCurrentMultiStepAction] = useState<ActionDefinition | null>(null);

  const executeCreateActionDefinition = async (data: CreateActionDefinitionInputDTO): Promise<ActionDefinition> => {
    return createActionDefinitionUseCase.execute(data);
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
    // Potentially refresh data if needed, though onLogAction should handle it
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
          {actionDefinitions.length === 0 && (
            <p className="text-muted-foreground text-center py-4">No actions defined for this space yet. Click 'Add New Action' to get started.</p>
          )}
          <div className="space-y-4">
            {actionDefinitions.map(def => (
              <Card key={def.id} className="bg-card/50 p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-lg">{def.name}</h4>
                    {def.description && <p className="text-sm text-muted-foreground">{def.description}</p>}
                    <p className="text-xs text-primary">
                      {def.type === 'single' ? `Points: ${def.pointsForCompletion}` : `Points for full completion: ${def.pointsForCompletion}`}
                      {def.type === 'multi-step' && def.steps && ` (${def.steps.length} steps)`}
                    </p>
                  </div>
                  {def.type === 'single' && (
                    <Button size="lg" className="text-md px-4 py-2" onClick={() => onLogAction(def.id)}>
                      <Play className="mr-2 h-5 w-5" /> Log Action
                    </Button>
                  )}
                  {def.type === 'multi-step' && (
                    <Button size="lg" variant="outline" className="text-md px-4 py-2" onClick={() => handleOpenMultiStepDialog(def)} disabled={!def.steps || def.steps.length === 0}>
                       <ListChecks className="mr-2 h-5 w-5" /> Start Checklist
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
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
