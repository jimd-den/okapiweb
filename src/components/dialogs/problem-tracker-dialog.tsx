
// src/components/dialogs/problem-tracker-dialog.tsx
"use client";

import type { Problem } from '@/domain/entities/problem.entity';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
// ScrollArea is removed as ProblemTracker now handles its own scrolling if needed.
import { ProblemTracker } from '@/components/space-tabs/problem-tracker';
import type { CreateProblemUseCase } from '@/application/use-cases/problem/create-problem.usecase';
import type { UpdateProblemUseCase } from '@/application/use-cases/problem/update-problem.usecase';
import type { DeleteProblemUseCase } from '@/application/use-cases/problem/delete-problem.usecase';
import type { GetProblemsBySpaceUseCase } from '@/application/use-cases/problem/get-problems-by-space.usecase';
import { AlertOctagonIcon } from 'lucide-react';

interface ProblemTrackerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  spaceId: string;
  createProblemUseCase: CreateProblemUseCase;
  updateProblemUseCase: UpdateProblemUseCase;
  deleteProblemUseCase: DeleteProblemUseCase;
  getProblemsBySpaceUseCase: GetProblemsBySpaceUseCase;
  onItemsChanged: () => void;
}

export function ProblemTrackerDialog({
  isOpen,
  onClose,
  spaceId,
  createProblemUseCase,
  updateProblemUseCase,
  deleteProblemUseCase,
  getProblemsBySpaceUseCase,
  onItemsChanged,
}: ProblemTrackerDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b shrink-0">
          <DialogTitle className="text-2xl flex items-center">
            <AlertOctagonIcon className="mr-2 h-6 w-6 text-destructive"/> Problem Tracker
          </DialogTitle>
          <DialogDescription>
            Manage issues, blockers, and waste for this space.
          </DialogDescription>
        </DialogHeader>
        {/* The ProblemTracker component should be a flex column itself to manage its internal scrolling */}
        <div className="flex-1 overflow-hidden p-1 md:p-2 lg:p-4">
          <ProblemTracker
            spaceId={spaceId}
            createProblemUseCase={createProblemUseCase}
            updateProblemUseCase={updateProblemUseCase}
            deleteProblemUseCase={deleteProblemUseCase}
            getProblemsBySpaceUseCase={getProblemsBySpaceUseCase}
            onItemsChanged={onItemsChanged}
          />
        </div>
        <DialogFooter className="p-6 pt-4 border-t shrink-0">
          <Button type="button" variant="outline" size="lg" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
