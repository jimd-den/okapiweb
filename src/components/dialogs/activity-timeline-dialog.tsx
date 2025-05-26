
// src/components/dialogs/activity-timeline-dialog.tsx
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
import { ActivityTimelineView } from '@/components/space-tabs/activity-timeline-view';
import type { TimelineItem } from '@/application/dto/timeline-item.dto';
import { GanttChartSquare } from 'lucide-react';

interface ActivityTimelineDialogProps {
  isOpen: boolean;
  onClose: () => void;
  timelineItems: TimelineItem[];
  isLoading: boolean;
}

export function ActivityTimelineDialog({
  isOpen,
  onClose,
  timelineItems,
  isLoading,
}: ActivityTimelineDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b shrink-0">
          <DialogTitle className="text-2xl flex items-center">
            <GanttChartSquare className="mr-2 h-6 w-6 text-green-500"/> Activity Timeline
          </DialogTitle>
          <DialogDescription>
            Recent activity in this space.
          </DialogDescription>
        </DialogHeader>
        {/* ActivityTimelineView component should be a flex column itself to manage its internal scrolling */}
        <div className="flex-1 overflow-hidden p-1 md:p-2 lg:p-4">
          <ActivityTimelineView
            timelineItems={timelineItems}
            isLoading={isLoading}
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
