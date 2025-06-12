
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
import type { GetDataEntriesBySpaceUseCase, UpdateDataEntryInputDTO } from '@/application/use-cases';
import { UpdateDataEntryUseCase } from '@/application/use-cases'; // Added import
import type { ActionDefinition, FormFieldDefinition, DataEntryLog } from '@/domain/entities';
import { Database, Loader2, AlertTriangle, ListFilter } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription as UIDialogAlertDescription } from "@/components/ui/alert";
import { BarcodeDisplayDialog } from './barcode-display-dialog';
import { DataEntryFormDialog } from './data-entry-form-dialog'; // For editing
import { IndexedDBDataEntryLogRepository, IndexedDBActionDefinitionRepository } from '@/infrastructure/persistence/indexeddb';


interface DataViewerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  spaceId: string;
  getDataEntriesBySpaceUseCase: GetDataEntriesBySpaceUseCase;
  actionDefinitions: ActionDefinition[];
}

interface DisplayableFormInfo {
  id: string;
  title: string;
  fields: FormFieldDefinition[];
  entries: DataEntryLog[];
  actionDefId: string; // original action definition id
  stepId?: string; // original step id if applicable
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

  const [isBarcodeDisplayModalOpen, setIsBarcodeDisplayModalOpen] = useState(false);
  const [currentBarcodeValue, setCurrentBarcodeValue] = useState<string | null>(null);
  
  const [isDataEntryFormOpen, setIsDataEntryFormOpen] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<DataEntryLog | null>(null);
  const [formFieldsForForm, setFormFieldsForForm] = useState<FormFieldDefinition[]>([]);
  const [dialogTitleForForm, setDialogTitleForForm] = useState("");
  const [dialogDescriptionForForm, setDialogDescriptionForForm] = useState<string | undefined>("");
  const [initialFormDataForForm, setInitialFormDataForForm] = useState<Record<string, any>>({});

  const dataEntryRepository = useMemo(() => new IndexedDBDataEntryLogRepository(), []);
  const actionDefRepository = useMemo(() => new IndexedDBActionDefinitionRepository(), []);
  const updateDataEntryUseCase = useMemo(() => new UpdateDataEntryUseCase(dataEntryRepository, actionDefRepository), [dataEntryRepository, actionDefRepository]);


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
    if (isLoading || error || !actionDefinitions.length) { // Removed allDataEntries.length check to show forms even if empty
      return [];
    }

    const forms: DisplayableFormInfo[] = [];

