
// src/components/space-tabs/problem-tracker.tsx
"use client";

import type { ChangeEvent, FormEvent } from 'react';
import { useState, useEffect, useCallback } from 'react';
import type { Problem } from '@/domain/entities/problem.entity';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { CreateProblemInputDTO, CreateProblemUseCase } from '@/application/use-cases/problem/create-problem.usecase';
import type { UpdateProblemInputDTO, UpdateProblemUseCase } from '@/application/use-cases/problem/update-problem.usecase';
import type { DeleteProblemUseCase } from '@/application/use-cases/problem/delete-problem.usecase';
import type { GetProblemsBySpaceUseCase } from '@/application/use-cases/problem/get-problems-by-space.usecase';
import { ProblemItem } from './problem-item';
import { useImageCaptureDialog, type UseImageCaptureDialogReturn } from '@/hooks/use-image-capture-dialog';
import { ImageCaptureDialogView } from '@/components/dialogs/image-capture-dialog-view';


interface ProblemTrackerProps {
  spaceId: string;
  createProblemUseCase: CreateProblemUseCase;
  updateProblemUseCase: UpdateProblemUseCase;
  deleteProblemUseCase: DeleteProblemUseCase;
  getProblemsBySpaceUseCase: GetProblemsBySpaceUseCase;
  onProblemsChanged: () => void;
}

type CaptureModeProblem = 'problemImage'; 

