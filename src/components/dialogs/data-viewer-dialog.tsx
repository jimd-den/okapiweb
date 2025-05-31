// src/components/dialogs/data-viewer-dialog.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { DataViewer } from '@/components/space-tabs/data-viewer';
import type { GetDataEntriesBySpaceUseCase } from '@/application/use-cases/data-entry/get-data-entries-by-space.usecase';
import type { ActionDefinition, FormFieldDefinition } from '@/domain/entities/action-definition.entity';
import type { DataEntryLog } from '@/domain/entities/data-entry-log.entity';
import { Database, Loader2, AlertTriangle, ListFilter } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription as UIDialogAlertDescription } from "@/components/ui/alert";


interface DataViewerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  spaceId: string;
  getDataEntriesBySpaceUseCase: GetDataEntriesBySpaceUseCase;
  actionDefinitions: ActionDefinition[]; // All action definitions for the space
}

interface DisplayableFormInfo {
  id: string; // Unique ID for tab (e.g., actionDef.id or actionDef.id + '_' + step.id)
  title: string;
  fields: FormFieldDefinition[];
  entries: DataEntryLog[];
}

export function DataViewerDialog({
  isOpen,
  onClose,
  spaceId,
  getDataEntriesBySpaceUseCase,
  actionDefinitions,
}: DataViewerDialogProps) {
  const [allDataEntries, setAllDataEntries] = useState<DataEntryLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDataEntries = useCallback(async () => {
    if (!isOpen || !spaceId) return;
    setIsLoading(true);
    setError(null);
    try {
      const entries = await getDataEntriesBySpaceUseCase.execute(spaceId);
      setAllDataEntries(entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    } catch (err: any) {
      setError(err.message || "Could not load data entries.");
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, spaceId, getDataEntriesBySpaceUseCase]);

  useEffect(() => {
    if (isOpen) {
      fetchDataEntries();
    }
  }, [isOpen, fetchDataEntries]);
  
  const displayableForms = useMemo((): DisplayableFormInfo[] => {
    if (isLoading || error || !actionDefinitions.length || !allDataEntries.length) {
      return [];
    }

    const forms: DisplayableFormInfo[] = [];

    actionDefinitions.forEach(ad => {
      // Case 1: Top-level 'data-entry' action
      if (ad.type === 'data-entry' && ad.formFields && ad.formFields.length > 0) {
        const entriesForThisForm = allDataEntries.filter(
          entry => entry.actionDefinitionId === ad.id && !entry.stepId
        );
        if (entriesForThisForm.length > 0) {
          forms.push({
            id: ad.id,
            title: ad.name,
            fields: ad.formFields.sort((a, b) => a.order - b.order),
            entries: entriesForThisForm,
          });
        }
      }
      // Case 2: 'data-entry' steps within a 'multi-step' action
      else if (ad.type === 'multi-step' && ad.steps) {
        ad.steps.forEach(step => {
          if (step.stepType === 'data-entry' && step.formFields && step.formFields.length > 0) {
            const entriesForThisStep = allDataEntries.filter(
              entry => entry.actionDefinitionId === ad.id && entry.stepId === step.id
            );
            if (entriesForThisStep.length > 0) {
              forms.push({
                id: `${ad.id}_${step.id}`,
                title: `${ad.name} - Step: ${step.description.substring(0,20)}${step.description.length > 20 ? '...' : ''}`,
                fields: step.formFields.sort((a, b) => a.order - b.order),
                entries: entriesForThisStep,
              });
            }
          }
        });
      }
    });
    return forms.sort((a,b) => a.title.localeCompare(b.title));
  }, [actionDefinitions, allDataEntries, isLoading, error]);


  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-5xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-4 pb-2 border-b shrink-0">
          <DialogTitle className="text-lg sm:text-xl flex items-center">
            <Database className="mr-2 h-5 w-5 text-purple-500"/> Data Logs
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            View submitted data entries.
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex-1 flex justify-center items-center p-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Loading data...</p>
          </div>
        )}

        {!isLoading && error && (
          <div className="flex-1 p-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <UIDialogAlertDescription>{error}</UIDialogAlertDescription>
            </Alert>
          </div>
        )}

        {!isLoading && !error && displayableForms.length === 0 && (
           <div className="flex-1 flex flex-col justify-center items-center text-center p-4">
            <ListFilter className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No data entries found for any forms.</p>
            <p className="text-sm text-muted-foreground">Define a data-entry action or step and log some data to see it here.</p>
          </div>
        )}

        {!isLoading && !error && displayableForms.length > 0 && (
          <Tabs defaultValue={displayableForms[0]?.id} className="flex-1 flex flex-col overflow-hidden p-1 sm:p-2">
            <ScrollArea className="shrink-0">
              <TabsList className="mb-2 bg-muted/60 p-1 h-auto flex-wrap justify-start">
                {displayableForms.map(formInfo => (
                  <TabsTrigger key={formInfo.id} value={formInfo.id} className="text-xs px-2 py-1 h-auto data-[state=active]:bg-background data-[state=active]:shadow" title={formInfo.title}>
                    {formInfo.title.length > 30 ? formInfo.title.substring(0,27) + '...' : formInfo.title}
                  </TabsTrigger>
                ))}
              </TabsList>
            </ScrollArea>
            {displayableForms.map(formInfo => {
              return (
                <TabsContent key={formInfo.id} value={formInfo.id} className="flex-1 overflow-hidden mt-0 p-1 sm:p-2">
                  <DataViewer
                    formTitle={formInfo.title}
                    formFields={formInfo.fields}
                    dataEntries={formInfo.entries}
                  />
                </TabsContent>
              );
            })}
          </Tabs>
        )}
        
        <DialogFooter className="p-4 pt-2 border-t shrink-0">
          <Button type="button" variant="outline" size="default" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
