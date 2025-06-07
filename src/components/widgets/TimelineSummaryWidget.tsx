
// src/components/widgets/TimelineSummaryWidget.tsx
"use client";

import React from 'react';
import type { TimelineItem } from '@/application/dto';
import type { UseSpaceDialogsReturn } from '@/hooks';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GanttChartSquare } from 'lucide-react';
import { ActivityTimelineDialog } from '@/components/dialogs';

interface TimelineSummaryWidgetProps {
  dialogs: Pick<UseSpaceDialogsReturn, 
    'isTimelineDialogOpen' | 
    'openTimelineDialog' | 
    'closeTimelineDialog'
  >;
  timelineItems: TimelineItem[];
  isLoadingTimeline: boolean;
}

export function TimelineSummaryWidget({
  dialogs,
  timelineItems,
  isLoadingTimeline,
}: TimelineSummaryWidgetProps) {
  return (
    <>
      <Card className="p-2 sm:p-3 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow cursor-pointer min-h-[70px] sm:min-h-[90px] bg-card/70" onClick={dialogs.openTimelineDialog} role="button" tabIndex={0}>
        <GanttChartSquare className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 mb-1" />
        <CardTitle className="text-xs sm:text-sm md:text-md">Timeline / Gantt (Future)</CardTitle>
        <CardDescription className="text-[0.65rem] sm:text-xs">View history</CardDescription>
      </Card>

      {dialogs.isTimelineDialogOpen && (
         <ActivityTimelineDialog
            isOpen={dialogs.isTimelineDialogOpen}
            onClose={dialogs.closeTimelineDialog}
            timelineItems={timelineItems || []}
            isLoading={isLoadingTimeline}
            title="Activity Timeline / Gantt (Future)"
        />
      )}
    </>
  );
}
