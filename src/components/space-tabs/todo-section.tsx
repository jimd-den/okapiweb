
// src/components/space-tabs/todo-section.tsx
"use client";

import type { ChangeEvent, FormEvent } from 'react';
import { useState, useEffect, useCallback } from 'react';
import type { Todo } from '@/domain/entities/todo.entity';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { CreateTodoUseCase } from '@/application/use-cases/todo/create-todo.usecase';
import type { UpdateTodoInputDTO, UpdateTodoUseCase } from '@/application/use-cases/todo/update-todo.usecase';
import type { DeleteTodoUseCase } from '@/application/use-cases/todo/delete-todo.usecase';
import type { GetTodosBySpaceUseCase } from '@/application/use-cases/todo/get-todos-by-space.usecase';
import { TodoItem } from './todo-item';
import { useImageCaptureDialog, type UseImageCaptureDialogReturn } from '@/hooks/use-image-capture-dialog';
import { ImageCaptureDialogView } from '@/components/dialogs/image-capture-dialog-view';
import { CreateTodoDialog } from '@/components/dialogs/create-todo-dialog';

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
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [isCreateTodoDialogOpen, setIsCreateTodoDialogOpen] = useState(false);

  const imageCaptureExisting: UseImageCaptureDialogReturn<Todo, CaptureMode> = useImageCaptureDialog<Todo, CaptureMode>();
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

  const handleOpenImageCaptureForExistingTodo = useCallback((todo: Todo, mode: CaptureMode) => {
    imageCaptureExisting.handleOpenImageCaptureDialog(todo, mode);
  }, [imageCaptureExisting]);

  const handleTodoCreated = useCallback((newTodo: Todo) => {
    setTodos(prev => sortTodos([newTodo, ...prev]));
    onTodosChanged();
  }, [sortTodos, onTodosChanged]);

  const handleToggleComplete = useCallback(async (todo: Todo) => {
    setIsSubmittingAction(true);
    try {
      const updated = await updateTodoUseCase.execute({ id: todo.id, completed: !todo.completed });
      setTodos(prev => sortTodos(prev.map(t => t.id === updated.id ? updated : t)));
      toast({ title: "To-do Updated", description: `"${updated.description}" is now ${updated.completed ? 'complete' : 'incomplete'}.` });
      onTodosChanged();
    } catch (error: any) {
      toast({ title: "Error Updating To-do", description: error.message || "Could not update to-do.", variant: "destructive" });
    } finally {
      setIsSubmittingAction(false);
    }
  }, [updateTodoUseCase, sortTodos, onTodosChanged, toast]);

  const handleDeleteTodo = useCallback(async (id: string) => {
    setIsSubmittingAction(true);
    try {
      await deleteTodoUseCase.execute(id);
      setTodos(prev => prev.filter(t => t.id !== id));
      toast({ title: "To-do Deleted" });
      onTodosChanged();
    } catch (error: any) {
      toast({ title: "Error Deleting To-do", description: error.message || "Could not delete to-do.", variant: "destructive" });
    } finally {
      setIsSubmittingAction(false);
    }
  }, [deleteTodoUseCase, onTodosChanged, toast]);
  
  const handleUpdateDescription = useCallback(async (id: string, newDescription: string) => {
    setIsSubmittingAction(true);
    try {
      const updated = await updateTodoUseCase.execute({ id: id, description: newDescription });
      setTodos(prev => sortTodos(prev.map(t => t.id === updated.id ? updated : t)));
      toast({ title: "To-do Updated", description: `Description changed for "${updated.description}".` });
      onTodosChanged();
    } catch (error: any) {
      toast({ title: "Error Updating To-do", description: error.message || "Could not save changes.", variant: "destructive" });
    } finally {
      setIsSubmittingAction(false);
    }
  }, [updateTodoUseCase, sortTodos, onTodosChanged, toast]);

  const handleCaptureAndSaveImageForExistingTodo = useCallback(async () => {
    if (!imageCaptureExisting.videoRef.current || !imageCaptureExisting.canvasRef.current || !imageCaptureExisting.selectedItemForImage || !imageCaptureExisting.captureMode) return;
    
    imageCaptureExisting.setIsCapturingImage(true); // This uses the setter from the hook
    const video = imageCaptureExisting.videoRef.current;
    const canvas = imageCaptureExisting.canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
        toast({title: "Error", description: "Could not get canvas context.", variant: "destructive"});
        imageCaptureExisting.setIsCapturingImage(false);
        return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageDataUri = canvas.toDataURL('image/jpeg', 0.8);

    setIsSubmittingAction(true);
    try {
      const updateData: UpdateTodoInputDTO = { id: imageCaptureExisting.selectedItemForImage.id };
      if (imageCaptureExisting.captureMode === 'before') {
        updateData.beforeImageDataUri = imageDataUri;
      } else {
        updateData.afterImageDataUri = imageDataUri;
      }
      const updatedTodo = await updateTodoUseCase.execute(updateData);
      setTodos(prev => sortTodos(prev.map(t => t.id === updatedTodo.id ? updatedTodo : t)));
      toast({ title: "Image Saved!", description: `${imageCaptureExisting.captureMode === 'before' ? 'Before' : 'After'} image for "${imageCaptureExisting.selectedItemForImage.description}" updated.`, duration: 3000 });
      onTodosChanged();
      imageCaptureExisting.handleCloseImageCaptureDialog();
    } catch (error: any) {
      toast({ title: "Error Saving Image", description: error.message || "Could not save image.", variant: "destructive" });
    } finally {
        imageCaptureExisting.setIsCapturingImage(false);
        setIsSubmittingAction(false);
    }
  }, [imageCaptureExisting, updateTodoUseCase, sortTodos, onTodosChanged, toast]);

  const handleRemoveImageForExistingTodo = useCallback(async (todoId: string, imgMode: CaptureMode) => {
    const todo = todos.find(t => t.id === todoId);
    if (!todo) return;
    setIsSubmittingAction(true); 
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
        setIsSubmittingAction(false);
    }
  }, [todos, updateTodoUseCase, sortTodos, onTodosChanged, toast]);

  const handleOpenCreateTodoDialog = useCallback(() => {
    setIsCreateTodoDialogOpen(true);
  }, []);

  const handleCloseCreateTodoDialog = useCallback(() => {
    setIsCreateTodoDialogOpen(false);
  }, []);


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
            <Button onClick={handleOpenCreateTodoDialog} className="text-md">
              <PlusCircle className="mr-2 h-5 w-5" /> Add To-Do
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todos.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No to-do items yet. Click 'Add To-Do' to get started.</p>
          ) : (
            <ul className="space-y-4">
              {todos.map(todo => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggleComplete={handleToggleComplete}
                  onDelete={handleDeleteTodo}
                  onUpdateDescription={handleUpdateDescription}
                  onOpenImageCapture={handleOpenImageCaptureForExistingTodo}
                  onRemoveImage={handleRemoveImageForExistingTodo}
                  isSubmittingParent={isSubmittingAction}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <CreateTodoDialog
        spaceId={spaceId}
        isOpen={isCreateTodoDialogOpen}
        onClose={handleCloseCreateTodoDialog}
        createTodoUseCase={createTodoUseCase}
        onTodoCreated={handleTodoCreated}
      />

      <ImageCaptureDialogView
        isOpen={imageCaptureExisting.showCameraDialog}
        onClose={imageCaptureExisting.handleCloseImageCaptureDialog}
        dialogTitle={`Capture ${imageCaptureExisting.captureMode || ''} Image`}
        itemDescription={imageCaptureExisting.selectedItemForImage?.description}
        videoRef={imageCaptureExisting.videoRef}
        canvasRef={imageCaptureExisting.canvasRef}
        videoDevices={imageCaptureExisting.videoDevices}
        selectedDeviceId={imageCaptureExisting.selectedDeviceId}
        onDeviceChange={imageCaptureExisting.handleDeviceChange}
        hasCameraPermission={imageCaptureExisting.hasCameraPermission}
        isCheckingPermission={imageCaptureExisting.isCheckingPermission}
        stream={imageCaptureExisting.stream}
        onCaptureAndSave={handleCaptureAndSaveImageForExistingTodo}
        isCapturingImage={imageCaptureExisting.isCapturingImage}
      />
    </>
  );
}
