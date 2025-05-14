// src/components/space-tabs/problem-tracker.tsx
"use client";

import type { ChangeEvent, FormEvent } from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import type { Problem } from '@/domain/entities/problem.entity';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, PlusCircle, Edit2, Save, XCircle, AlertTriangle, CheckCircle2, Loader2, MessageSquare, Camera, Image as ImageIcon, RefreshCw, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import type { CreateProblemInputDTO } from '@/application/use-cases/problem/create-problem.usecase';
import type { UpdateProblemInputDTO } from '@/application/use-cases/problem/update-problem.usecase';
import NextImage from 'next/image'; // Using next/image for displaying captured images
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription as DialogDesc // Alias to avoid conflict with component's CardDescription
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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


interface ProblemTrackerProps {
  spaceId: string;
  initialProblems: Problem[];
  isLoading: boolean;
  createProblem: (data: CreateProblemInputDTO) => Promise<Problem>;
  updateProblem: (data: UpdateProblemInputDTO) => Promise<Problem>;
  deleteProblem: (id: string) => Promise<void>;
  onProblemsChanged: () => void; 
}

export function ProblemTracker({
  spaceId,
  initialProblems,
  isLoading,
  createProblem,
  updateProblem,
  deleteProblem,
  onProblemsChanged,
}: ProblemTrackerProps) {
  const [problems, setProblems] = useState<Problem[]>(initialProblems);
  const [newProblemDescription, setNewProblemDescription] = useState('');
  const [newProblemType, setNewProblemType] = useState<'Waste' | 'Blocker' | 'Issue'>('Issue');
  
  const [editingProblemId, setEditingProblemId] = useState<string | null>(null);
  const [editingDescription, setEditingDescription] = useState('');
  const [editingType, setEditingType] = useState<'Waste' | 'Blocker' | 'Issue'>('Issue');
  const [editingResolutionNotes, setEditingResolutionNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Image Capture State
  const [showCameraDialog, setShowCameraDialog] = useState(false);
  const [selectedProblemForImage, setSelectedProblemForImage] = useState<Problem | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturingImage, setIsCapturingImage] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setProblems(initialProblems.sort((a,b) => {
        if (a.resolved === b.resolved) return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        return a.resolved ? 1 : -1;
      }));
  }, [initialProblems]);

  const sortProblems = (problemList: Problem[]) => {
    return [...problemList].sort((a,b) => {
        if (a.resolved === b.resolved) return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        return a.resolved ? 1 : -1;
    });
  };

  const resetForm = () => {
    setNewProblemDescription('');
    setNewProblemType('Issue');
  };

  const handleAddProblem = async (event: FormEvent) => {
    event.preventDefault();
    if (!newProblemDescription.trim()) {
      toast({ title: "Description is required.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const newProblem = await createProblem({ spaceId, description: newProblemDescription, type: newProblemType });
      setProblems(prev => sortProblems([newProblem, ...prev]));
      resetForm();
      toast({ title: "Problem Logged", description: `"${newProblem.description}"` });
      onProblemsChanged();
    } catch (error: any) {
      toast({ title: "Error Logging Problem", description: error.message || "Could not save problem.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleResolved = async (problem: Problem) => {
    const resolutionNotesToSave = editingProblemId === problem.id && problem.resolved === false
                                   ? editingResolutionNotes 
                                   : problem.resolutionNotes;
    try {
      const updated = await updateProblem({ 
          id: problem.id, 
          resolved: !problem.resolved, 
          resolutionNotes: !problem.resolved ? (editingResolutionNotes || undefined) : undefined 
        });
      setProblems(prev => sortProblems(prev.map(p => p.id === updated.id ? updated : p)));
      toast({ title: "Problem Updated", description: `"${updated.description}" is now ${updated.resolved ? 'resolved' : 'unresolved'}.` });
      if (editingProblemId === problem.id && updated.resolved) {
         setEditingResolutionNotes(updated.resolutionNotes || '');
      } else if (editingProblemId === problem.id && !updated.resolved) {
         setEditingResolutionNotes('');
      }
      onProblemsChanged();
    } catch (error: any) {
      toast({ title: "Error Updating Problem", description: error.message || "Could not update.", variant: "destructive" });
    }
  };

  const handleDeleteProblem = async (id: string) => {
     setIsSubmitting(true);
    try {
      await deleteProblem(id);
      setProblems(prev => prev.filter(p => p.id !== id));
      toast({ title: "Problem Deleted" });
      onProblemsChanged();
    } catch (error: any) {
      toast({ title: "Error Deleting Problem", description: error.message || "Could not delete.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const startEdit = (problem: Problem) => {
    setEditingProblemId(problem.id);
    setEditingDescription(problem.description);
    setEditingType(problem.type);
    setEditingResolutionNotes(problem.resolutionNotes || '');
  };

  const cancelEdit = () => {
    setEditingProblemId(null);
  };

  const handleSaveEdit = async (problemId: string) => {
    if (!editingDescription.trim()) {
      toast({ title: "Description cannot be empty.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const currentProblem = problems.find(p => p.id === problemId);
      if(!currentProblem) return;

      const updated = await updateProblem({ 
        id: problemId, 
        description: editingDescription, 
        type: editingType,
        resolved: currentProblem.resolved, 
        resolutionNotes: currentProblem.resolved ? editingResolutionNotes : undefined
      });
      setProblems(prev => sortProblems(prev.map(p => p.id === updated.id ? updated : p)));
      cancelEdit();
      toast({ title: "Problem Details Updated" });
      onProblemsChanged();
    } catch (error: any) {
      toast({ title: "Error Updating Problem", description: error.message || "Could not save changes.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Image Capture Logic (Adapted from TodoSection) ---
  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
        videoRef.current.srcObject = null;
    }
  }, [stream]);

  const startVideoStream = useCallback(async (deviceId?: string) => {
    stopStream();
    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : true,
      };
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      setHasCameraPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions in your browser settings.',
      });
    }
  }, [stopStream, toast]);

  const getCameraDevices = useCallback(async () => {
    try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputDevices = devices.filter(device => device.kind === 'videoinput');
        setVideoDevices(videoInputDevices);
        if (videoInputDevices.length > 0 && !selectedDeviceId) {
            setSelectedDeviceId(videoInputDevices[0].deviceId);
            await startVideoStream(videoInputDevices[0].deviceId);
        } else if (videoInputDevices.length > 0 && selectedDeviceId) {
            await startVideoStream(selectedDeviceId);
        } else if (videoInputDevices.length === 0) {
             toast({ title: "No Camera Found", variant: "destructive" });
             setHasCameraPermission(false);
        }
    } catch (error) {
        console.error('Error enumerating devices or getting permission:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Error',
          description: 'Could not access camera or list devices. Please check permissions.',
        });
    }
  }, [selectedDeviceId, startVideoStream, toast]);

  const handleOpenImageCaptureDialog = useCallback(async (problem: Problem) => {
    setSelectedProblemForImage(problem);
    setShowCameraDialog(true);
    await getCameraDevices();
  }, [getCameraDevices]);
  
  const handleCloseImageCaptureDialog = useCallback(() => {
    setShowCameraDialog(false);
    stopStream();
    setSelectedProblemForImage(null);
  }, [stopStream]);

  const handleDeviceChange = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    startVideoStream(deviceId);
  };

  const handleCaptureAndSaveImage = async () => {
    if (!videoRef.current || !canvasRef.current || !selectedProblemForImage) return;
    setIsCapturingImage(true);
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
        toast({title: "Error", description: "Could not get canvas context.", variant: "destructive"});
        setIsCapturingImage(false);
        return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageDataUri = canvas.toDataURL('image/jpeg', 0.8);

    try {
      const updatedProblem = await updateProblem({ id: selectedProblemForImage.id, imageDataUri });
      setProblems(prev => sortProblems(prev.map(p => p.id === updatedProblem.id ? updatedProblem : p)));
      toast({ title: "Image Saved!", description: `Image for "${selectedProblemForImage.description}" updated.`, duration: 3000 });
      onProblemsChanged();
      handleCloseImageCaptureDialog();
    } catch (error: any) {
      toast({ title: "Error Saving Image", description: error.message || "Could not save image.", variant: "destructive" });
    } finally {
      setIsCapturingImage(false);
    }
  };

  const handleRemoveImage = async (problemId: string) => {
    const problem = problems.find(p => p.id === problemId);
    if (!problem) return;

    setIsSubmitting(true);
    try {
        const updatedProblem = await updateProblem({ id: problemId, imageDataUri: null });
        setProblems(prev => sortProblems(prev.map(p => p.id === updatedProblem.id ? updatedProblem : p)));
        toast({ title: "Image Removed", description: `Image for "${problem.description}" removed.` });
        onProblemsChanged();
    } catch (error: any) {
        toast({ title: "Error Removing Image", description: error.message || "Could not remove image.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
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
              disabled={isSubmitting}
            />
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <Select value={newProblemType} onValueChange={(val: 'Waste' | 'Blocker' | 'Issue') => setNewProblemType(val)} disabled={isSubmitting}>
                <SelectTrigger className="text-md p-2 h-auto sm:w-1/3">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Issue" className="text-md">Issue</SelectItem>
                  <SelectItem value="Blocker" className="text-md">Blocker</SelectItem>
                  <SelectItem value="Waste" className="text-md">Waste</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" className="w-full sm:w-auto text-md" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-5 w-5" />}
                Log Problem
              </Button>
            </div>
          </form>

          {problems.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No problems logged yet.</p>
          ) : (
            <ul className="space-y-3">
              {problems.map(problem => (
                <li key={problem.id} className={`p-3 rounded-md flex flex-col gap-2 transition-colors ${problem.resolved ? 'bg-muted/50 hover:bg-muted/70' : 'bg-card hover:bg-muted/30'} border`}>
                  <div className="flex items-start gap-3">
                    <Checkbox
                          id={`problem-${problem.id}-resolve`}
                          checked={problem.resolved}
                          onCheckedChange={() => handleToggleResolved(problem)}
                          className="h-5 w-5 mt-1 shrink-0"
                          aria-label={problem.resolved ? 'Mark as unresolved' : 'Mark as resolved'}
                          disabled={isSubmitting && editingProblemId !== problem.id}
                      />
                    <div className="flex-grow">
                      {editingProblemId === problem.id ? (
                        <>
                          <Textarea
                              value={editingDescription}
                              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setEditingDescription(e.target.value)}
                              className="text-md p-1.5 w-full mb-2 min-h-[60px]"
                              autoFocus
                              disabled={isSubmitting}
                          />
                          <Select value={editingType} onValueChange={(val: 'Waste' | 'Blocker' | 'Issue') => setEditingType(val)} disabled={isSubmitting}>
                              <SelectTrigger className="text-md p-1.5 h-auto mb-2">
                                  <SelectValue placeholder="Select type"/>
                              </SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="Issue" className="text-md">Issue</SelectItem>
                                  <SelectItem value="Blocker" className="text-md">Blocker</SelectItem>
                                  <SelectItem value="Waste" className="text-md">Waste</SelectItem>
                              </SelectContent>
                          </Select>
                          {problem.resolved && (
                              <Textarea
                                  value={editingResolutionNotes}
                                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setEditingResolutionNotes(e.target.value)}
                                  placeholder="Resolution notes (optional)"
                                  className="text-sm p-1.5 w-full min-h-[50px]"
                                  disabled={isSubmitting}
                              />
                          )}
                        </>
                      ) : (
                        <>
                          <label htmlFor={`problem-${problem.id}-resolve`} className={`text-md font-medium ${problem.resolved ? 'line-through text-muted-foreground' : ''}`}>{problem.description}</label>
                          <p className="text-xs text-muted-foreground">
                            Type: <span className="font-semibold">{problem.type}</span> | Logged: {format(parseISO(problem.timestamp), 'MMM d, yy h:mm a')}
                          </p>
                        </>
                      )}
                    </div>
                    <div className="flex gap-1 ml-auto shrink-0">
                      {editingProblemId === problem.id ? (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => handleSaveEdit(problem.id)} aria-label="Save edit" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-5 w-5 text-green-600" />}
                          </Button>
                          <Button variant="ghost" size="icon" onClick={cancelEdit} aria-label="Cancel edit" disabled={isSubmitting}>
                            <XCircle className="h-5 w-5 text-muted-foreground" />
                          </Button>
                        </>
                      ) : (
                         !problem.resolved && (
                          <Button variant="ghost" size="icon" onClick={() => startEdit(problem)} aria-label="Edit problem" disabled={isSubmitting}>
                              <Edit2 className="h-5 w-5 text-blue-600" />
                          </Button>
                          )
                      )}
                      <AlertDialog>
                          <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" aria-label="Delete problem" disabled={isSubmitting}>
                                  <Trash2 className="h-5 w-5 text-destructive" />
                              </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete this problem log.
                                  </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteProblem(problem.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Delete</AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  {/* Image Display/Action Area */}
                  <div className="pl-8 space-y-1">
                        {problem.imageDataUri ? (
                            <div className="relative group w-full max-w-xs">
                                <NextImage src={problem.imageDataUri} alt={`Image for ${problem.description}`} width={160} height={120} className="rounded-md border object-cover w-full aspect-[4/3]" />
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                                    <Button variant="outline" size="sm" onClick={() => handleOpenImageCaptureDialog(problem)} className="mr-1">
                                        <RefreshCw className="h-4 w-4 mr-1" /> Retake
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={() => handleRemoveImage(problem.id)}>
                                        <Trash2 className="h-4 w-4 mr-1" /> Remove
                                    </Button>
                                </div>
                            </div>
                        ) : (
                          !problem.resolved && ( // Only show add image if not resolved
                            <Button variant="outline" size="sm" onClick={() => handleOpenImageCaptureDialog(problem)}>
                                <Camera className="h-4 w-4 mr-2" /> Add Image
                            </Button>
                            )
                        )}
                    </div>

                  {problem.resolved && (
                    <div className="mt-2 pl-8 text-sm">
                      <p className="flex items-center text-green-700"><CheckCircle2 className="h-4 w-4 mr-1.5" /> Resolved</p>
                      {problem.resolutionNotes && (
                          <p className="text-muted-foreground italic flex items-start"><MessageSquare className="h-4 w-4 mr-1.5 shrink-0 mt-0.5"/> Notes: {problem.resolutionNotes}</p>
                      )}
                       <p className="text-xs text-muted-foreground">
                        Last updated: {format(parseISO(problem.lastModifiedDate), 'MMM d, yy h:mm a')}
                      </p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Image Capture Dialog for Problems */}
      <Dialog open={showCameraDialog} onOpenChange={(open) => !open && handleCloseImageCaptureDialog()}>
        <DialogContent className="sm:max-w-lg p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-2xl">Capture Image for Problem</DialogTitle>
            <DialogDesc>
              Problem: {selectedProblemForImage?.description}
            </DialogDesc>
          </DialogHeader>
          <div className="px-6 py-4 space-y-4">
            {hasCameraPermission === false && (
                <Alert variant="destructive">
                  <AlertTitle>Camera Access Required</AlertTitle>
                  <AlertDescription>
                    Please allow camera access in your browser settings and refresh.
                  </AlertDescription>
                </Alert>
            )}
            {hasCameraPermission === null && (
                <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" /> Checking camera permission...
                </div>
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

