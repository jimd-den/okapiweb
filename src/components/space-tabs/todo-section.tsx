// src/components/space-tabs/todo-section.tsx
"use client";

import type { ChangeEvent, FormEvent } from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import type { Todo } from '@/domain/entities/todo.entity';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Loader2, CheckCircle, Camera } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { CreateTodoInputDTO, CreateTodoUseCase } from '@/application/use-cases/todo/create-todo.usecase';
import type { UpdateTodoInputDTO, UpdateTodoUseCase } from '@/application/use-cases/todo/update-todo.usecase';
import type { DeleteTodoUseCase } from '@/application/use-cases/todo/delete-todo.usecase';
import type { GetTodosBySpaceUseCase } from '@/application/use-cases/todo/get-todos-by-space.usecase';
import { TodoItem } from './todo-item';
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
import { useImageCaptureDialog } from '@/hooks/use-image-capture-dialog';

interface TodoSectionProps {
  spaceId: string;
  createTodoUseCase: CreateTodoUseCase;
  updateTodoUseCase: UpdateTodoUseCase;
  deleteTodoUseCase: DeleteTodoUseCase;
  getTodosBySpaceUseCase: GetTodosBySpaceUseCase;
  onTodosChanged: () => void;
}

type CaptureMode = 'before' | 'after';

