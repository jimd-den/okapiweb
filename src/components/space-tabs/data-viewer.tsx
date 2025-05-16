// src/components/space-tabs/data-viewer.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { DataEntryLog } from '@/domain/entities/data-entry-log.entity';
import type { ActionDefinition, FormFieldDefinition } from '@/domain/entities/action-definition.entity';
import type { GetDataEntriesBySpaceUseCase } from '@/application/use-cases/data-entry/get-data-entries-by-space.usecase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Database } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface DataViewerProps {
  spaceId: string;
  getDataEntriesBySpaceUseCase: GetDataEntriesBySpaceUseCase;
  actionDefinitions: ActionDefinition[]; // To map actionDefId to name and field names to labels
}

interface EnrichedDataEntryLog extends DataEntryLog {
  actionDefinitionName?: string;
  formattedData?: Array<{ label: string; value: any }>;
}

export function DataViewer({ spaceId, getDataEntriesBySpaceUseCase, actionDefinitions }: DataViewerProps) {
  const [dataEntries, setDataEntries] = useState<EnrichedDataEntryLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const findActionDef = useCallback((id: string) => {
    return actionDefinitions.find(ad => ad.id === id);
  }, [actionDefinitions]);

  const fetchDataEntries = useCallback(async () => {
    if (!spaceId) return;
    setIsLoading(true);
    try {
      const rawEntries = await getDataEntriesBySpaceUseCase.execute(spaceId);
      const enrichedEntries = rawEntries.map(entry => {
        const ad = findActionDef(entry.actionDefinitionId);
        const formattedData: Array<{ label: string; value: any }> = [];
        if (ad && ad.type === 'data-entry' && ad.formFields) {
          for (const fieldDef of ad.formFields.sort((a,b) => a.order - b.order)) {
            formattedData.push({
              label: fieldDef.label,
              value: entry.data[fieldDef.name] !== undefined ? String(entry.data[fieldDef.name]) : 'N/A',
            });
          }
        } else {
          // Fallback if action definition or form fields are not found
          Object.entries(entry.data).forEach(([key, value]) => {
            formattedData.push({ label: key, value: String(value) });
          });
        }
        return {
          ...entry,
          actionDefinitionName: ad?.name || 'Unknown Action',
          formattedData,
        };
      });
      setDataEntries(enrichedEntries);
    } catch (err) {
      console.error("Failed to fetch data entries:", err);
      toast({ title: "Error Loading Data Entries", description: String(err), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [spaceId, getDataEntriesBySpaceUseCase, findActionDef, toast]);

  useEffect(() => {
    fetchDataEntries();
  }, [fetchDataEntries]);

  if (isLoading) {
    return (
      <Card className="mt-4 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl flex items-center"><Database className="mr-2 h-6 w-6 text-primary" /> Data Logs</CardTitle>
          <CardDescription>Viewing submitted data entries for this space.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-muted-foreground">Loading data entries...</p>
        </CardContent>
      </Card>
    );
  }

  if (dataEntries.length === 0) {
    return (
      <Card className="mt-4 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl flex items-center"><Database className="mr-2 h-6 w-6 text-primary" /> Data Logs</CardTitle>
          <CardDescription>Viewing submitted data entries for this space.</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-10">
          <Database className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No data entries logged for this space yet.</p>
        </CardContent>
      </Card>
    );
  }

  // Determine all unique data field labels for table headers
  const allFieldLabels = Array.from(
    new Set(dataEntries.flatMap(entry => entry.formattedData?.map(fd => fd.label) || []))
  );


  return (
    <Card className="mt-4 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl flex items-center"><Database className="mr-2 h-6 w-6 text-primary" /> Data Logs</CardTitle>
        <CardDescription>Viewing submitted data entries for this space.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Action Form</TableHead>
              <TableHead className="w-[180px]">Timestamp</TableHead>
              <TableHead>Points</TableHead>
              {allFieldLabels.map(label => <TableHead key={label}>{label}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {dataEntries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="font-medium">{entry.actionDefinitionName}</TableCell>
                <TableCell>{format(parseISO(entry.timestamp), 'MMM d, yyyy HH:mm')}</TableCell>
                <TableCell>{entry.pointsAwarded}</TableCell>
                {allFieldLabels.map(label => {
                  const fieldData = entry.formattedData?.find(fd => fd.label === label);
                  return <TableCell key={`${entry.id}-${label}`}>{fieldData ? fieldData.value : 'N/A'}</TableCell>;
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
