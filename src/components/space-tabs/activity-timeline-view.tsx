// src/components/space-tabs/activity-timeline-view.tsx
"use client";

import type { EnrichedActionLog } from '@/application/use-cases/action-log/get-action-logs-by-space.usecase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { History, ListChecks, Award } from 'lucide-react';

interface ActivityTimelineViewProps {
  actionLogs: EnrichedActionLog[];
  isLoading: boolean;
}

export function ActivityTimelineView({ actionLogs, isLoading }: ActivityTimelineViewProps) {
  if (isLoading) {
    return (
      <Card className="mt-4 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-10">
          <p className="text-muted-foreground">Loading activity...</p>
        </CardContent>
      </Card>
    );
  }

  if (!actionLogs || actionLogs.length === 0) {
    return (
      <Card className="mt-4 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-10">
          <History className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No activity logged for this space yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">Activity Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4"> {/* Added pr-4 for scrollbar spacing */}
          <div className="space-y-6">
            {actionLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-4 p-3 rounded-md border bg-card hover:bg-muted/30 transition-colors">
                <div className="flex-shrink-0 mt-1">
                  {log.completedStepId ? (
                    <ListChecks className="h-6 w-6 text-primary" />
                  ) : (
                    <Award className="h-6 w-6 text-accent" />
                  )}
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold text-md">
                      {log.actionName}
                      {log.actionStepDescription && <span className="text-sm text-muted-foreground">: {log.actionStepDescription}</span>}
                    </p>
                    <Badge variant="secondary" className="text-xs whitespace-nowrap">
                      +{log.pointsAwarded} pts
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(parseISO(log.timestamp), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                  {log.isMultiStepFullCompletion && (
                    <Badge variant="default" className="mt-1 text-xs">Full Checklist Completed</Badge>
                  )}
                  {log.notes && (
                    <p className="text-sm text-muted-foreground mt-1 italic">Note: {log.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