export function TodoSection({
  spaceId,
  createTodoUseCase,
  updateTodoUseCase,
  deleteTodoUseCase,
  getTodosBySpaceUseCase,
  onTodosChanged,
}: TodoSectionProps) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTodoDescription, setNewTodoDescription] = useState('');
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  const {
    showCameraDialog,
    selectedItemForImage: selectedTodoForImage,
    captureMode,
    videoDevices,
    selectedDeviceId,
    hasCameraPermission,
    stream,
    isCapturingImage,
    videoRef,
    canvasRef,
    handleOpenImageCaptureDialog: baseHandleOpenImageCaptureDialog,
    handleCloseImageCaptureDialog,
    handleDeviceChange,
    isCheckingPermission,
  } = useImageCaptureDialog<Todo, CaptureMode>();

  const { toast } = useToast();

  const sortTodos = useCallback((todoList: Todo[]) => {
    return [...todoList].sort((a, b) => {
      if (a.completed === b.completed) return new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime();
      return a.completed ? 1 : -1;
    });
  }, []);
  
  const fetchTodos = useCallback(async () => {
    if (!spaceId) return;
    setIsLoading(true);
    try {
      const data = await getTodosBySpaceUseCase.execute(spaceId);
      setTodos(sortTodos(data));
    } catch (err) {
      console.error("Failed to fetch todos:", err);
      toast({ title: "Error Loading To-Dos", description: String(err), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [spaceId, getTodosBySpaceUseCase, sortTodos, toast]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const handleOpenImageCaptureForTodo = (todo: Todo, mode: CaptureMode) => {
    baseHandleOpenImageCaptureDialog(todo, mode);
  };

  const handleAddTodo = async (event: FormEvent) => {
    event.preventDefault();
    if (!newTodoDescription.trim()) {
      toast({ title: "Cannot add empty to-do.", variant: "destructive" });
      return;
    }
    setIsSubmittingNew(true);
    try {
      const newTodoData: CreateTodoInputDTO = { spaceId, description: newTodoDescription };
      const newTodo = await createTodoUseCase.execute(newTodoData);
      setTodos(prev => sortTodos([newTodo, ...prev]));
      setNewTodoDescription('');
      toast({ title: "To-do Added", description: `"${newTodo.description}"` });
      onTodosChanged();
    } catch (error: any) {
      toast({ title: "Error Adding To-do", description: error.message || "Could not save to-do.", variant: "destructive" });
    } finally {
      setIsSubmittingNew(false);
    }
  };

  const handleToggleComplete = async (todo: Todo) => {
    try {
      const updated = await updateTodoUseCase.execute({ id: todo.id, completed: !todo.completed });
      setTodos(prev => sortTodos(prev.map(t => t.id === updated.id ? updated : t)));
      toast({ title: "To-do Updated", description: `"${updated.description}" is now ${updated.completed ? 'complete' : 'incomplete'}.` });
      onTodosChanged();
    } catch (error: any) {
      toast({ title: "Error Updating To-do", description: error.message || "Could not update to-do.", variant: "destructive" });
    }
  };

  const handleDeleteTodo = async (id: string) => {
    try {
      await deleteTodoUseCase.execute(id);
      setTodos(prev => prev.filter(t => t.id !== id));
      toast({ title: "To-do Deleted" });
      onTodosChanged();
    } catch (error: any) {
      toast({ title: "Error Deleting To-do", description: error.message || "Could not delete to-do.", variant: "destructive" });
    }
  };
  
  const handleUpdateDescription = async (id: string, newDescription: string) => {
     try {
      const updated = await updateTodoUseCase.execute({ id: id, description: newDescription });
      setTodos(prev => sortTodos(prev.map(t => t.id === updated.id ? updated : t)));
      toast({ title: "To-do Updated", description: `Description changed for "${updated.description}".` });
      onTodosChanged();
    } catch (error: any) {
      toast({ title: "Error Updating To-do", description: error.message || "Could not save changes.", variant: "destructive" });
    }
  };


  const handleCaptureAndSaveImage = async () => {
    if (!videoRef.current || !canvasRef.current || !selectedTodoForImage || !captureMode) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
        toast({title: "Error", description: "Could not get canvas context.", variant: "destructive"});
        return; // Early return if context is null
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageDataUri = canvas.toDataURL('image/jpeg', 0.8);

    try {
      const updateData: UpdateTodoInputDTO = { id: selectedTodoForImage.id };
      if (captureMode === 'before') {
        updateData.beforeImageDataUri = imageDataUri;
      } else {
        updateData.afterImageDataUri = imageDataUri;
      }
      const updatedTodo = await updateTodoUseCase.execute(updateData);
      setTodos(prev => sortTodos(prev.map(t => t.id === updatedTodo.id ? updatedTodo : t)));
      toast({ title: "Image Saved!", description: `${captureMode === 'before' ? 'Before' : 'After'} image for "${selectedTodoForImage.description}" updated.`, duration: 3000 });
      onTodosChanged();
      handleCloseImageCaptureDialog();
    } catch (error: any) {
      toast({ title: "Error Saving Image", description: error.message || "Could not save image.", variant: "destructive" });
    }
  };

  const handleRemoveImage = async (todoId: string, imgMode: CaptureMode) => {
    const todo = todos.find(t => t.id === todoId);
    if (!todo) return;
    setIsSubmittingNew(true); // Using existing loading state for simplicity
    try {
        const updateData: UpdateTodoInputDTO = { id: todoId };
        if (imgMode === 'before') {
            updateData.beforeImageDataUri = null;
        } else {
            updateData.afterImageDataUri = null;
        }
        const updatedTodo = await updateTodoUseCase.execute(updateData);
        setTodos(prev => sortTodos(prev.map(t => t.id === updatedTodo.id ? updatedTodo : t)));
        toast({ title: "Image Removed", description: `${imgMode === 'before' ? 'Before' : 'After'} image for "${todo.description}" removed.` });
        onTodosChanged();
    } catch (error: any) {
        toast({ title: "Error Removing Image", description: error.message || "Could not remove image.", variant: "destructive" });
    } finally {
        setIsSubmittingNew(false);
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
                disabled={isSubmittingNew}
              />
              <Button type="submit" size="icon" aria-label="Add to-do" disabled={isSubmittingNew} className="h-9 w-9">
                {isSubmittingNew ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-5 w-5" />}
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
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggleComplete={handleToggleComplete}
                  onDelete={handleDeleteTodo}
                  onUpdateDescription={handleUpdateDescription}
                  onOpenImageCapture={handleOpenImageCaptureForTodo}
                  onRemoveImage={handleRemoveImage}
                  isSubmitting={isSubmittingNew}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCameraDialog} onOpenChange={(open) => !open && handleCloseImageCaptureDialog()}>
        <DialogContent className="sm:max-w-lg p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-2xl">Capture {captureMode} Image</DialogTitle>
            <DialogDescription>
              For: {selectedTodoForImage?.description}
            </DialogDescription>
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
            {!stream && hasCameraPermission === true && ( // Show loader only if permission granted but stream not ready
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