export function ProblemTracker({
  spaceId,
  createProblemUseCase,
  updateProblemUseCase,
  deleteProblemUseCase,
  getProblemsBySpaceUseCase,
  onProblemsChanged,
}: ProblemTrackerProps) {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newProblemDescription, setNewProblemDescription] = useState('');
  const [newProblemType, setNewProblemType] = useState<Problem['type']>('Issue');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false); // General submitting state for item actions and new problem creation

  const imageCapture: UseImageCaptureDialogReturn<Problem, CaptureModeProblem> = useImageCaptureDialog<Problem, CaptureModeProblem>();
  const { toast } = useToast();

  const sortProblems = useCallback((problemList: Problem[]) => {
    return [...problemList].sort((a, b) => {
      if (a.resolved === b.resolved) return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      return a.resolved ? 1 : -1;
    });
  }, []);
  
  const fetchProblems = useCallback(async () => {
    if (!spaceId) return;
    setIsLoading(true);
    try {
      const data = await getProblemsBySpaceUseCase.execute(spaceId);
      setProblems(sortProblems(data));
    } catch (err) {
      console.error("Failed to fetch problems:", err);
      toast({ title: "Error Loading Problems", description: String(err), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [spaceId, getProblemsBySpaceUseCase, sortProblems, toast]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  const handleOpenImageCaptureForProblem = useCallback((problem: Problem) => {
    imageCapture.handleOpenImageCaptureDialog(problem, 'problemImage');
  }, [imageCapture]);

  const resetNewProblemForm = useCallback(() => {
    setNewProblemDescription('');
    setNewProblemType('Issue');
  }, []);

  const handleAddProblem = useCallback(async (event: FormEvent) => {
    event.preventDefault();
    if (!newProblemDescription.trim()) {
      toast({ title: "Description is required.", variant: "destructive" });
      return;
    }
    setIsSubmittingAction(true);
    try {
      const newProblemData: CreateProblemInputDTO = { spaceId, description: newProblemDescription, type: newProblemType };
      const newProblem = await createProblemUseCase.execute(newProblemData);
      setProblems(prev => sortProblems([newProblem, ...prev]));
      resetNewProblemForm();
      toast({ title: "Problem Logged", description: `"${newProblem.description}"` });
      onProblemsChanged();
    } catch (error: any) {
      toast({ title: "Error Logging Problem", description: error.message || "Could not save problem.", variant: "destructive" });
    } finally {
      setIsSubmittingAction(false);
    }
  }, [spaceId, newProblemDescription, newProblemType, createProblemUseCase, sortProblems, resetNewProblemForm, onProblemsChanged, toast]);

  const handleToggleResolved = useCallback(async (problem: Problem, resolutionNotes?: string) => {
    setIsSubmittingAction(true);
    try {
      const updated = await updateProblemUseCase.execute({
        id: problem.id,
        resolved: !problem.resolved,
        resolutionNotes: !problem.resolved ? (resolutionNotes || undefined) : undefined
      });
      setProblems(prev => sortProblems(prev.map(p => p.id === updated.id ? updated : p)));
      toast({ title: "Problem Updated", description: `"${updated.description}" is now ${updated.resolved ? 'resolved' : 'unresolved'}.` });
      onProblemsChanged();
    } catch (error: any) {
      toast({ title: "Error Updating Problem", description: error.message || "Could not update.", variant: "destructive" });
    } finally {
      setIsSubmittingAction(false);
    }
  }, [updateProblemUseCase, sortProblems, onProblemsChanged, toast]);

  const handleDeleteProblem = useCallback(async (id: string) => {
    setIsSubmittingAction(true);
    try {
      await deleteProblemUseCase.execute(id);
      setProblems(prev => prev.filter(p => p.id !== id));
      toast({ title: "Problem Deleted" });
      onProblemsChanged();
    } catch (error: any) {
      toast({ title: "Error Deleting Problem", description: error.message || "Could not delete.", variant: "destructive" });
    } finally {
      setIsSubmittingAction(false);
    }
  }, [deleteProblemUseCase, onProblemsChanged, toast]);

  const handleUpdateDetails = useCallback(async (id: string, newDescription: string, newType: Problem['type'], newResolutionNotes?: string, newImageDataUri?: string | null ) => {
    setIsSubmittingAction(true);
    try {
      const currentProblem = problems.find(p => p.id === id);
      if(!currentProblem) return;

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

      const updated = await updateProblemUseCase.execute(updatePayload);
      setProblems(prev => sortProblems(prev.map(p => p.id === updated.id ? updated : p)));
      toast({ title: "Problem Details Updated" });
      onProblemsChanged();
    } catch (error: any) {
      toast({ title: "Error Updating Problem", description: error.message || "Could not save changes.", variant: "destructive" });
    } finally {
      setIsSubmittingAction(false);
    }
  }, [problems, updateProblemUseCase, sortProblems, onProblemsChanged, toast]);
  
  const handleCaptureAndSaveImage = useCallback(async () => {
    if (!imageCapture.videoRef.current || !imageCapture.canvasRef.current || !imageCapture.selectedItemForImage) return;
    imageCapture.setIsCapturingImage(true);
    
    const video = imageCapture.videoRef.current;
    const canvas = imageCapture.canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
     if (!context) {
        toast({title: "Error", description: "Could not get canvas context.", variant: "destructive"});
        imageCapture.setIsCapturingImage(false);
        return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageDataUri = canvas.toDataURL('image/jpeg', 0.8);

    setIsSubmittingAction(true); // Use the general submitting state
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
      toast({ title: "Error Saving Image", description: error.message || "Could not save image.", variant: "destructive" });
    } finally {
      imageCapture.setIsCapturingImage(false);
      setIsSubmittingAction(false);
    }
  }, [imageCapture, handleUpdateDetails, toast]);

  const handleRemoveImage = useCallback(async (problemId: string) => {
    const problem = problems.find(p => p.id === problemId);
    if (!problem) return;
    setIsSubmittingAction(true);
    try {
        await handleUpdateDetails(
            problem.id,
            problem.description,
            problem.type,
            problem.resolutionNotes,
            null
        );
    } catch (error: any) {
        toast({ title: "Error Removing Image", description: error.message || "Could not remove image.", variant: "destructive" });
    } finally {
        setIsSubmittingAction(false);
    }
  }, [problems, handleUpdateDetails, toast]);

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
            <Textarea
              value={newProblemDescription}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNewProblemDescription(e.target.value)}
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

          {problems.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No problems logged yet.</p>
          ) : (
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
