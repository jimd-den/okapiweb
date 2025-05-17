// src/components/space-tabs/todo-section.tsx
"use client";

import type { ChangeEvent, FormEvent } from 'react';
import { useState, useEffect, useCallback } from 'react';
import type { Todo } from '@/domain/entities/todo.entity';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Loader2 } from 'lucide-react'; // Removed Camera, CheckCircle
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { CreateTodoInputDTO, CreateTodoUseCase } from '@/application/use-cases/todo/create-todo.usecase';
import type { UpdateTodoInputDTO, UpdateTodoUseCase } from '@/application/use-cases/todo/update-todo.usecase';
import type { DeleteTodoUseCase } from '@/application/use-cases/todo/delete-todo.usecase';
import type { GetTodosBySpaceUseCase } from '@/application/use-cases/todo/get-todos-by-space.usecase';
import { TodoItem } from './todo-item';
import { useImageCaptureDialog } from '@/hooks/use-image-capture-dialog';
import { ImageCaptureDialogView } from '@/components/dialogs/image-capture-dialog-view';


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

  const imageCapture = useImageCaptureDialog<Todo, CaptureMode>();
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
    imageCapture.handleOpenImageCaptureDialog(todo, mode);
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
    if (!imageCapture.videoRef.current || !imageCapture.canvasRef.current || !imageCapture.selectedItemForImage || !imageCapture.captureMode) return;
    
    imageCapture.setIsCapturingImage(true); // From hook
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

    try {
      const updateData: UpdateTodoInputDTO = { id: imageCapture.selectedItemForImage.id };
      if (imageCapture.captureMode === 'before') {
        updateData.beforeImageDataUri = imageDataUri;
      } else {
        updateData.afterImageDataUri = imageDataUri;
      }
      const updatedTodo = await updateTodoUseCase.execute(updateData);
      setTodos(prev => sortTodos(prev.map(t => t.id === updatedTodo.id ? updatedTodo : t)));
      toast({ title: "Image Saved!", description: `${imageCapture.captureMode === 'before' ? 'Before' : 'After'} image for "${imageCapture.selectedItemForImage.description}" updated.`, duration: 3000 });
      onTodosChanged();
      imageCapture.handleCloseImageCaptureDialog();
    } catch (error: any) {
      toast({ title: "Error Saving Image", description: error.message || "Could not save image.", variant: "destructive" });
    } finally {
        imageCapture.setIsCapturingImage(false);
    }
  };

  const handleRemoveImage = async (todoId: string, imgMode: CaptureMode) => {
    const todo = todos.find(t => t.id === todoId);
    if (!todo) return;
    setIsSubmittingNew(true); 
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
                  isSubmittingParent={isSubmittingNew}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <ImageCaptureDialogView
        isOpen={imageCapture.showCameraDialog}
        onClose={imageCapture.handleCloseImageCaptureDialog}
        dialogTitle={`Capture ${imageCapture.captureMode || ''} Image`}
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
