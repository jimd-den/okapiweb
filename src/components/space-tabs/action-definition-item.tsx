// src/components/space-tabs/action-definition-item.tsx
"use client";

import type { ActionDefinition } from '@/domain/entities/action-definition.entity';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, ListChecks } from 'lucide-react';

interface ActionDefinitionItemProps {
  actionDefinition: ActionDefinition;
  onLogSingleAction: (actionDefinitionId: string) => void;
  onOpenMultiStepDialog: (actionDefinition: ActionDefinition) => void;
}

export function ActionDefinitionItem({
  actionDefinition,
  onLogSingleAction,
  onOpenMultiStepDialog,
}: ActionDefinitionItemProps) {
  return (
    <Card className="bg-card/50 p-4">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-semibold text-lg">{actionDefinition.name}</h4>
          {actionDefinition.description && <p className="text-sm text-muted-foreground">{actionDefinition.description}</p>}
          <p className="text-xs text-primary">
            {actionDefinition.type === 'single' ? `Points: ${actionDefinition.pointsForCompletion}` : `Points for full completion: ${actionDefinition.pointsForCompletion}`}
            {actionDefinition.type === 'multi-step' && actionDefinition.steps && ` (${actionDefinition.steps.length} steps)`}
          </p>
        </div>
        {actionDefinition.type === 'single' && (
          <Button size="lg" className="text-md px-4 py-2" onClick={() => onLogSingleAction(actionDefinition.id)}>
            <Play className="mr-2 h-5 w-5" /> Log Action
          </Button>
        )}
        {actionDefinition.type === 'multi-step' && (
          <Button 
            size="lg" 
            variant="outline" 
            className="text-md px-4 py-2" 
            onClick={() => onOpenMultiStepDialog(actionDefinition)} 
            disabled={!actionDefinition.steps || actionDefinition.steps.length === 0}
          >
            <ListChecks className="mr-2 h-5 w-5" /> Start Checklist
          </Button>
        )}
      </div>
    </Card>
  );
}
