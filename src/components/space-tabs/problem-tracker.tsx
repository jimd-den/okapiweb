
// src/components/space-tabs/problem-tracker.tsx
"use client";

import type { ChangeEvent, FormEvent } from 'react';
import { useState, useEffect, useCallback } from 'react';
import type { Problem } from '@/domain/entities/problem.entity';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CreateProblemInputDTO, CreateProblemUseCase } from '@/application/use-cases/problem/create-problem.usecase';
import type { UpdateProblemInputDTO, UpdateProblemUseCase } from '@/application/use-cases/problem/update-problem.usecase';
import type { DeleteProblemUseCase } from '@/application/use-cases/problem/delete-problem.usecase';
import type { GetProblemsBySpaceUseCase } from '@/application/use-cases/problem/get-problems-by-space.usecase';
import { ProblemItem } from './problem-item';
import { useImageCaptureDialog, type UseImageCaptureDialogReturn } from '@/hooks/use-image-capture-dialog';
import { ImageCaptureDialogView } from '@/components/dialogs/image-capture-dialog-view';
import { Alert, AlertDescription } from "@/components/ui/alert";


interface ProblemTrackerProps {
  spaceId: string;
  createProblemUseCase: CreateProblemUseCase;
  updateProblemUseCase: UpdateProblemUseCase;
  deleteProblemUseCase: DeleteProblemUseCase;
  getProblemsBySpaceUseCase: GetProblemsBySpaceUseCase;
  onItemsChanged: () => void; // Renamed from onProblemsChanged for consistency
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
  const [newProblemDescription, setNewProblemDescription] = useState('');
  const [newProblemType, setNewProblemType] = useState<Problem['type']>('Issue');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false); 
  const [error, setError] = useState<string | null>(null); 
  const [newlyAddedProblemId, setNewlyAddedProblemId] = useState<string | null>(null);


  const imageCapture: UseImageCaptureDialogReturn<Problem, CaptureModeProblem> = useImageCaptureDialog<Problem, CaptureModeProblem>();

  const sortProblems = useCallback((problemList: Problem[]) => {
    return [...problemList].sort((a, b) => {
      if (a.resolved === b.resolved) return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      return a.resolved ? 1 : -1;
    });
  }, []);
  
  const fetchProblems = useCallback(async () => {
    if (!spaceId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getProblemsBySpaceUseCase.execute(spaceId);
      setProblems(sortProblems(data));
    } catch (err: any) {
      console.error("Failed to fetch problems:", err);
      setError(err.message || "Could not load problems. Please try again.");
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

  const resetNewProblemForm = useCallback(() => {
    setNewProblemDescription('');
    setNewProblemType('Issue');
    setError(null); 
  }, []);

  const handleAddProblem = useCallback(async (event: FormEvent) => {
    event.preventDefault();
    if (!newProblemDescription.trim()) {
      setError("Description is required.");
      return;
    }
    setIsSubmittingAction(true);
    setError(null);
    try {
      const newProblemData: CreateProblemInputDTO = { spaceId, description: newProblemDescription, type: newProblemType };
      const newProblem = await createProblemUseCase.execute(newProblemData);
      // Optimistically add to local state
      setProblems(prev => sortProblems([newProblem, ...prev]));
      setNewlyAddedProblemId(newProblem.id);
      setTimeout(() => setNewlyAddedProblemId(null), 1000);
      resetNewProblemForm();
      onItemsChanged();
    } catch (error: any) {
      setError(error.message || "Could not save problem.");
    } finally {
      setIsSubmittingAction(false);
    }
  }, [spaceId, newProblemDescription, newProblemType, createProblemUseCase, sortProblems, resetNewProblemForm, onItemsChanged]);

  const handleToggleResolved = useCallback(async (problem: Problem, resolutionNotes?: string) => {
    setIsSubmittingAction(true);
    setError(null); 
    const originalProblems = problems;
    try {
      // Optimistic UI update
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
      setError(error.message || "Could not update problem resolved state.");
      setProblems(originalProblems); // Revert
    } finally {
      setIsSubmittingAction(false);
    }
  }, [problems, updateProblemUseCase, sortProblems, onItemsChanged]);

  const handleDeleteProblem = useCallback(async (id: string) => {
    // Optimistic UI update handled by ProblemItem's local isDeleting state for animation
    setIsSubmittingAction(true);
    setError(null);
    try {
      await deleteProblemUseCase.execute(id);
      setProblems(prev => sortProblems(prev.filter(p => p.id !== id)));
      onItemsChanged();
    } catch (error: any) {
      console.error("Error deleting problem:", error);
      setError(error.message || "Could not delete problem.");
    } finally {
      setIsSubmittingAction(false);
    }
  }, [deleteProblemUseCase, onItemsChanged, sortProblems]);

  const handleUpdateDetails = useCallback(async (id: string, newDescription: string, newType: Problem['type'], newResolutionNotes?: string, newImageDataUri?: string | null ) => {
    setIsSubmittingAction(true);
    setError(null);
    const originalProblems = problems;
    try {
      const currentProblem = problems.find(p => p.id === id);
      if(!currentProblem) throw new Error("Problem not found for update.");

      // Optimistic UI Update
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
        resolved: currentProblem.resolved, // Keep resolved state from original for this specific update
        resolutionNotes: newResolutionNotes,
      };

      if (newImageDataUri !== undefined) {
        updatePayload.imageDataUri = newImageDataUri;
      }

      await updateProblemUseCase.execute(updatePayload);
      onItemsChanged();
    } catch (error: any) {
      console.error("Error updating problem details:", error);
      setProblems(originalProblems); // Revert
      throw error; 
    } finally {
      setIsSubmittingAction(false);
    }
  }, [problems, updateProblemUseCase, sortProblems, onItemsChanged]);
  
  const handleCaptureAndSaveImage = useCallback(async () => {
    if (!imageCapture.videoRef.current || !imageCapture.canvasRef.current || !imageCapture.selectedItemForImage) return;
    imageCapture.setIsCapturingImage(true);
    setError(null);
    
    const video = imageCapture.videoRef.current;
    const canvas = imageCapture.canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
     if (!context) {
        setError("Could not get canvas context for image capture.");
        imageCapture.setIsCapturingImage(false);
        return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageDataUri = canvas.toDataURL('image/jpeg', 0.8);

    setIsSubmittingAction(true); 
    try {
      // Use handleUpdateDetails to save the image, this already updates local state optimistically
      await handleUpdateDetails(
        imageCapture.selectedItemForImage.id, 
        imageCapture.selectedItemForImage.description, 
        imageCapture.selectedItemForImage.type, 
        imageCapture.selectedItemForImage.resolutionNotes,
        imageDataUri
      );
      imageCapture.handleCloseImageCaptureDialog();
    } catch (error: any) {
      setError(error.message || "Could not save image.");
    } finally {
      imageCapture.setIsCapturingImage(false);
      setIsSubmittingAction(false);
    }
  }, [imageCapture, handleUpdateDetails]);

  const handleRemoveImage = useCallback(async (problemId: string) => {
    const problem = problems.find(p => p.id === problemId);
    if (!problem) return;
    setIsSubmittingAction(true);
    setError(null);
    try {
        // Use handleUpdateDetails to remove the image by passing null
        await handleUpdateDetails(
            problem.id,
            problem.description,
            problem.type,
            problem.resolutionNotes,
            null // Signal to remove the image
        );
    } catch (error: any) {
        setError(error.message || "Could not remove image.");
    } finally {
        setIsSubmittingAction(false);
    }
  }, [problems, handleUpdateDetails]);

  if (isLoading) {
    return <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2 text-muted-foreground">Loading problems...</p></div>;
  }

  return (
    <>
      <Card className="mt-4 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Problem Tracker</CardTitle>
          <CardDescription>Log and manage wastes, blockers, or general issues.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddProblem} className="mb-6 p-4 border rounded-lg space-y-3">
            {error && (
                <Alert variant="destructive" className="mb-3">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            <Textarea
              value={newProblemDescription}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => { setNewProblemDescription(e.target.value); setError(null);}}
              placeholder="Describe the problem or waste..."
              className="text-md p-2 min-h-[80px]"
              required
              disabled={isSubmittingAction}
            />
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <Select value={newProblemType} onValueChange={(val: Problem['type']) => setNewProblemType(val)} disabled={isSubmittingAction}>
                <SelectTrigger className="text-md p-2 h-auto sm:w-1/3">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Issue" className="text-md">Issue</SelectItem>
                  <SelectItem value="Blocker" className="text-md">Blocker</SelectItem>
                  <SelectItem value="Waste" className="text-md">Waste</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" className="w-full sm:w-auto text-md" disabled={isSubmittingAction}>
                {isSubmittingAction ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-5 w-5" />}
                Log Problem
              </Button>
            </div>
          </form>

          {problems.length === 0 && !error && !isLoading && (
            <p className="text-muted-foreground text-center py-4">No problems logged yet.</p>
          )}
          
          {problems.length > 0 && (
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
          )}
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

    