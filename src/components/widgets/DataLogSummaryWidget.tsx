
// src/components/widgets/DataLogSummaryWidget.tsx
"use client";

import React from 'react';
import type { ActionDefinition } from '@/domain/entities/action-definition.entity';
import type { UseSpaceDialogsReturn } from '@/hooks/use-space-dialogs';
import type { SpaceMetrics } from '@/hooks/data/use-space-metrics';
import type { GetDataEntriesBySpaceUseCase } from '@/application/use-cases';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Database } from 'lucide-react';

// Dialog Import
import { DataViewerDialog } from '@/components/dialogs/data-viewer-dialog';

interface DataLogSummaryWidgetProps {
  spaceId: string;
  metrics: Pick<SpaceMetrics, 'dataEntriesForSpace'>; // This now holds full data entries
  dialogs: Pick<UseSpaceDialogsReturn, 
    'isDataViewerDialogOpen' | 
    'openDataViewerDialog' | 
    'closeDataViewerDialog'
  >;
  getDataEntriesBySpaceUseCase: GetDataEntriesBySpaceUseCase; // Needed by DataViewerDialog
  actionDefinitions: ActionDefinition[]; // Needed by DataViewerDialog
}

export function DataLogSummaryWidget({
  spaceId,
  metrics,
  dialogs,
  getDataEntriesBySpaceUseCase,
  actionDefinitions,
}: DataLogSummaryWidgetProps) {
  return (
    <>
      <Card className="p-2 sm:p-3 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow cursor-pointer min-h-[70px] sm:min-h-[90px] bg-card/70" onClick={dialogs.openDataViewerDialog} role="button" tabIndex={0}>
        <Database className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500 mb-1" />
        <CardTitle className="text-xs sm:text-sm md:text-md">Data Logs</CardTitle>
        <CardDescription className="text-[0.65rem] sm:text-xs">{metrics.dataEntriesForSpace?.length || 0} entries</CardDescription>
      </Card>

      {dialogs.isDataViewerDialogOpen && (
         <DataViewerDialog
            isOpen={dialogs.isDataViewerDialogOpen}
            onClose={dialogs.closeDataViewerDialog}
            spaceId={spaceId}
            getDataEntriesBySpaceUseCase={getDataEntriesBySpaceUseCase}
            actionDefinitions={actionDefinitions || []}
        />
      )}
    </>
  );
}
    