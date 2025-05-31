
// src/components/dialogs/advanced-actions-dialog.tsx
"use client";

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ActionManager } from '@/components/space-tabs/action-manager';
import type { ActionDefinition } from '@/domain/entities/action-definition.entity';
import type { CreateActionDefinitionUseCase } from '@/application/use-cases/action-definition/create-action-definition.usecase';
import type { UpdateActionDefinitionUseCase } from '@/application/use-cases/action-definition/update-action-definition.usecase';
import type { DeleteActionDefinitionUseCase } from '@/application/use-cases/action-definition/delete-action-definition.usecase';
import type { LogDataEntryInputDTO } from '@/application/use-cases'; // For onLogDataEntry prop
import { Cog } from 'lucide-react';

interface AdvancedActionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  spaceId: string;
  actionDefinitions: ActionDefinition[];
  isLoadingActionDefinitions: boolean;
  createActionDefinitionUseCase: CreateActionDefinitionUseCase;
  updateActionDefinitionUseCase: UpdateActionDefinitionUseCase;
  deleteActionDefinitionUseCase: DeleteActionDefinitionUseCase;
  addActionDefinition: (newDefinition: ActionDefinition) => void;
  updateActionDefinitionInState: (updatedDefinition: ActionDefinition) => void;
  removeActionDefinitionFromState: (definitionId: string) => void;
  onActionDefinitionsChanged: () => void;
  // Added props for logging, to be passed to ActionManager
  onLogAction: (actionDefinitionId: string, completedStepId?: string, stepOutcome?: 'completed' | 'skipped', notes?: string, durationMs?: number) => Promise<void>;
  onLogDataEntry: (data: Omit<LogDataEntryInputDTO, 'spaceId'>) => Promise<void>;
}

export function AdvancedActionsDialog({
  isOpen,
  onClose,
  spaceId,
  actionDefinitions,
  isLoadingActionDefinitions,
  createActionDefinitionUseCase,
  updateActionDefinitionUseCase,
  deleteActionDefinitionUseCase,
  addActionDefinition,
  updateActionDefinitionInState,
  removeActionDefinitionFromState,
  onActionDefinitionsChanged,
  onLogAction, // Destructure new prop
  onLogDataEntry, // Destructure new prop
}: AdvancedActionsDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-4 pb-2 border-b shrink-0">
          <DialogTitle className="text-lg flex items-center">
            <Cog className="mr-2 h-4 w-4 text-primary" /> Manage Action Definitions
          </DialogTitle>
          <DialogDescription className="text-xs">
            Create, edit, and manage all action definitions for this space.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden p-3">
            <ActionManager
                spaceId={spaceId}
                actionDefinitions={actionDefinitions}
                isLoadingActionDefinitions={isLoadingActionDefinitions}
                isLoggingAction={false} // ActionManager's internal logging state might not be needed if handled by parent
                onLogAction={onLogAction} // Pass through
                onLogDataEntry={onLogDataEntry} // Pass through
                createActionDefinitionUseCase={createActionDefinitionUseCase}
                updateActionDefinitionUseCase={updateActionDefinitionUseCase}
                deleteActionDefinitionUseCase={deleteActionDefinitionUseCase}
                addActionDefinition={addActionDefinition}
                updateActionDefinitionInState={updateActionDefinitionInState}
                removeActionDefinitionFromState={removeActionDefinitionFromState}
                onActionDefinitionsChanged={onActionDefinitionsChanged}
            />
        </div>
        
        <DialogFooter className="p-3 pt-2 border-t shrink-0">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

