// src/components/space-tabs/problem-tracker.tsx
"use client";

import type { ChangeEvent, FormEvent } from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import type { Problem } from '@/domain/entities/problem.entity';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Loader2, Camera, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { CreateProblemInputDTO, CreateProblemUseCase } from '@/application/use-cases/problem/create-problem.usecase';
import type { UpdateProblemInputDTO, UpdateProblemUseCase } from '@/application/use-cases/problem/update-problem.usecase';
import type { DeleteProblemUseCase } from '@/application/use-cases/problem/delete-problem.usecase';
import type { GetProblemsBySpaceUseCase } from '@/application/use-cases/problem/get-problems-by-space.usecase';
import { ProblemItem } from './problem-item';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription as DialogDesc
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useImageCaptureDialog } from '@/hooks/use-image-capture-dialog';

interface ProblemTrackerProps {
  spaceId: string;
  createProblemUseCase: CreateProblemUseCase;
  updateProblemUseCase: UpdateProblemUseCase;
  deleteProblemUseCase: DeleteProblemUseCase;
  getProblemsBySpaceUseCase: GetProblemsBySpaceUseCase; // Changed prop name
  onProblemsChanged: () => void;
}

type CaptureMode = 'problemImage'; // Single mode for problem images

export function ProblemTracker({
  spaceId,
  createProblemUseCase,
  updateProblemUseCase,
  deleteProblemUseCase,
  getProblemsBySpaceUseCase, // Changed prop name
  onProblemsChanged,
}: ProblemTrackerProps) {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newProblemDescription, setNewProblemDescription] = useState('');
  const [newProblemType, setNewProblemType] = useState<Problem['type']>('Issue');
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  const {
    showCameraDialog,
    selectedItemForImage: selectedProblemForImage,
    // captureMode is not strictly needed if there's only one mode for problems
    videoDevices,
    selectedDeviceId,
    hasCameraPermission,
    isCheckingPermission,
    stream,
    isCapturingImage,
    setIsCapturingImage: setIsHookCapturingImage, // Use a more specific setter name from hook
    videoRef,
    canvasRef,
    handleOpenImageCaptureDialog: baseHandleOpenImageCaptureDialog,
    handleCloseImageCaptureDialog,
    handleDeviceChange,
  } = useImageCaptureDialog<Problem, CaptureMode>();

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
      const data = await getProblemsBySpaceUseCase.execute(spaceId); // Use changed prop name
      setProblems(sortProblems(data));
    } catch (err) {
      console.error("Failed to fetch problems:", err);
      toast({ title: "Error Loading Problems", description: String(err), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [spaceId, getProblemsBySpaceUseCase, sortProblems, toast]); // Use changed prop name

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  const handleOpenImageCaptureForProblem = (problem: Problem) => {
    baseHandleOpenImageCaptureDialog(problem, 'problemImage');
  };

  const resetNewProblemForm = () => {
    setNewProblemDescription('');
    setNewProblemType('Issue');
  };

  const handleAddProblem = async (event: FormEvent) => {
    event.preventDefault();
    if (!newProblemDescription.trim()) {
      toast({ title: "Description is required.", variant: "destructive" });
      return;
    }
    setIsSubmittingNew(true);
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
      setIsSubmittingNew(false);
    }
  };

  const handleToggleResolved = async (problem: Problem, resolutionNotes?: string) => {
    setIsSubmittingNew(true); // Use a general submitting state for simplicity or add item-specific
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
      setIsSubmittingNew(false);
    }
  };

  const handleDeleteProblem = async (id: string) => {
    setIsSubmittingNew(true);
    try {
      await deleteProblemUseCase.execute(id);
      setProblems(prev => prev.filter(p => p.id !== id));
      toast({ title: "Problem Deleted" });
      onProblemsChanged();
    } catch (error: any) {
      toast({ title: "Error Deleting Problem", description: error.message || "Could not delete.", variant: "destructive" });
    } finally {
      setIsSubmittingNew(false);
    }
  };

  const handleUpdateDetails = async (id: string, newDescription: string, newType: Problem['type'], newResolutionNotes?: string) => {
    setIsSubmittingNew(true);
    try {
      const currentProblem = problems.find(p => p.id === id);
      if(!currentProblem) return;

      const updated = await updateProblemUseCase.execute({
        id,
        description: newDescription,
        type: newType,
        resolved: currentProblem.resolved,
        resolutionNotes: newResolutionNotes,
      });
      setProblems(prev => sortProblems(prev.map(p => p.id === updated.id ? updated : p)));
      toast({ title: "Problem Details Updated" });
      onProblemsChanged();
    } catch (error: any) {
      toast({ title: "Error Updating Problem", description: error.message || "Could not save changes.", variant: "destructive" });
    } finally {
      setIsSubmittingNew(false);
    }
  };
  
  const handleCaptureAndSaveImage = async () => {
    if (!videoRef.current || !canvasRef.current || !selectedProblemForImage) return;
    setIsHookCapturingImage(true);
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
     if (!context) {
        toast({title: "Error", description: "Could not get canvas context.", variant: "destructive"});
        setIsHookCapturingImage(false);
        return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageDataUri = canvas.toDataURL('image/jpeg', 0.8);

    try {
      const updatedProblem = await updateProblemUseCase.execute({ id: selectedProblemForImage.id, imageDataUri });
      setProblems(prev => sortProblems(prev.map(p => p.id === updatedProblem.id ? updatedProblem : p)));
      toast({ title: "Image Saved!", description: `Image for "${selectedProblemForImage.description}" updated.`, duration: 3000 });
      onProblemsChanged();
      handleCloseImageCaptureDialog();
    } catch (error: any) {
      toast({ title: "Error Saving Image", description: error.message || "Could not save image.", variant: "destructive" });
    } finally {
      setIsHookCapturingImage(false);
    }
  };

  const handleRemoveImage = async (problemId: string) => {
    const problem = problems.find(p => p.id === problemId);
    if (!problem) return;
    setIsSubmittingNew(true);
    try {
        const updatedProblem = await updateProblemUseCase.execute({ id: problemId, imageDataUri: null });
        setProblems(prev => sortProblems(prev.map(p => p.id === updatedProblem.id ? updatedProblem : p)));
        toast({ title: "Image Removed", description: `Image for "${problem.description}" removed.` });
        onProblemsChanged();
    } catch (error: any) {
        toast({ title: "Error Removing Image", description: error.message || "Could not remove image.", variant: "destructive" });
    } finally {
        setIsSubmittingNew(false);
    }
  };

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
              disabled={isSubmittingNew}
            />
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <Select value={newProblemType} onValueChange={(val: Problem['type']) => setNewProblemType(val)} disabled={isSubmittingNew}>
                <SelectTrigger className="text-md p-2 h-auto sm:w-1/3">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Issue" className="text-md">Issue</SelectItem>
                  <SelectItem value="Blocker" className="text-md">Blocker</SelectItem>
                  <SelectItem value="Waste" className="text-md">Waste</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" className="w-full sm:w-auto text-md" disabled={isSubmittingNew}>
                {isSubmittingNew ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-5 w-5" />}
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
                  isSubmitting={isSubmittingNew} // Pass down the general submitting state
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Image Capture Dialog */}
      <Dialog open={showCameraDialog} onOpenChange={(open) => !open && handleCloseImageCaptureDialog()}>
        <DialogContent className="sm:max-w-lg p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-2xl">Capture Image for Problem</DialogTitle>
            <DialogDesc>
              Problem: {selectedProblemForImage?.description}
            </DialogDesc>
          </DialogHeader>
          <div className="px-6 py-4 space-y-4">
            {isCheckingPermission && (
                <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" /> Checking camera permission...
                </div>
            )}
            {hasCameraPermission === false && !isCheckingPermission && (
                <Alert variant="destructive">
                  <AlertTitle>Camera Access Required</AlertTitle>
                  <AlertDescription>
                    Please allow camera access in your browser settings and refresh.
                  </AlertDescription>
                </Alert>
            )}
            {hasCameraPermission && videoDevices.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="problem-camera-select">Select Camera:</Label>
                <Select value={selectedDeviceId || ''} onValueChange={handleDeviceChange}>
                  <SelectTrigger id="problem-camera-select">
                    <SelectValue placeholder="Select a camera" />
                  </SelectTrigger>
                  <SelectContent>
                    {videoDevices.map(device => (
                      <SelectItem key={device.deviceId} value={device.deviceId}>
                        {device.label || `Camera ${videoDevices.indexOf(device) + 1}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="relative aspect-video bg-muted overflow-hidden">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
             {!stream && hasCameraPermission && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                </div>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <DialogFooter className="p-6 pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={handleCloseImageCaptureDialog} disabled={isCapturingImage}>Cancel</Button>
            </DialogClose>
            <Button 
              onClick={handleCaptureAndSaveImage} 
              disabled={!stream || isCapturingImage || !hasCameraPermission}
            >
              {isCapturingImage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Capture & Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
