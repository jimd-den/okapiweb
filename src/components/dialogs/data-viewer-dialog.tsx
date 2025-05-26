
// src/components/dialogs/data-viewer-dialog.tsx
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
import { DataViewer } from '@/components/space-tabs/data-viewer';
import type { GetDataEntriesBySpaceUseCase } from '@/application/use-cases/data-entry/get-data-entries-by-space.usecase';
import type { ActionDefinition } from '@/domain/entities/action-definition.entity';
import { Database } from 'lucide-react';

interface DataViewerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  spaceId: string;
  getDataEntriesBySpaceUseCase: GetDataEntriesBySpaceUseCase;
  actionDefinitions: ActionDefinition[];
}

export function DataViewerDialog({
  isOpen,
  onClose,
  spaceId,
  getDataEntriesBySpaceUseCase,
  actionDefinitions,
}: DataViewerDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-5xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b shrink-0">
          <DialogTitle className="text-2xl flex items-center">
            <Database className="mr-2 h-6 w-6 text-purple-500"/> Data Logs
          </DialogTitle>
          <DialogDescription>
            View all submitted data entries for this space.
          </DialogDescription>
        </DialogHeader>
         {/* DataViewer component should be a flex column itself to manage its internal scrolling */}
        <div className="flex-1 overflow-hidden p-1 md:p-2 lg:p-4">
          <DataViewer
            spaceId={spaceId}
            getDataEntriesBySpaceUseCase={getDataEntriesBySpaceUseCase}
            actionDefinitions={actionDefinitions}
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
