
"use client";

import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Upload, Palette, Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { AppDataExportDTO } from '@/application/dto/app-data-export.dto';

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
import { IndexedDBDataEntryLogRepository } from '@/infrastructure/persistence/indexeddb/indexeddb-data-entry-log.repository'; // New

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


export default function SettingsPage() {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Instantiate repositories
  const spaceRepository = useMemo(() => new IndexedDBSpaceRepository(), []);
  const actionDefinitionRepository = useMemo(() => new IndexedDBActionDefinitionRepository(), []); 
  const actionLogRepository = useMemo(() => new IndexedDBActionLogRepository(), []); 
  const problemRepository = useMemo(() => new IndexedDBProblemRepository(), []);
  const todoRepository = useMemo(() => new IndexedDBTodoRepository(), []);
  const userProgressRepository = useMemo(() => new IndexedDBUserProgressRepository(), []);
  const clockEventRepository = useMemo(() => new IndexedDBClockEventRepository(), []);
  const dataEntryLogRepository = useMemo(() => new IndexedDBDataEntryLogRepository(), []); // New

  // Instantiate use cases
  const exportAppDataUseCase = useMemo(() => new ExportAppDataUseCase(
    spaceRepository, actionDefinitionRepository, actionLogRepository, problemRepository, todoRepository, userProgressRepository, clockEventRepository, dataEntryLogRepository // Added dataEntryLogRepo
  ), [spaceRepository, actionDefinitionRepository, actionLogRepository, problemRepository, todoRepository, userProgressRepository, clockEventRepository, dataEntryLogRepository]);

  const importAppDataUseCase = useMemo(() => new ImportAppDataUseCase(
    spaceRepository, actionDefinitionRepository, actionLogRepository, problemRepository, todoRepository, userProgressRepository, clockEventRepository, dataEntryLogRepository // Added dataEntryLogRepo
  ), [spaceRepository, actionDefinitionRepository, actionLogRepository, problemRepository, todoRepository, userProgressRepository, clockEventRepository, dataEntryLogRepository]);
  
  const clearAllDataUseCase = useMemo(() => new ClearAllDataUseCase(
    spaceRepository, actionDefinitionRepository, actionLogRepository, problemRepository, todoRepository, userProgressRepository, clockEventRepository, dataEntryLogRepository // Added dataEntryLogRepo
  ), [spaceRepository, actionDefinitionRepository, actionLogRepository, problemRepository, todoRepository, userProgressRepository, clockEventRepository, dataEntryLogRepository]);


  const handleExportData = async () => {
    setIsExporting(true);
    toast({ title: "Exporting Data...", description: "Please wait while your data is prepared." });
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
        toast({ title: "Export Successful!", description: "Your data has been downloaded." });
      } else {
        toast({ title: "Export Failed", description: "Could not prepare data for export.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Export error:", error);
      toast({ title: "Export Error", description: String(error) || "An unknown error occurred.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsImporting(true);
      toast({ title: "Importing Data...", description: "Please wait while your data is processed." });
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const jsonString = e.target?.result as string;
          const data = JSON.parse(jsonString) as AppDataExportDTO;
          const success = await importAppDataUseCase.execute(data);
          if (success) {
            toast({ title: "Import Successful!", description: "Your data has been imported. You may need to refresh the app." });
          } else {
            toast({ title: "Import Failed", description: "Could not import data. File might be corrupted or invalid.", variant: "destructive" });
          }
        } catch (error) {
          console.error("Import error:", error);
          toast({ title: "Import Error", description: "Invalid JSON file or " + String(error), variant: "destructive" });
        } finally {
          setIsImporting(false);
        }
      };
      reader.readAsText(file);
    }
    event.target.value = '';
  };

  const handleClearAllData = async () => {
    toast({ title: "Clearing Data...", description: "Please wait." });
    try {
        await clearAllDataUseCase.execute();
        toast({ title: "Data Cleared", description: "All application data has been removed. You may need to refresh." });
    } catch (error) {
        console.error("Clear data error:", error);
        toast({ title: "Error Clearing Data", description: String(error) || "Could not clear data.", variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header pageTitle="Application Settings" />
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 flex-grow">
        <div className="space-y-10 max-w-2xl mx-auto">
          
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center"><Download className="mr-3 h-7 w-7 text-primary"/>Data Management</CardTitle>
              <CardDescription className="text-md">Export your application data or import a previous backup.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleExportData} className="w-full text-lg py-3" disabled={isExporting || isImporting} size="lg">
                {isExporting ? "Exporting..." : "Export All Data"}
              </Button>
              <div>
                <label htmlFor="import-file" className="block w-full">
                  <Button asChild className="w-full text-lg py-3" variant="outline" disabled={isImporting || isExporting} size="lg">
                    <span><Upload className="mr-2 h-5 w-5" /> {isImporting ? "Importing..." : "Import Data from JSON"}</span>
                  </Button>
                  <input type="file" id="import-file" accept=".json" onChange={handleImportData} className="hidden" />
                </label>
                <p className="text-xs text-muted-foreground mt-1">Importing will overwrite existing data.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center"><Palette className="mr-3 h-7 w-7 text-primary"/>Customization</CardTitle>
              <CardDescription className="text-md">Personalize your Okapi Workflow experience (coming soon).</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-md">Theme options and space color palette customizations will be available here in a future update.</p>
            </CardContent>
          </Card>

           <Card className="border-destructive shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center text-destructive"><Trash2 className="mr-3 h-7 w-7"/>Danger Zone</CardTitle>
              <CardDescription className="text-md text-destructive/80">Be careful, these actions are irreversible.</CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full text-lg py-3" size="lg">
                    Clear All Application Data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-2xl flex items-center"><AlertTriangle className="mr-2 h-6 w-6 text-destructive" />Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription className="text-md">
                      This action cannot be undone. This will permanently delete all your spaces, actions, tasks, and progress.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="text-md px-4 py-2">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleClearAllData}
                      className="bg-destructive hover:bg-destructive/90 text-destructive-foreground text-md px-4 py-2"
                    >
                      Yes, delete all data
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
