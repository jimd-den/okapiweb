
// src/components/space-tabs/problem-tracker.tsx
"use client";

import type { FormEvent } from 'react';
import { useState, useEffect, useCallback } from 'react';
import type { Problem } from '@/domain/entities';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CreateProblemInputDTO, CreateProblemUseCase, UpdateProblemInputDTO, UpdateProblemUseCase, DeleteProblemUseCase, GetProblemsBySpaceUseCase } from '@/application/use-cases';
import { ProblemItem } from './problem-item';
import { useImageCaptureDialog, type UseImageCaptureDialogReturn } from '@/hooks';
import { ImageCaptureDialogView } from '@/components/dialogs';
import { Alert, AlertDescription as UIDialogAlertDescription } from "@/components/ui/alert"; 
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage
} from '@/components/ui/form';

const problemFormSchema = z.object({
  description: z.string().min(1, { message: "Description is required." }).max(500, { message: "Description must be 500 characters or less." }),
  type: z.enum(['Issue', 'Blocker', 'Waste'], { required_error: "Problem type is required." }),
});

type ProblemFormValues = z.infer<typeof problemFormSchema>;

interface ProblemTrackerProps {
  spaceId: string;
  createProblemUseCase: CreateProblemUseCase;
  updateProblemUseCase: UpdateProblemUseCase;
  deleteProblemUseCase: DeleteProblemUseCase;
  getProblemsBySpaceUseCase: GetProblemsBySpaceUseCase;
  onItemsChanged: () => void;
}

type CaptureModeProblem = 'problemImage'; 

