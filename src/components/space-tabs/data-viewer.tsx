
// src/components/space-tabs/data-viewer.tsx
"use client";

import * as React from 'react';
import type { DataEntryLog, FormFieldDefinition } from '@/domain/entities';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import { ListChecks, ChevronDown, ChevronRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';

interface DataViewerProps {
  formTitle: string;
  formFields: FormFieldDefinition[];
  dataEntries: DataEntryLog[];
}

export function DataViewer({ formTitle, formFields, dataEntries }: DataViewerProps) {
  const [expandedRowId, setExpandedRowId] = React.useState<string | null>(null);

  if (!formFields || formFields.length === 0) {
    return <p className="text-sm text-muted-foreground p-4">No form fields defined for "{formTitle}".</p>;
  }

  const toggleRow = (rowId: string) => {
    setExpandedRowId(prevId => (prevId === rowId ? null : rowId));
  };

  const summaryField = formFields.length > 0 ? formFields[0] : null;
  const numberOfSummaryColumns = 3 + (summaryField ? 1 : 0); 

  return (
    <div className="h-full flex flex-col">
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
                <TableHead className="w-[40px] sticky top-0 bg-card z-10 text-xs sm:text-sm whitespace-nowrap"></TableHead>
                <TableHead className="w-[130px] sm:w-[160px] sticky top-0 bg-card z-10 text-xs sm:text-sm whitespace-nowrap">Timestamp</TableHead>
                <TableHead className="w-[50px] sm:w-[70px] sticky top-0 bg-card z-10 text-xs sm:text-sm whitespace-nowrap">Points</TableHead>
                {summaryField && (
                  <TableHead className="sticky top-0 bg-card z-10 text-xs sm:text-sm whitespace-nowrap">{summaryField.label}</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {dataEntries.map((entry) => (
                <React.Fragment key={entry.id}>
                  <TableRow
                    onClick={() => toggleRow(entry.id)}
                    className="cursor-pointer hover:bg-muted/60"
                  >
                    <TableCell className="py-2 px-2 sm:px-3">
                      <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-7 sm:w-7">
                        {expandedRowId === entry.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium text-xs sm:text-sm whitespace-nowrap py-2 px-2 sm:px-3">
                      {format(parseISO(entry.timestamp), 'MMM d, yy HH:mm')}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm whitespace-nowrap py-2 px-2 sm:px-3">{entry.pointsAwarded}</TableCell>
                    {summaryField && (
                      <TableCell className="text-xs sm:text-sm whitespace-nowrap py-2 px-2 sm:px-3 truncate max-w-[150px] sm:max-w-[200px]" title={String(entry.data[summaryField.name] ?? 'N/A')}>
                        {entry.data[summaryField.name] !== undefined ? String(entry.data[summaryField.name]) : 'N/A'}
                      </TableCell>
                    )}
                  </TableRow>
                  {expandedRowId === entry.id && (
                    <TableRow className="bg-muted/30 hover:bg-muted/40">
                      <TableCell colSpan={numberOfSummaryColumns} className="p-0">
                        <div className="p-3 sm:p-4 space-y-1.5">
                          <h5 className="text-sm font-semibold mb-1 text-foreground">Full Details:</h5>
                          {formFields.map(field => (
                            <div key={field.id} className="grid grid-cols-3 gap-2 text-xs sm:text-sm items-start">
                              <span className="font-medium text-muted-foreground col-span-1 truncate">{field.label}:</span>
                              <span className="col-span-2 text-foreground break-words">
                                {entry.data[field.name] !== undefined ? String(entry.data[field.name]) : 'N/A'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      )}
    </div>
  );
}
