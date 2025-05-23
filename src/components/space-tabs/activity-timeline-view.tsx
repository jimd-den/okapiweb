
// src/components/space-tabs/activity-timeline-view.tsx
"use client";

import type { TimelineItem } from '@/application/dto/timeline-item.dto';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { History, ListChecks, Award, AlertOctagon, ClipboardCheck, CheckSquare, XSquare, CheckCircle2, Database } from 'lucide-react';
import NextImage from 'next/image'; 
import { Skeleton } from '@/components/ui/skeleton';
import type { ActionDefinition } from '@/domain/entities/action-definition.entity'; // Added for context if needed

interface ActivityTimelineViewProps {
  timelineItems: TimelineItem[];
  isLoading: boolean;
  // actionDefinitions?: ActionDefinition[]; // Optional: To resolve data_entry field labels
}

const getIconForType = (item: TimelineItem) => {
  switch (item.type) {
    case 'action_log':
      if (item.completedStepId) { 
        return item.stepOutcome === 'completed' ? <CheckCircle2 className="h-6 w-6 text-green-500" /> : <XSquare className="h-6 w-6 text-orange-500" />;
      }
      return item.isMultiStepFullCompletion ? <Award className="h-6 w-6 text-accent" /> : <ListChecks className="h-6 w-6 text-primary" />;
    case 'problem':
      return <AlertOctagon className={`h-6 w-6 ${item.problemResolved ? 'text-green-500' : 'text-destructive'}`} />;
    case 'todo':
      return item.todoCompleted ? <CheckSquare className="h-6 w-6 text-green-500" /> : <ClipboardCheck className="h-6 w-6 text-blue-500" />;
    case 'data_entry':
      return <Database className="h-6 w-6 text-purple-500" />;
    default:
      return <History className="h-6 w-6 text-muted-foreground" />;
  }
};

export function ActivityTimelineView({ timelineItems, isLoading /*, actionDefinitions = [] */ }: ActivityTimelineViewProps) {
  if (isLoading) {
    return (
      <Card className="shadow-lg h-full flex flex-col">
        <CardHeader className="shrink-0">
          <CardTitle className="text-xl">Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-4">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-4 p-3 rounded-md border">
                <Skeleton className="h-6 w-6 rounded-full mt-1 shrink-0" />
                <div className="flex-grow space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!timelineItems || timelineItems.length === 0) {
    return (
      <Card className="shadow-lg h-full flex flex-col">
        <CardHeader className="shrink-0">
          <CardTitle className="text-xl">Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col items-center justify-center text-center">
          <History className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No activity logged for this space yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg h-full flex flex-col">
      <CardHeader className="shrink-0">
        <CardTitle className="text-xl">Activity Timeline</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0 sm:p-4">
        <ScrollArea className="h-full pr-3">
          <div className="space-y-4"> 
            {timelineItems.map((item) => (
              <div key={`${item.type}-${item.id}-${item.timestamp}`} className="flex items-start gap-3 p-3 rounded-md border bg-card hover:bg-muted/30 transition-colors">
                <div className="flex-shrink-0 mt-1">
                  {getIconForType(item)}
                </div>
                <div className="flex-grow min-w-0"> 
                  <div className="flex justify-between items-center mb-0.5">
                    <p className="font-semibold text-md truncate" title={item.title}>
                      {item.title}
                    </p>
                    {(item.type === 'action_log' || item.type === 'data_entry') && item.pointsAwarded !== undefined && item.pointsAwarded > 0 && (
                      <Badge variant="secondary" className="text-xs whitespace-nowrap ml-2">
                        +{item.pointsAwarded} pts
                      </Badge>
                    )}
                     {item.type === 'action_log' && item.completedStepId && item.pointsAwarded === 0 && item.stepOutcome === 'skipped' && (
                      <Badge variant="outline" className="text-xs whitespace-nowrap ml-2 text-orange-600 border-orange-300">
                        0 pts
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
                  {item.type === 'action_log' && item.isMultiStepFullCompletion && (
                    <Badge variant="default" className="mt-1 text-xs">Full Checklist Completed</Badge>
                  )}
                  {item.type === 'problem' && item.problemResolved && (
                     <Badge variant="outline" className="mt-1 text-xs bg-green-100 text-green-700 border-green-300">Resolved</Badge>
                  )}
                   {item.type === 'problem' && item.problemResolved && item.problemResolutionNotes && (
                     <p className="text-sm text-muted-foreground mt-1 italic">Resolution: {item.problemResolutionNotes}</p>
                  )}
                  {item.type === 'problem' && item.problemImageDataUri && (
                    <div className="mt-2">
                      <NextImage src={item.problemImageDataUri} alt="Problem image" width={128} height={96} className="rounded border object-cover" data-ai-hint="issue snapshot" />
                    </div>
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
                          <NextImage src={item.todoBeforeImageDataUri} alt="Before image" width={64} height={48} className="rounded border object-cover" data-ai-hint="initial state" />
                          <span className="text-xs text-muted-foreground">Before</span>
                        </div>
                      )}
                      {item.todoAfterImageDataUri && (
                        <div className="flex flex-col items-center">
                           <NextImage src={item.todoAfterImageDataUri} alt="After image" width={64} height={48} className="rounded border object-cover" data-ai-hint="final state" />
                           <span className="text-xs text-muted-foreground">After</span>
                        </div>
                      )}
                    </div>
                  )}
                  {item.type === 'data_entry' && item.dataEntrySubmittedData && ( 
                    <div className="mt-1 text-xs text-muted-foreground space-y-0.5">
                      {Object.entries(item.dataEntrySubmittedData).slice(0, 3).map(([key, value]) => {
                        // const fieldDef = actionDefinitions.find(ad => ad.id === item.actionDefinitionId)?.formFields?.find(ff => ff.name === key);
                        // const fieldName = fieldDef?.label || key; // Use label if available
                        // For now, just show key as fetching actionDefs here adds complexity
                        return (<p key={key} className="truncate"><span className="font-medium">{key}:</span> {String(value)}</p>);
                      })}
                      {Object.keys(item.dataEntrySubmittedData).length > 3 && <p>...</p>}
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
