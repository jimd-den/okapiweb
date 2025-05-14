// src/components/space-tabs/action-manager.tsx
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { ActionDefinition, ActionStep } from '@/domain/entities/action-definition.entity';
import type { CreateActionDefinitionUseCase, CreateActionDefinitionInputDTO } from '@/application/use-cases/action-definition/create-action-definition.usecase';
import { CreateActionDefinitionDialog } from '@/components/create-action-definition-dialog';

interface ActionManagerProps {
  spaceId: string;
  actionDefinitions: ActionDefinition[];
  onLogAction: (actionDefinitionId: string, stepId?: string) => Promise<void>;
  onActionDefinitionCreated: (newDefinition: ActionDefinition) => void;
  createActionDefinitionUseCase: CreateActionDefinitionUseCase; // Pass the use case instance
}

export function ActionManager({
  spaceId,
  actionDefinitions,
  onLogAction,
  onActionDefinitionCreated,
  createActionDefinitionUseCase // Destructure here
}: ActionManagerProps) {
  const { toast } = useToast();
  const [expandedMultiStep, setExpandedMultiStep] = useState<Record<string, boolean>>({});
  // TODO: Fetch existing ActionLogs to determine step completion status for checkboxes.
  // For now, steps are stateless in UI after logging.

  const handleToggleMultiStep = (defId: string) => {
    setExpandedMultiStep(prev => ({ ...prev, [defId]: !prev[defId] }));
  };

  // This function will be passed to the dialog. It directly uses the passed use case.
  const executeCreateActionDefinition = async (data: CreateActionDefinitionInputDTO): Promise<ActionDefinition> => {
    return createActionDefinitionUseCase.execute(data);
  };


  return (
    <Card className="mt-4 shadow-lg">
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle className="text-xl">Log Actions</CardTitle>
        <CreateActionDefinitionDialog
          spaceId={spaceId}
          onActionDefinitionCreated={onActionDefinitionCreated}
          createActionDefinition={executeCreateActionDefinition} // Pass the bound function
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
                  <p className="text-xs text-primary">Points for completion: {def.pointsForCompletion}</p>
                </div>
                {def.type === 'single' && (
                  <Button size="lg" className="text-md px-4 py-2" onClick={() => onLogAction(def.id)}>
                    Log Action
                  </Button>
                )}
                {def.type === 'multi-step' && (
                  <Button variant="outline" size="sm" onClick={() => handleToggleMultiStep(def.id)}>
                    {expandedMultiStep[def.id] ? "Hide Steps" : "Show Steps"}
                  </Button>
                )}
              </div>
              {def.type === 'multi-step' && expandedMultiStep[def.id] && def.steps && (
                <div className="mt-3 space-y-2 pl-4 border-l-2 border-primary/30">
                  {def.steps.sort((a,b) => a.order - b.order).map(step => (
                    <div key={step.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                      <div className="flex items-center">
                        <Checkbox
                          id={`step-${step.id}`}
                          className="mr-3 h-5 w-5"
                          onCheckedChange={(checked) => {
                            if(checked === true) { // Explicitly check for true for onCheckedChange
                              onLogAction(def.id, step.id)
                                .then(() => {
                                  // Potentially disable checkbox or show completed state
                                  // This requires more complex state management of completed steps
                                })
                                .catch(err => toast({ title: "Error logging step", description: String(err), variant: "destructive" }));
                            }
                            // Note: Unchecking a step to "unlog" it is not implemented here.
                            // That would require a different use case or logic.
                          }}
                          // checked={isStepCompleted(def.id, step.id)} // Needs logic based on ActionLogs
                          // disabled={isStepCompleted(def.id, step.id)} // Prevent re-logging for now
                        />
                        <Label htmlFor={`step-${step.id}`} className="text-md">{step.description}</Label>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {step.pointsPerStep ? `+${step.pointsPerStep} pts` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
