// src/components/dialogs/data-viewer-dialog.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
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
import type { ActionDefinition } from '@/domain/entities/action-definition.entity';
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
  actionDefinitions: ActionDefinition[];
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

  const dataEntryActionDefinitions = actionDefinitions.filter(
    ad => ad.type === 'data-entry' && ad.formFields && ad.formFields.length > 0
  );

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

  const getFilteredEntries = (actionDefId: string) => {
    return allDataEntries.filter(entry => entry.actionDefinitionId === actionDefId);
  };
  
  const relevantActionDefinitions = dataEntryActionDefinitions.filter(ad => 
    allDataEntries.some(entry => entry.actionDefinitionId === ad.id)
  );


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
            View submitted data entries for each collection form.
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

        {!isLoading && !error && relevantActionDefinitions.length === 0 && (
           <div className="flex-1 flex flex-col justify-center items-center text-center p-4">
            <ListFilter className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No data-entry actions with logged data found.</p>
            <p className="text-sm text-muted-foreground">Define a data-entry action and log some data to see it here.</p>
          </div>
        )}

        {!isLoading && !error && relevantActionDefinitions.length > 0 && (
          <Tabs defaultValue={relevantActionDefinitions[0]?.id} className="flex-1 flex flex-col overflow-hidden p-1 sm:p-2">
            <ScrollArea className="shrink-0">
              <TabsList className="mb-2 bg-muted/60 p-1 h-auto flex-wrap justify-start">
                {relevantActionDefinitions.map(ad => (
                  <TabsTrigger key={ad.id} value={ad.id} className="text-xs px-2 py-1 h-auto data-[state=active]:bg-background data-[state=active]:shadow">
                    {ad.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </ScrollArea>
            {relevantActionDefinitions.map(ad => {
              const filteredEntries = getFilteredEntries(ad.id);
              return (
                <TabsContent key={ad.id} value={ad.id} className="flex-1 overflow-hidden mt-0 p-1 sm:p-2">
                  <DataViewer
                    actionDefinition={ad}
                    dataEntries={filteredEntries}
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
