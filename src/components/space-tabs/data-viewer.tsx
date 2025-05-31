// src/components/space-tabs/data-viewer.tsx
"use client";

import type { DataEntryLog } from '@/domain/entities/data-entry-log.entity';
import type { FormFieldDefinition } from '@/domain/entities/action-definition.entity';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import { ListChecks } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface DataViewerProps {
  formTitle: string; // New: Title for this specific form view
  formFields: FormFieldDefinition[]; // New: The fields that define the columns
  dataEntries: DataEntryLog[];      // Pre-filtered data entries for this specific form
}

export function DataViewer({ formTitle, formFields, dataEntries }: DataViewerProps) {

  if (!formFields || formFields.length === 0) {
    return <p className="text-sm text-muted-foreground p-4">No form fields defined for "{formTitle}".</p>;
  }
  
  return (
    <div className="h-full flex flex-col">
      {/* Title is now typically handled by the Dialog/Tab header */}
      {/* <h4 className="text-md font-semibold mb-2 px-1">{formTitle}</h4> */}
      {dataEntries.length === 0 ? (
        <div className="flex-1 flex flex-col justify-center items-center text-center p-4">
          <ListChecks className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No data logged for "{formTitle}" yet.</p>
        </div>
      ) : (
        <ScrollArea className="flex-1">
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
