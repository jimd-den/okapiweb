// src/components/space-tabs/data-viewer.tsx
"use client";

// Removed useState, useEffect, useCallback as data is now passed via props
import type { DataEntryLog } from '@/domain/entities/data-entry-log.entity';
import type { ActionDefinition } from '@/domain/entities/action-definition.entity';
// Removed GetDataEntriesBySpaceUseCase import
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'; // Card components are not used directly here anymore
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Database, ListChecks } from 'lucide-react'; // Removed Loader2, AlertTriangle
import { format, parseISO } from 'date-fns';
// Removed Alert, AlertDescription imports

interface DataViewerProps {
  actionDefinition: ActionDefinition; // The specific action definition for this tab
  dataEntries: DataEntryLog[];      // Pre-filtered data entries for this action definition
}

export function DataViewer({ actionDefinition, dataEntries }: DataViewerProps) {
  // Data is now passed in, no need for internal fetching, loading, or error states here.

  const formFields = actionDefinition.formFields?.sort((a, b) => a.order - b.order) || [];

  if (!actionDefinition || actionDefinition.type !== 'data-entry') {
    return <p className="text-sm text-destructive p-4">Invalid action definition provided for data viewer.</p>;
  }
  
  return (
    <div className="h-full flex flex-col"> {/* Changed from Card to div for better flex layout within TabsContent */}
      {dataEntries.length === 0 ? (
        <div className="flex-1 flex flex-col justify-center items-center text-center p-4">
          <ListChecks className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No data logged for "{actionDefinition.name}" yet.</p>
        </div>
      ) : (
        <ScrollArea className="flex-1"> {/* flex-1 to take available space */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px] sm:w-[180px] sticky top-0 bg-card z-10 text-xs sm:text-sm">Timestamp</TableHead>
                <TableHead className="w-[60px] sm:w-[80px] sticky top-0 bg-card z-10 text-xs sm:text-sm">Points</TableHead>
                {formFields.map(field => (
                  <TableHead key={field.id} className="sticky top-0 bg-card z-10 text-xs sm:text-sm">{field.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {dataEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium text-xs sm:text-sm">{format(parseISO(entry.timestamp), 'MMM d, yy HH:mm')}</TableCell>
                  <TableCell className="text-xs sm:text-sm">{entry.pointsAwarded}</TableCell>
                  {formFields.map(field => (
                    <TableCell key={`${entry.id}-${field.id}`} className="text-xs sm:text-sm">
                      {entry.data[field.name] !== undefined ? String(entry.data[field.name]) : 'N/A'}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      )}
    </div>
  );
}