    actionDefinitions.forEach(ad => {
      if (ad.type === 'data-entry' && ad.formFields && ad.formFields.length > 0) {
        const entriesForThisForm = allDataEntries.filter(
          entry => entry.actionDefinitionId === ad.id && !entry.stepId
        );
        forms.push({
          id: ad.id,
          title: ad.name,
          fields: ad.formFields.sort((a, b) => a.order - b.order),
          entries: entriesForThisForm,
          actionDefId: ad.id,
        });
        
      } else if (ad.type === 'multi-step' && ad.steps) {
        ad.steps.forEach(step => {
          if (step.stepType === 'data-entry' && step.formFields && step.formFields.length > 0) {
            const entriesForThisStep = allDataEntries.filter(
              entry => entry.actionDefinitionId === ad.id && entry.stepId === step.id
            );
            forms.push({
              id: `${ad.id}_${step.id}`,
              title: `${ad.name} - Step: ${step.description.substring(0,20)}${step.description.length > 20 ? '...' : ''}`,
              fields: step.formFields.sort((a, b) => a.order - b.order),
              entries: entriesForThisStep,
              actionDefId: ad.id,
              stepId: step.id,
            });
          }
        });
      }
    });
    return forms.sort((a,b) => a.title.localeCompare(b.title));
  }, [actionDefinitions, allDataEntries, isLoading, error]);


  const handleShowBarcodeInModal = useCallback((value: string) => {
    setCurrentBarcodeValue(value);
    setIsBarcodeDisplayModalOpen(true);
  }, []);

  const handleCloseBarcodeModal = useCallback(() => {
    setIsBarcodeDisplayModalOpen(false);
    setCurrentBarcodeValue(null);
  }, []);

  const handleOpenDataEntryFormForEdit = useCallback((entry: DataEntryLog) => {
    const parentActionDef = actionDefinitions.find(ad => ad.id === entry.actionDefinitionId);
    if (!parentActionDef) {
      setError("Could not find the form definition for this entry.");
      return;
    }

    let relevantFields: FormFieldDefinition[] | undefined;
    let formTitle = parentActionDef.name;
    let formDescription = parentActionDef.description;

    if (parentActionDef.type === 'data-entry') {
      relevantFields = parentActionDef.formFields;
    } else if (parentActionDef.type === 'multi-step' && entry.stepId) {
      const step = parentActionDef.steps?.find(s => s.id === entry.stepId);
      if (step && step.stepType === 'data-entry') {
        relevantFields = step.formFields;
        formTitle = `${parentActionDef.name} - Step: ${step.description}`;
        formDescription = `Editing data for step: ${step.description}`;
      }
    }

    if (!relevantFields || relevantFields.length === 0) {
      setError("Form fields not found for this entry's definition.");
      return;
    }

    setEntryToEdit(entry);
    setFormFieldsForForm(relevantFields);
    setInitialFormDataForForm(entry.data);
    setDialogTitleForForm(`Edit Entry for: ${formTitle}`);
    setDialogDescriptionForForm(formDescription);
    setIsDataEntryFormOpen(true);

  }, [actionDefinitions]);

  const handleSubmitDataEntryLog = useCallback(async (formData: Record<string, any>, existingId?: string) => {
    if (!existingId) {
      setError("Cannot update entry: ID is missing."); // Should not happen in edit mode
      return;
    }
    try {
      const updateDTO: UpdateDataEntryInputDTO = {
        id: existingId,
        formData,
      };
      await updateDataEntryUseCase.execute(updateDTO);
      await fetchDataEntries(); // Refresh data
      setIsDataEntryFormOpen(false);
      setEntryToEdit(null);
    } catch (err: any) {
      console.error("Error updating data entry:", err);
      setError(err.message || "Failed to update entry.");
      throw err; // Re-throw to let DataEntryFormDialog handle its own error state
    }
  }, [updateDataEntryUseCase, fetchDataEntries]);


  if (!isOpen) {
    return null;
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-5xl max-h-[85vh] flex flex-col p-0">
          <DialogHeader className="p-4 pb-2 border-b shrink-0">
            <DialogTitle className="text-lg sm:text-xl flex items-center">
              <Database className="mr-2 h-5 w-5 text-purple-500"/> Data Logs
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              View and edit submitted data entries.
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
              <p className="text-muted-foreground">No data entry forms defined.</p>
              <p className="text-sm text-muted-foreground">Create an Action Definition of type "Data Entry" or a "Multi-Step" action with data entry steps.</p>
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
                  <TabsContent key={formInfo.id} value={formInfo.id} className="flex-1 mt-0 p-1 sm:p-2">
                    <DataViewer
                      formTitle={formInfo.title}
                      formFields={formInfo.fields}
                      dataEntries={formInfo.entries}
                      onShowBarcode={handleShowBarcodeInModal}
                      onEditEntry={handleOpenDataEntryFormForEdit}
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

      {isBarcodeDisplayModalOpen && currentBarcodeValue && (
        <BarcodeDisplayDialog
          isOpen={isBarcodeDisplayModalOpen}
          onClose={handleCloseBarcodeModal}
          barcodeValue={currentBarcodeValue}
          title={`Barcode`}
        />
      )}

      {isDataEntryFormOpen && (
        <DataEntryFormDialog
          isOpen={isDataEntryFormOpen}
          onClose={() => {
            setIsDataEntryFormOpen(false);
            setEntryToEdit(null);
          }}
          formFields={formFieldsForForm}
          initialFormData={initialFormDataForForm}
          onSubmitLog={handleSubmitDataEntryLog}
          dialogTitle={dialogTitleForForm}
          dialogDescription={dialogDescriptionForForm}
          existingEntryId={entryToEdit?.id}
        />
      )}
    </>
  );
}

