// src/components/space-tabs/activity-timeline-view.tsx
"use client";

import type { TimelineItem } from '@/application/dto/timeline-item.dto';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { History, ListChecks, Award, AlertOctagon, ClipboardCheck, CheckSquare, Edit, Image as ImageIcon } from 'lucide-react';
import NextImage from 'next/image'; // Using next/image for consistency
import { Skeleton } from '@/components/ui/skeleton';

interface ActivityTimelineViewProps {
  timelineItems: TimelineItem[];
  isLoading: boolean;
}

const getIconForType = (item: TimelineItem) => {
  switch (item.type) {
    case 'action_log':
      return item.completedStepId ? <ListChecks className="h-6 w-6 text-primary" /> : <Award className="h-6 w-6 text-accent" />;
    case 'problem':
      return <AlertOctagon className={`h-6 w-6 ${item.problemResolved ? 'text-green-500' : 'text-destructive'}`} />;
    case 'todo':
      return item.todoCompleted ? <CheckSquare className="h-6 w-6 text-green-500" /> : <ClipboardCheck className="h-6 w-6 text-blue-500" />;
    default:
      return <History className="h-6 w-6 text-muted-foreground" />;
  }
};

export function ActivityTimelineView({ timelineItems, isLoading }: ActivityTimelineViewProps) {
  if (isLoading) {
    return (
      <Card className="mt-4 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start gap-4 p-3 rounded-md border">
              <Skeleton className="h-6 w-6 rounded-full mt-1" />
              <div className="flex-grow space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!timelineItems || timelineItems.length === 0) {
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
        <ScrollArea className="h-[500px] pr-4"> {/* Increased height */}
          <div className="space-y-4"> {/* Reduced space-y for tighter packing */}
            {timelineItems.map((item) => (
              <div key={`${item.type}-${item.id}-${item.timestamp}`} className="flex items-start gap-3 p-3 rounded-md border bg-card hover:bg-muted/30 transition-colors">
                <div className="flex-shrink-0 mt-1">
                  {getIconForType(item)}
                </div>
                <div className="flex-grow min-w-0"> {/* Added min-w-0 for flex child truncation */}
                  <div className="flex justify-between items-center mb-0.5">
                    <p className="font-semibold text-md truncate" title={item.title}>
                      {item.title}
                    </p>
                    {item.type === 'action_log' && item.pointsAwarded !== undefined && (
                      <Badge variant="secondary" className="text-xs whitespace-nowrap ml-2">
                        +{item.pointsAwarded} pts
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(item.timestamp), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                  {item.description && (
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap break-words"> 
                      {item.description}
                    </p>
                  )}
                   {/* Specific details rendering */}
                  {item.type === 'action_log' && item.isMultiStepFullCompletion && (
                    <Badge variant="default" className="mt-1 text-xs">Full Checklist Completed</Badge>
                  )}
                  {item.type === 'action_log' && item.actionLogNotes && (
                    <p className="text-sm text-muted-foreground mt-1 italic">Note: {item.actionLogNotes}</p>
                  )}
                  {item.type === 'problem' && item.problemResolved && (
                     <Badge variant="outline" className="mt-1 text-xs bg-green-100 text-green-700 border-green-300">Resolved</Badge>
                  )}
                   {item.type === 'problem' && item.problemResolved && item.problemResolutionNotes && (
                     <p className="text-sm text-muted-foreground mt-1 italic">Resolution: {item.problemResolutionNotes}</p>
                  )}
                  {item.type === 'todo' && item.todoCompleted && item.todoCompletionDate && (
                     <Badge variant="outline" className="mt-1 text-xs bg-green-100 text-green-700 border-green-300">
                       Completed: {format(parseISO(item.todoCompletionDate), "MMM d, yy")}
                     </Badge>
                  )}
                  {item.type === 'todo' && (item.todoBeforeImageDataUri || item.todoAfterImageDataUri) && (
                    <div className="mt-2 flex gap-2">
                      {item.todoBeforeImageDataUri && (
                        <div className="flex flex-col items-center">
                          <NextImage src={item.todoBeforeImageDataUri} alt="Before image" width={64} height={48} className="rounded border object-cover" />
                          <span className="text-xs text-muted-foreground">Before</span>
                        </div>
                      )}
                      {item.todoAfterImageDataUri && (
                        <div className="flex flex-col items-center">
                           <NextImage src={item.todoAfterImageDataUri} alt="After image" width={64} height={48} className="rounded border object-cover" />
                           <span className="text-xs text-muted-foreground">After</span>
                        </div>
                      )}
                    </div>
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
