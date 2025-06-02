
// src/components/widgets/ProblemSummaryWidget.tsx
"use client";

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import type { Problem } from '@/domain/entities/problem.entity';
import type { UseSpaceDialogsReturn } from '@/hooks/use-space-dialogs';
import type { SpaceMetrics } from '@/hooks/data/use-space-metrics';
import { 
  CreateProblemUseCase, type CreateProblemInputDTO,
  UpdateProblemUseCase, type UpdateProblemInputDTO,
  DeleteProblemUseCase, 
  GetProblemsBySpaceUseCase 
} from '@/application/use-cases';
import { IndexedDBProblemRepository } from '@/infrastructure/persistence/indexeddb';
import { useImageCaptureDialog, type UseImageCaptureDialogReturn } from '@/hooks/use-image-capture-dialog';


import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle, CheckCircle2Icon } from 'lucide-react';

// Dialog Import
import { ProblemTrackerDialog } from '@/components/dialogs/problem-tracker-dialog';
import { ImageCaptureDialogView } from '@/components/dialogs/image-capture-dialog-view'; // For consistency

const PROBLEM_BUTTON_UI_DATA = {
  pending: { id: 'pending', title: 'Pending', icon: <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-destructive mb-1" /> },
  resolved: { id: 'resolved', title: 'Resolved', icon: <CheckCircle2Icon className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 mb-1" /> },
};

type CaptureModeProblem = 'problemImage';

interface ProblemSummaryWidgetProps {
  spaceId: string;
  metrics: Pick<SpaceMetrics, 'unresolvedProblemsCount' | 'resolvedProblemsCount'>;
  dialogs: Pick<UseSpaceDialogsReturn, 
    'isProblemTrackerDialogOpen' | 
    'openProblemTrackerDialog' | 
    'closeProblemTrackerDialog'
  >;
  onProblemsChanged: () => void; // Callback to refresh metrics/timeline in parent
}

export function ProblemSummaryWidget({
  spaceId,
  metrics,
  dialogs,
  onProblemsChanged,
}: ProblemSummaryWidgetProps) {

  // Instantiate repository and use cases internally
  const problemRepository = useMemo(() => new IndexedDBProblemRepository(), []);
  const createProblemUseCase = useMemo(() => new CreateProblemUseCase(problemRepository), [problemRepository]);
  const updateProblemUseCase = useMemo(() => new UpdateProblemUseCase(problemRepository), [problemRepository]);
  const deleteProblemUseCase = useMemo(() => new DeleteProblemUseCase(problemRepository), [problemRepository]);
  const getProblemsBySpaceUseCase = useMemo(() => new GetProblemsBySpaceUseCase(problemRepository), [problemRepository]);
  
  // Image capture hook if ProblemTrackerDialog needs it (or if ProblemItem inside it needs it)
  // For now, assume ProblemTrackerDialog itself handles image capture logic, but it would need these use cases.
  // This is a simplified approach. A more robust one might involve a dedicated `useProblemManagement` hook.

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

      {dialogs.isProblemTrackerDialogOpen && (
         <ProblemTrackerDialog
            isOpen={dialogs.isProblemTrackerDialogOpen}
            onClose={dialogs.closeProblemTrackerDialog}
            spaceId={spaceId}
            createProblemUseCase={createProblemUseCase}
            updateProblemUseCase={updateProblemUseCase}
            deleteProblemUseCase={deleteProblemUseCase}
            getProblemsBySpaceUseCase={getProblemsBySpaceUseCase}
            onItemsChanged={onProblemsChanged}
        />
      )}
    </>
  );
}
    

    