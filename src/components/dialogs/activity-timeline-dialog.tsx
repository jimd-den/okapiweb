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
  title?: string; // Make title optional
}

export function ActivityTimelineDialog({
  isOpen,
  onClose,
  timelineItems,
  isLoading,
  title = "Activity Timeline" // Default title
}: ActivityTimelineDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-4 pb-2 border-b shrink-0">
          <DialogTitle className="text-lg sm:text-xl flex items-center">
            <GanttChartSquare className="mr-2 h-5 w-5 text-green-500"/> {title}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Recent activity in this space. Future: Gantt chart visualization.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-hidden p-2 sm:p-4">
          <ActivityTimelineView
            timelineItems={timelineItems}
            isLoading={isLoading}
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