export function ProblemTracker({
  spaceId,
  createProblemUseCase,
  updateProblemUseCase,
  deleteProblemUseCase,
  getProblemsBySpaceUseCase,
  onItemsChanged,
}: ProblemTrackerProps) {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false); 
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [newlyAddedProblemId, setNewlyAddedProblemId] = useState<string | null>(null);

  const imageCapture: UseImageCaptureDialogReturn<Problem, CaptureModeProblem> = useImageCaptureDialog<Problem, CaptureModeProblem>();

  const form = useForm<ProblemFormValues>({
    resolver: zodResolver(problemFormSchema),
    defaultValues: {
      description: '',
      type: 'Issue',
    },
  });
  const { formState: { errors: formErrors, isSubmitting: isFormSubmitting }, control, handleSubmit, reset: resetFormHook, setError: setFormError } = form;

  const sortProblems = useCallback((problemList: Problem[]) => {
    return [...problemList].sort((a, b) => {
      if (a.resolved === b.resolved) return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      return a.resolved ? 1 : -1;
    });
  }, []);
  
  const fetchProblems = useCallback(async () => {
    if (!spaceId || !getProblemsBySpaceUseCase) {
      setFetchError("Configuration error in ProblemTracker.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await getProblemsBySpaceUseCase.execute(spaceId);
      setProblems(sortProblems(data));
    } catch (err: any) {
      console.error("Failed to fetch problems:", err);
      setFetchError(err.message || "Could not load problems. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [spaceId, getProblemsBySpaceUseCase, sortProblems]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  const handleOpenImageCaptureForProblem = useCallback((problem: Problem) => {
    imageCapture.handleOpenImageCaptureDialog(problem, 'problemImage');
  }, [imageCapture]);

  const onProblemFormSubmit = async (values: ProblemFormValues) => {
    setIsSubmittingAction(true); 
    try {
      const newProblemData: CreateProblemInputDTO = { 
        spaceId, 
        description: values.description, 
        type: values.type 
      };
      const newProblem = await createProblemUseCase.execute(newProblemData);
      setProblems(prev => sortProblems([newProblem, ...prev]));
      setNewlyAddedProblemId(newProblem.id);
      setTimeout(() => setNewlyAddedProblemId(null), 1000);
      resetFormHook();
      onItemsChanged();
    } catch (error: any) {
      setFormError("root", { type: "manual", message: error.message || "Could not save problem." });
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleToggleResolved = useCallback(async (problem: Problem, resolutionNotes?: string) => {
    setIsSubmittingAction(true);
    const originalProblems = [...problems];
    try {
      const updatedProblemUI = { ...problem, resolved: !problem.resolved, resolutionNotes: !problem.resolved ? (resolutionNotes || problem.resolutionNotes) : undefined, lastModifiedDate: new Date().toISOString() };
      setProblems(prev => sortProblems(prev.map(p => p.id === updatedProblemUI.id ? updatedProblemUI : p)));

      await updateProblemUseCase.execute({
        id: problem.id,
        resolved: !problem.resolved,
        resolutionNotes: !problem.resolved ? (resolutionNotes || undefined) : undefined
      });
      onItemsChanged();
    } catch (error: any) {
      console.error("Error toggling problem resolved state:", error);
      setFormError("root", { type: "manual", message: error.message || "Could not update problem resolved state." });
      setProblems(originalProblems); 
    } finally {
      setIsSubmittingAction(false);
    }
  }, [problems, updateProblemUseCase, sortProblems, onItemsChanged, setFormError]);

  const handleDeleteProblem = useCallback(async (id: string) => {
    setIsSubmittingAction(true);
    const originalProblems = [...problems];
    try {
      await deleteProblemUseCase.execute(id);
      setProblems(prev => sortProblems(prev.filter(p => p.id !== id)));
      onItemsChanged();
    } catch (error: any) {
      console.error("Error deleting problem:", error);
      setFormError("root", { type: "manual", message: error.message || "Could not delete problem." });
      setProblems(originalProblems);
    } finally {
      setIsSubmittingAction(false);
    }
  }, [problems, deleteProblemUseCase, onItemsChanged, sortProblems, setFormError]);

  const handleUpdateDetails = useCallback(async (id: string, newDescription: string, newType: Problem['type'], newResolutionNotes?: string, newImageDataUri?: string | null ) => {
    setIsSubmittingAction(true);
    const originalProblems = [...problems];
    try {
      const currentProblem = problems.find(p => p.id === id);
      if(!currentProblem) throw new Error("Problem not found for update.");

      const updatedProblemUI: Problem = {
        ...currentProblem,
        description: newDescription,
        type: newType,
        resolutionNotes: newResolutionNotes !== undefined ? newResolutionNotes : currentProblem.resolutionNotes,
        imageDataUri: newImageDataUri !== undefined ? (newImageDataUri === null ? undefined : newImageDataUri) : currentProblem.imageDataUri,
        lastModifiedDate: new Date().toISOString(),
      };
      setProblems(prev => sortProblems(prev.map(p => p.id === id ? updatedProblemUI : p)));
      
      const updatePayload: UpdateProblemInputDTO = {
        id,
        description: newDescription,
        type: newType,
        resolved: currentProblem.resolved, 
        resolutionNotes: newResolutionNotes,
      };

      if (newImageDataUri !== undefined) {
        updatePayload.imageDataUri = newImageDataUri;
      }

      await updateProblemUseCase.execute(updatePayload);
      onItemsChanged();
    } catch (error: any) {
      console.error("Error updating problem details:", error);
      setProblems(originalProblems); 
      throw error; 
    } finally {
      setIsSubmittingAction(false);
    }
  }, [problems, updateProblemUseCase, sortProblems, onItemsChanged]);
  
  const handleCaptureAndSaveImage = useCallback(async () => {
    if (!imageCapture.videoRef.current || !imageCapture.canvasRef.current || !imageCapture.selectedItemForImage) return;
    imageCapture.setIsCapturingImage(true);
    
    const video = imageCapture.videoRef.current;
    const canvas = imageCapture.canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
     if (!context) {
        setFormError("root", { type: "manual", message: "Could not get canvas context for image capture."});
        imageCapture.setIsCapturingImage(false);
        return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageDataUri = canvas.toDataURL('image/jpeg', 0.8);

    setIsSubmittingAction(true); 
    try {
      await handleUpdateDetails(
        imageCapture.selectedItemForImage.id, 
        imageCapture.selectedItemForImage.description, 
        imageCapture.selectedItemForImage.type, 
        imageCapture.selectedItemForImage.resolutionNotes,
        imageDataUri
      );
      imageCapture.handleCloseImageCaptureDialog();
    } catch (error: any) {
      setFormError("root", { type: "manual", message: error.message || "Could not save image." });
    } finally {
      imageCapture.setIsCapturingImage(false);
      setIsSubmittingAction(false);
    }
  }, [imageCapture, handleUpdateDetails, setFormError]);

  const handleRemoveImage = useCallback(async (problemId: string) => {
    const problem = problems.find(p => p.id === problemId);
    if (!problem) return;
    setIsSubmittingAction(true);
    const originalProblems = [...problems];
    try {
        await handleUpdateDetails(
            problem.id,
            problem.description,
            problem.type,
            problem.resolutionNotes,
            null 
        );
    } catch (error: any) {
        setFormError("root", { type: "manual", message: error.message || "Could not remove image." });
        setProblems(originalProblems);
    } finally {
        setIsSubmittingAction(false);
    }
  }, [problems, handleUpdateDetails, setFormError]);

  return (
    <>
      <Card className="shadow-lg h-full flex flex-col">
        <CardHeader className="shrink-0">
          <CardTitle className="text-xl">Problem Tracker</CardTitle>
          <CardDescription>Log and manage wastes, blockers, or general issues.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col overflow-hidden p-0 sm:p-4">
          <Form {...form}>
            <form onSubmit={handleSubmit(onProblemFormSubmit)} className="mb-6 p-4 border rounded-lg space-y-3 shrink-0">
              {formErrors.root && (
                  <Alert variant="destructive" className="mb-3">
                      <AlertTriangle className="h-4 w-4" />
                      <UIDialogAlertDescription>{formErrors.root.message}</UIDialogAlertDescription>
                  </Alert>
              )}
              <FormField
                control={control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Describe the problem or waste..."
                        className="text-md p-2 min-h-[80px]"
                        disabled={isSubmittingAction || isFormSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <FormField
                  control={control}
                  name="type"
                  render={({ field }) => (
                    <FormItem className="sm:w-1/3 w-full">
                       <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmittingAction || isFormSubmitting}>
                        <FormControl>
                          <SelectTrigger className="text-md p-2 h-auto">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Issue" className="text-md">Issue</SelectItem>
                          <SelectItem value="Blocker" className="text-md">Blocker</SelectItem>
                          <SelectItem value="Waste" className="text-md">Waste</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full sm:w-auto text-md" disabled={isSubmittingAction || isFormSubmitting}>
                  {(isSubmittingAction || isFormSubmitting) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-5 w-5" />}
                  Log Problem
                </Button>
              </div>
            </form>
          </Form>

          <div className="flex-1 overflow-hidden">
            {isLoading && (
              <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="ml-2 text-muted-foreground">Loading problems...</p>
              </div>
            )}
            {!isLoading && fetchError && (
                <div className="p-4">
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <UIDialogAlertDescription>{fetchError}</UIDialogAlertDescription>
                    </Alert>
                </div>
            )}
            {!isLoading && !fetchError && problems.length === 0 && (
              <div className="flex justify-center items-center h-full">
                  <p className="text-muted-foreground text-center py-4">No problems logged yet.</p>
              </div>
            )}
            
            {!isLoading && !fetchError && problems.length > 0 && (
              <ScrollArea className="h-full pr-3">
                <ul className="space-y-3">
                  {problems.map(problem => (
                    <ProblemItem
                      key={problem.id}
                      problem={problem}
                      onToggleResolved={handleToggleResolved}
                      onDelete={handleDeleteProblem}
                      onUpdateDetails={handleUpdateDetails}
                      onOpenImageCapture={handleOpenImageCaptureForProblem}
                      onRemoveImage={handleRemoveImage}
                      isSubmittingParent={isSubmittingAction}
                      isNewlyAdded={problem.id === newlyAddedProblemId}
                    />
                  ))}
                </ul>
              </ScrollArea>
            )}
          </div>
        </CardContent>
      </Card>

      <ImageCaptureDialogView
        isOpen={imageCapture.showCameraDialog}
        onClose={imageCapture.handleCloseImageCaptureDialog}
        dialogTitle="Capture Image for Problem"
        itemDescription={imageCapture.selectedItemForImage?.description}
        videoRef={imageCapture.videoRef}
        canvasRef={imageCapture.canvasRef}
        videoDevices={imageCapture.videoDevices}
        selectedDeviceId={imageCapture.selectedDeviceId}
        onDeviceChange={imageCapture.handleDeviceChange}
        hasCameraPermission={imageCapture.hasCameraPermission}
        isCheckingPermission={imageCapture.isCheckingPermission}
        stream={imageCapture.stream}
        onCaptureAndSave={handleCaptureAndSaveImage}
        isCapturingImage={imageCapture.isCapturingImage}
      />
    </>
  );
}
