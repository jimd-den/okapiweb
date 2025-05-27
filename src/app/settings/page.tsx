
"use client";

import { useState, useMemo, useCallback } from 'react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Upload, Palette, Trash2, AlertTriangle as AlertTriangleIcon, Loader2, CheckCircle } from 'lucide-react';
import type { AppDataExportDTO } from '@/application/dto/app-data-export.dto';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';

import { ExportAppDataUseCase } from '@/application/use-cases/data/export-app-data.usecase';
import { ImportAppDataUseCase } from '@/application/use-cases/data/import-app-data.usecase';
import { ClearAllDataUseCase } from '@/application/use-cases/data/clear-all-data.usecase';

import { IndexedDBSpaceRepository } from '@/infrastructure/persistence/indexeddb/indexeddb-space.repository';
import { IndexedDBActionDefinitionRepository } from '@/infrastructure/persistence/indexeddb/indexeddb-action-definition.repository';
import { IndexedDBActionLogRepository } from '@/infrastructure/persistence/indexeddb/indexeddb-action-log.repository'; 
import { IndexedDBProblemRepository } from '@/infrastructure/persistence/indexeddb/indexeddb-problem.repository';
import { IndexedDBTodoRepository } from '@/infrastructure/persistence/indexeddb/indexeddb-todo.repository';
import { IndexedDBUserProgressRepository } from '@/infrastructure/persistence/indexeddb/indexeddb-user-progress.repository';
import { IndexedDBClockEventRepository } from '@/infrastructure/persistence/indexeddb/indexeddb-clock-event.repository';
import { IndexedDBDataEntryLogRepository } from '@/infrastructure/persistence/indexeddb/indexeddb-data-entry-log.repository'; 

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription as AlertDialogDesc,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function SettingsPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [clearError, setClearError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [clearSuccess, setClearSuccess] = useState<string | null>(null);

  const spaceRepository = useMemo(() => new IndexedDBSpaceRepository(), []);
  const actionDefinitionRepository = useMemo(() => new IndexedDBActionDefinitionRepository(), []); 
  const actionLogRepository = useMemo(() => new IndexedDBActionLogRepository(), []); 
  const problemRepository = useMemo(() => new IndexedDBProblemRepository(), []);
  const todoRepository = useMemo(() => new IndexedDBTodoRepository(), []);
  const userProgressRepository = useMemo(() => new IndexedDBUserProgressRepository(), []);
  const clockEventRepository = useMemo(() => new IndexedDBClockEventRepository(), []);
  const dataEntryLogRepository = useMemo(() => new IndexedDBDataEntryLogRepository(), []); 

  const exportAppDataUseCase = useMemo(() => new ExportAppDataUseCase(
    spaceRepository, actionDefinitionRepository, actionLogRepository, problemRepository, todoRepository, userProgressRepository, clockEventRepository, dataEntryLogRepository
  ), [spaceRepository, actionDefinitionRepository, actionLogRepository, problemRepository, todoRepository, userProgressRepository, clockEventRepository, dataEntryLogRepository]);

  const importAppDataUseCase = useMemo(() => new ImportAppDataUseCase(
    spaceRepository, actionDefinitionRepository, actionLogRepository, problemRepository, todoRepository, userProgressRepository, clockEventRepository, dataEntryLogRepository
  ), [spaceRepository, actionDefinitionRepository, actionLogRepository, problemRepository, todoRepository, userProgressRepository, clockEventRepository, dataEntryLogRepository]);
  
  const clearAllDataUseCase = useMemo(() => new ClearAllDataUseCase(
    spaceRepository, actionDefinitionRepository, actionLogRepository, problemRepository, todoRepository, userProgressRepository, clockEventRepository, dataEntryLogRepository
  ), [spaceRepository, actionDefinitionRepository, actionLogRepository, problemRepository, todoRepository, userProgressRepository, clockEventRepository, dataEntryLogRepository]);

  const resetMessages = () => {
    setExportError(null); setImportError(null); setClearError(null);
    setExportSuccess(null); setImportSuccess(null); setClearSuccess(null);
  };

  const handleExportData = useCallback(async () => {
    resetMessages();
    setIsExporting(true);
    try {
      const data = await exportAppDataUseCase.execute();
      if (data) {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'okapi_workflow_game_data.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setExportSuccess("Export Successful! Your data has been downloaded.");
      } else {
        setExportError("Could not prepare data for export.");
      }
    } catch (error) {
      console.error("Export error:", error);
      setExportError(String(error) || "An unknown error occurred during export.");
    } finally {
      setIsExporting(false);
    }
  }, [exportAppDataUseCase]);

  const handleImportData = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      resetMessages();
      setIsImporting(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const jsonString = e.target?.result as string;
          const data = JSON.parse(jsonString) as AppDataExportDTO;
          const success = await importAppDataUseCase.execute(data);
          if (success) {
            setImportSuccess("Import Successful! Your data has been imported. You may need to refresh the app.");
          } else {
            setImportError("Could not import data. File might be corrupted or invalid.");
          }
        } catch (error) {
          console.error("Import error:", error);
          setImportError("Invalid JSON file or " + String(error));
        } finally {
          setIsImporting(false);
        }
      };
      reader.readAsText(file);
    }
    if(event.target) event.target.value = ''; 
  }, [importAppDataUseCase]);

  const handleClearAllData = useCallback(async () => {
    resetMessages();
    setIsClearing(true);
    try {
        await clearAllDataUseCase.execute();
        setClearSuccess("All application data has been removed. You may need to refresh.");
    } catch (error) {
        console.error("Clear data error:", error);
        setClearError(String(error) || "Could not clear data.");
    } finally {
        setIsClearing(false);
    }
  }, [clearAllDataUseCase]);

  return (
    <div className="flex flex-col h-screen">
      <Header pageTitle="Application Settings" />
      <div className="flex-grow flex flex-col overflow-hidden">
        <ScrollArea className="flex-1">
          <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <div className="space-y-6 max-w-xl mx-auto"> {/* Reduced max-width, consistent spacing */}
              
              <Card className="shadow-md rounded-xl">
                <CardHeader className="p-4">
                  <CardTitle className="text-lg flex items-center"><Download className="mr-2.5 h-5 w-5 text-primary"/>Data Management</CardTitle>
                  <CardDescription className="text-sm">Export your data or import a backup.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 p-4">
                  {exportError && <Alert variant="destructive" className="text-xs p-2"><AlertTriangleIcon className="h-4 w-4" /><AlertDescription>{exportError}</AlertDescription></Alert>}
                  {exportSuccess && <Alert variant="default" className="border-green-500 bg-green-50 text-green-700 text-xs p-2"><CheckCircle className="h-4 w-4 text-green-600" /><AlertDescription>{exportSuccess}</AlertDescription></Alert>}
                  <Button onClick={handleExportData} className="w-full text-md py-2.5 rounded-lg" disabled={isExporting || isImporting || isClearing} size="default">
                    {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isExporting ? "Exporting..." : "Export All Data"}
                  </Button>
                  
                  {importError && <Alert variant="destructive" className="text-xs p-2"><AlertTriangleIcon className="h-4 w-4" /><AlertDescription>{importError}</AlertDescription></Alert>}
                  {importSuccess && <Alert variant="default" className="border-green-500 bg-green-50 text-green-700 text-xs p-2"><CheckCircle className="h-4 w-4 text-green-600" /><AlertDescription>{importSuccess}</AlertDescription></Alert>}
                  <div>
                    <label htmlFor="import-file" className="block w-full">
                      <Button asChild className="w-full text-md py-2.5 rounded-lg" variant="outline" disabled={isImporting || isExporting || isClearing} size="default">
                        <span>
                          {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                          {isImporting ? "Importing..." : "Import Data"}
                        </span>
                      </Button>
                      <input type="file" id="import-file" accept=".json" onChange={handleImportData} className="hidden" disabled={isImporting || isExporting || isClearing}/>
                    </label>
                    <p className="text-xs text-muted-foreground mt-1 text-center">Importing will overwrite existing data.</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-md rounded-xl">
                <CardHeader className="p-4">
                  <CardTitle className="text-lg flex items-center"><Palette className="mr-2.5 h-5 w-5 text-primary"/>Customization</CardTitle>
                  <CardDescription className="text-sm">Personalize your Okapi experience (coming soon).</CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Theme options and space color palette customizations will be available here in a future update.</p>
                </CardContent>
              </Card>

              <Card className="border-destructive shadow-md rounded-xl">
                <CardHeader className="p-4">
                  <CardTitle className="text-lg flex items-center text-destructive"><Trash2 className="mr-2.5 h-5 w-5"/>Danger Zone</CardTitle>
                  <CardDescription className="text-sm text-destructive/80">Be careful, these actions are irreversible.</CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  {clearError && <Alert variant="destructive" className="mb-3 text-xs p-2"><AlertTriangleIcon className="h-4 w-4" /><AlertDescription>{clearError}</AlertDescription></Alert>}
                  {clearSuccess && <Alert variant="default" className="border-green-500 bg-green-50 text-green-700 mb-3 text-xs p-2"><CheckCircle className="h-4 w-4 text-green-600" /><AlertDescription>{clearSuccess}</AlertDescription></Alert>}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full text-md py-2.5 rounded-lg" size="default" disabled={isClearing || isExporting || isImporting}>
                        {isClearing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Clear All Data
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="p-4 sm:max-w-sm">
                      <AlertDialogHeader className="pb-2">
                        <AlertDialogTitle className="text-lg flex items-center"><AlertTriangleIcon className="mr-2 h-5 w-5 text-destructive" />Are you sure?</AlertDialogTitle>
                        <AlertDialogDesc className="text-sm">
                          This will permanently delete all your data. This action cannot be undone.
                        </AlertDialogDesc>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="pt-2">
                        <AlertDialogCancel className="text-sm px-3 py-1.5 h-auto" disabled={isClearing}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleClearAllData}
                          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground text-sm px-3 py-1.5 h-auto"
                          disabled={isClearing}
                        >
                          {isClearing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          Delete All Data
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
