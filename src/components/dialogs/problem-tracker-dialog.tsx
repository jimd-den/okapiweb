
// src/components/dialogs/problem-tracker-dialog.tsx
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
import { ProblemTracker } from '@/components/space-tabs/problem-tracker';
import type { CreateProblemUseCase, UpdateProblemUseCase, DeleteProblemUseCase, GetProblemsBySpaceUseCase } from '@/application/use-cases';
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
        <DialogHeader className="p-4 pb-2 border-b shrink-0">
          <DialogTitle className="text-lg sm:text-xl flex items-center">
            <AlertOctagonIcon className="mr-2 h-5 w-5 text-destructive"/> Problem Tracker
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Manage issues, blockers, and waste for this space.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-hidden p-2 sm:p-4">
          <ProblemTracker
            spaceId={spaceId}
            createProblemUseCase={createProblemUseCase}
            updateProblemUseCase={updateProblemUseCase}
            deleteProblemUseCase={deleteProblemUseCase}
            getProblemsBySpaceUseCase={getProblemsBySpaceUseCase}
            onItemsChanged={onItemsChanged}
          />
        </div>
        <DialogFooter className="p-4 pt-2 border-t shrink-0">
          <Button type="button" variant="outline" size="default" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
