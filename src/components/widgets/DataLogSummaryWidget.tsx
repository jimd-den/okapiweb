
// src/components/widgets/DataLogSummaryWidget.tsx
"use client";

import React from 'react';
import type { ActionDefinition } from '@/domain/entities';
import type { UseSpaceDialogsReturn } from '@/hooks';
import type { SpaceMetrics } from '@/hooks/data';
import type { GetDataEntriesBySpaceUseCase } from '@/application/use-cases';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Database } from 'lucide-react';
import { DataViewerDialog } from '@/components/dialogs';

interface DataLogSummaryWidgetProps {
  spaceId: string;
  metrics: Pick<SpaceMetrics, 'dataEntriesForSpace'>; 
  dialogs: Pick<UseSpaceDialogsReturn, 
    'isDataViewerDialogOpen' | 
    'openDataViewerDialog' | 
    'closeDataViewerDialog'
  >;
  getDataEntriesBySpaceUseCase: GetDataEntriesBySpaceUseCase; 
  actionDefinitions: ActionDefinition[]; 
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
