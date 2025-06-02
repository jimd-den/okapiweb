
// src/components/widgets/ProblemSummaryWidget.tsx
"use client";

import React from 'react';
import type { UseSpaceDialogsReturn } from '@/hooks/use-space-dialogs';
import type { SpaceMetrics } from '@/hooks/data/use-space-metrics';
import type { CreateProblemUseCase, UpdateProblemUseCase, DeleteProblemUseCase, GetProblemsBySpaceUseCase } from '@/application/use-cases';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle2Icon } from 'lucide-react';

// Dialog Import
import { ProblemTrackerDialog } from '@/components/dialogs/problem-tracker-dialog';

const PROBLEM_BUTTON_UI_DATA = {
  pending: { id: 'pending', title: 'Pending', icon: <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-destructive mb-1" /> },
  resolved: { id: 'resolved', title: 'Resolved', icon: <CheckCircle2Icon className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 mb-1" /> },
};

interface ProblemSummaryWidgetProps {
  spaceId: string;
  metrics: Pick<SpaceMetrics, 'unresolvedProblemsCount' | 'resolvedProblemsCount'>;
  dialogs: Pick<UseSpaceDialogsReturn, 
    'isProblemTrackerDialogOpen' | 
    'openProblemTrackerDialog' | 
    'closeProblemTrackerDialog'
  >;
  // Use Cases needed by ProblemTrackerDialog
  createProblemUseCase: CreateProblemUseCase;
  updateProblemUseCase: UpdateProblemUseCase;
  deleteProblemUseCase: DeleteProblemUseCase;
  getProblemsBySpaceUseCase: GetProblemsBySpaceUseCase;
  onProblemsChanged: () => void; // Callback to refresh metrics/timeline
}

export function ProblemSummaryWidget({
  spaceId,
  metrics,
  dialogs,
  createProblemUseCase,
  updateProblemUseCase,
  deleteProblemUseCase,
  getProblemsBySpaceUseCase,
  onProblemsChanged,
}: ProblemSummaryWidgetProps) {

  const problemBoardButtonStructure = React.useMemo(() => [
    { type: 'pending', title: 'Pending', icon: PROBLEM_BUTTON_UI_DATA.pending.icon, count: metrics.unresolvedProblemsCount },
    { type: 'resolved', title: 'Resolved', icon: PROBLEM_BUTTON_UI_DATA.resolved.icon, count: metrics.resolvedProblemsCount },
  ], [metrics.unresolvedProblemsCount, metrics.resolvedProblemsCount]);

  return (
    <>
      <Card className="shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="p-2 sm:p-3 pb-1 sm:pb-2">
          <CardTitle className="text-base sm:text-lg text-center">Problems</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex divide-x divide-border">
             {problemBoardButtonStructure.map((col) => (
               <button
                  key={col.type}
                  onClick={dialogs.openProblemTrackerDialog}
                  className="flex-1 flex flex-col items-center justify-center p-2 sm:p-3 hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded-none first:rounded-bl-md last:rounded-br-md"
                  role="button" tabIndex={0}
                >
                  {React.cloneElement(col.icon as React.ReactElement, { className: "h-5 w-5 sm:h-6 sm:w-6 mb-1" })}
                  <CardTitle className="text-xs sm:text-sm md:text-md">{col.title}</CardTitle>
                  <CardDescription className="text-[0.65rem] sm:text-xs">{col.count} problem(s)</CardDescription>
                </button>
             ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialog for Problem Tracker */}
      {dialogs.isProblemTrackerDialogOpen && (
         <ProblemTrackerDialog
            isOpen={dialogs.isProblemTrackerDialogOpen}
            onClose={dialogs.closeProblemTrackerDialog}
            spaceId={spaceId}
            createProblemUseCase={createProblemUseCase}
            updateProblemUseCase={updateProblemUseCase}
            deleteProblemUseCase={deleteProblemUseCase}
            getProblemsBySpaceUseCase={getProblemsBySpaceUseCase}
            onItemsChanged={onProblemsChanged} // This will call refreshProblemsAndTimeline in parent
        />
      )}
    </>
  );
}
    