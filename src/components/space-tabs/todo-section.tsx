// src/components/space-tabs/todo-section.tsx
"use client";

import type { ChangeEvent, FormEvent } from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import type { Todo } from '@/domain/entities/todo.entity';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, PlusCircle, Edit2, Save, XCircle, Loader2, Camera, Image as ImageIcon, RefreshCw, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { CreateTodoInputDTO } from '@/application/use-cases/todo/create-todo.usecase';
import type { UpdateTodoInputDTO } from '@/application/use-cases/todo/update-todo.usecase';
import Image from 'next/image'; // Using next/image for displaying captured images
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


interface TodoSectionProps {
  spaceId: string;
  initialTodos: Todo[];
  isLoading: boolean;
  createTodo: (data: CreateTodoInputDTO) => Promise<Todo>;
  updateTodo: (data: UpdateTodoInputDTO) => Promise<Todo>;
  deleteTodo: (id: string) => Promise<void>;
  onTodosChanged: () => void; 
}

type CaptureMode = 'before' | 'after';

export function TodoSection({
  spaceId,
  initialTodos,
  isLoading,
  createTodo,
  updateTodo,
  deleteTodo,
  onTodosChanged,
}: TodoSectionProps) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [newTodoDescription, setNewTodoDescription] = useState('');
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editingDescription, setEditingDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Image Capture State
  const [showCameraDialog, setShowCameraDialog] = useState(false);
  const [selectedTodoForImage, setSelectedTodoForImage] = useState<Todo | null>(null);
  const [captureMode, setCaptureMode] = useState<CaptureMode | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null); // null initially, then true/false
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturingImage, setIsCapturingImage] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setTodos(initialTodos.sort((a, b) => {
        if (a.completed === b.completed) return new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime();
        return a.completed ? 1 : -1;
      }));
  }, [initialTodos]);

  const sortTodos = (todoList: Todo[]) => {
    return [...todoList].sort((a, b) => {
      if (a.completed === b.completed) return new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime();
      return a.completed ? 1 : -1;
    });
  };

  const handleAddTodo = async (event: FormEvent) => {
    event.preventDefault();
    if (!newTodoDescription.trim()) {
      toast({ title: "Cannot add empty to-do.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const newTodo = await createTodo({ spaceId, description: newTodoDescription });
      setTodos(prev => sortTodos([newTodo, ...prev]));
      setNewTodoDescription('');
      toast({ title: "To-do Added", description: `"${newTodo.description}"` });
      onTodosChanged();
    } catch (error: any) {
      toast({ title: "Error Adding To-do", description: error.message || "Could not save to-do.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleComplete = async (todo: Todo) => {
    try {
      const updated = await updateTodo({ id: todo.id, completed: !todo.completed });
      setTodos(prev => sortTodos(prev.map(t => t.id === updated.id ? updated : t)));
       toast({ title: "To-do Updated", description: `"${updated.description}" is now ${updated.completed ? 'complete' : 'incomplete'}.` });
       onTodosChanged();
    } catch (error: any) {
      toast({ title: "Error Updating To-do", description: error.message || "Could not update to-do.", variant: "destructive" });
    }
  };

  const handleDeleteTodo = async (id: string) => {
    setIsSubmitting(true); 
    try {
      await deleteTodo(id);
      setTodos(prev => prev.filter(t => t.id !== id));
      toast({ title: "To-do Deleted" });
      onTodosChanged();
    } catch (error: any) {
      toast({ title: "Error Deleting To-do", description: error.message || "Could not delete to-do.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  const startEdit = (todo: Todo) => {
    setEditingTodoId(todo.id);
    setEditingDescription(todo.description);
  };

  const cancelEdit = () => {
    setEditingTodoId(null);
    setEditingDescription('');
  };

  const handleSaveEdit = async (todoId: string) => {
    if (!editingDescription.trim()) {
      toast({ title: "Description cannot be empty.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const updated = await updateTodo({ id: todoId, description: editingDescription });
      setTodos(prev => sortTodos(prev.map(t => t.id === updated.id ? updated : t)));
      cancelEdit();
      toast({ title: "To-do Updated", description: `Description changed for "${updated.description}".` });
      onTodosChanged();
    } catch (error: any) {
      toast({ title: "Error Updating To-do", description: error.message || "Could not save changes.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Image Capture Logic ---
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
    stopStream(); // Stop any existing stream
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
        await navigator.mediaDevices.getUserMedia({ video: true }); // Request permission first
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
             setHasCameraPermission(false); // No devices implies no permission effectively
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


  const handleOpenImageCaptureDialog = useCallback(async (todo: Todo, mode: CaptureMode) => {
    setSelectedTodoForImage(todo);
    setCaptureMode(mode);
    setShowCameraDialog(true);
    await getCameraDevices();
  }, [getCameraDevices]);
  

  const handleCloseImageCaptureDialog = useCallback(() => {
    setShowCameraDialog(false);
    stopStream();
    setSelectedTodoForImage(null);
    setCaptureMode(null);
    // Don't reset hasCameraPermission here, as it reflects the browser permission state
  }, [stopStream]);

  const handleDeviceChange = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    startVideoStream(deviceId);
  };

  const handleCaptureAndSaveImage = async () => {
    if (!videoRef.current || !canvasRef.current || !selectedTodoForImage || !captureMode) return;
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
    const imageDataUri = canvas.toDataURL('image/jpeg', 0.8); // Use JPEG for smaller size

    try {
      const updateData: UpdateTodoInputDTO = { id: selectedTodoForImage.id };
      if (captureMode === 'before') {
        updateData.beforeImageDataUri = imageDataUri;
      } else {
        updateData.afterImageDataUri = imageDataUri;
      }
      const updatedTodo = await updateTodo(updateData);
      setTodos(prev => sortTodos(prev.map(t => t.id === updatedTodo.id ? updatedTodo : t)));
      toast({ title: "Image Saved!", description: `${captureMode === 'before' ? 'Before' : 'After'} image for "${selectedTodoForImage.description}" updated.`, duration: 3000 });
      onTodosChanged();
      handleCloseImageCaptureDialog();
    } catch (error: any) {
      toast({ title: "Error Saving Image", description: error.message || "Could not save image.", variant: "destructive" });
    } finally {
      setIsCapturingImage(false);
    }
  };

  const handleRemoveImage = async (todoId: string, mode: CaptureMode) => {
    const todo = todos.find(t => t.id === todoId);
    if (!todo) return;

    setIsSubmitting(true); // Use general submitting flag for this quick action
    try {
        const updateData: UpdateTodoInputDTO = { id: todoId };
        if (mode === 'before') {
            updateData.beforeImageDataUri = null; // Signal to remove
        } else {
            updateData.afterImageDataUri = null; // Signal to remove
        }
        const updatedTodo = await updateTodo(updateData);
        setTodos(prev => sortTodos(prev.map(t => t.id === updatedTodo.id ? updatedTodo : t)));
        toast({ title: "Image Removed", description: `${mode === 'before' ? 'Before' : 'After'} image for "${todo.description}" removed.` });
        onTodosChanged();
    } catch (error: any) {
        toast({ title: "Error Removing Image", description: error.message || "Could not remove image.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };


  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading to-dos...</p>
      </div>
    );
  }

  return (
    <>
      <Card className="mt-4 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl flex items-center justify-between">
            <span>To-Do List</span>
            <form onSubmit={handleAddTodo} className="flex gap-2 items-center">
              <Input
                type="text"
                value={newTodoDescription}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setNewTodoDescription(e.target.value)}
                placeholder="Add a new to-do..."
                className="text-md p-2 flex-grow"
                disabled={isSubmitting}
              />
              <Button type="submit" size="icon" aria-label="Add to-do" disabled={isSubmitting} className="h-9 w-9">
                {isSubmitting && !editingTodoId ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-5 w-5" />}
              </Button>
            </form>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todos.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No to-do items yet. Add one above!</p>
          ) : (
            <ul className="space-y-4">
              {todos.map(todo => (
                <li key={todo.id} className={`p-4 rounded-md flex flex-col gap-3 transition-colors ${todo.completed ? 'bg-muted/50 hover:bg-muted/70' : 'bg-card hover:bg-muted/30'} border`}>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id={`todo-${todo.id}`}
                      checked={todo.completed}
                      onCheckedChange={() => handleToggleComplete(todo)}
                      className="h-5 w-5 shrink-0 mt-0.5"
                      aria-label={todo.completed ? 'Mark as incomplete' : 'Mark as complete'}
                      disabled={isSubmitting && editingTodoId !== todo.id}
                    />
                    {editingTodoId === todo.id ? (
                      <Input
                        type="text"
                        value={editingDescription}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setEditingDescription(e.target.value)}
                        className="text-md p-1.5 flex-grow"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && !isSubmitting && handleSaveEdit(todo.id)}
                        disabled={isSubmitting}
                      />
                    ) : (
                      <label htmlFor={`todo-${todo.id}`} className={`flex-grow cursor-pointer text-md ${todo.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {todo.description}
                      </label>
                    )}
                    <div className="flex gap-1.5 ml-auto shrink-0">
                      {editingTodoId === todo.id ? (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => handleSaveEdit(todo.id)} aria-label="Save edit" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-5 w-5 text-green-600" />}
                          </Button>
                          <Button variant="ghost" size="icon" onClick={cancelEdit} aria-label="Cancel edit" disabled={isSubmitting}>
                            <XCircle className="h-5 w-5 text-muted-foreground" />
                          </Button>
                        </>
                      ) : (
                        !todo.completed && (
                          <Button variant="ghost" size="icon" onClick={() => startEdit(todo)} aria-label="Edit to-do" disabled={isSubmitting}>
                            <Edit2 className="h-5 w-5 text-blue-600" />
                          </Button>
                        )
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteTodo(todo.id)} aria-label="Delete to-do" disabled={isSubmitting}>
                        <Trash2 className="h-5 w-5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {/* Image Capture/Display Area */}
                  <div className="flex flex-col sm:flex-row gap-4 pl-8">
                    {['before', 'after'].map((mode) => {
                      const currentMode = mode as CaptureMode;
                      const imageUri = currentMode === 'before' ? todo.beforeImageDataUri : todo.afterImageDataUri;
                      return (
                        <div key={mode} className="flex-1 space-y-2">
                          <p className="text-sm font-medium text-muted-foreground capitalize">{mode} Image</p>
                          {imageUri ? (
                            <div className="relative group">
                              <Image src={imageUri} alt={`${mode} image for ${todo.description}`} width={160} height={120} className="rounded-md border object-cover w-full aspect-[4/3]" />
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                                <Button variant="outline" size="sm" onClick={() => handleOpenImageCaptureDialog(todo, currentMode)} className="mr-1">
                                  <RefreshCw className="h-4 w-4 mr-1" /> Retake
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => handleRemoveImage(todo.id, currentMode)}>
                                  <Trash2 className="h-4 w-4 mr-1" /> Remove
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button variant="outline" size="sm" onClick={() => handleOpenImageCaptureDialog(todo, currentMode)} className="w-full">
                              <Camera className="h-4 w-4 mr-2" /> Add {mode} Image
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Image Capture Dialog */}
      <Dialog open={showCameraDialog} onOpenChange={(open) => !open && handleCloseImageCaptureDialog()}>
        <DialogContent className="sm:max-w-lg p-0"> {/* Remove padding for full-width video */}
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-2xl">Capture {captureMode} Image</DialogTitle>
            <DialogDescription>
              For: {selectedTodoForImage?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-4 space-y-4">
            {hasCameraPermission === false && (
                <Alert variant="destructive">
                  <AlertTitle>Camera Access Required</AlertTitle>
                  <AlertDescription>
                    Please allow camera access in your browser settings and refresh the page if needed.
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
                <Label htmlFor="camera-select">Select Camera:</Label>
                <Select value={selectedDeviceId || ''} onValueChange={handleDeviceChange}>
                  <SelectTrigger id="camera-select">
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
            {!stream && hasCameraPermission && ( // Show loader while stream is starting
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                </div>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" /> {/* Hidden canvas for image capture */}

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
