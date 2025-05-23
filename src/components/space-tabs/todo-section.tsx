
// src/components/space-tabs/todo-section.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Todo } from '@/domain/entities/todo.entity';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CreateTodoUseCase } from '@/application/use-cases/todo/create-todo.usecase';
import type { UpdateTodoInputDTO, UpdateTodoUseCase } from '@/application/use-cases/todo/update-todo.usecase';
import type { DeleteTodoUseCase } from '@/application/use-cases/todo/delete-todo.usecase';
import type { GetTodosBySpaceUseCase } from '@/application/use-cases/todo/get-todos-by-space.usecase';
import { TodoItem } from './todo-item';
import { useImageCaptureDialog, type UseImageCaptureDialogReturn } from '@/hooks/use-image-capture-dialog';
import { ImageCaptureDialogView } from '@/components/dialogs/image-capture-dialog-view';
import { CreateTodoDialog } from '@/components/dialogs/create-todo-dialog';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TodoSectionProps {
  spaceId: string;
  createTodoUseCase: CreateTodoUseCase;
  updateTodoUseCase: UpdateTodoUseCase;
  deleteTodoUseCase: DeleteTodoUseCase;
  getTodosBySpaceUseCase: GetTodosBySpaceUseCase;
  onItemsChanged: () => void; // Renamed from onTodosChanged for consistency
}

type CaptureMode = 'before' | 'after';

export function TodoSection({
  spaceId,
  createTodoUseCase,
  updateTodoUseCase,
  deleteTodoUseCase,
  getTodosBySpaceUseCase,
  onItemsChanged,
}: TodoSectionProps) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [isCreateTodoDialogOpen, setIsCreateTodoDialogOpen] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [newlyAddedTodoId, setNewlyAddedTodoId] = useState<string | null>(null);


  const imageCaptureExisting: UseImageCaptureDialogReturn<Todo, CaptureMode> = useImageCaptureDialog<Todo, CaptureMode>();

  const sortTodos = useCallback((todoList: Todo[]) => {
    return [...todoList].sort((a, b) => {
      if (a.completed === b.completed) return new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime();
      return a.completed ? 1 : -1;
    });
  }, []);
  
  const fetchTodos = useCallback(async () => {
    if (!spaceId) return;
    setIsLoading(true);
    setFetchError(null); 
    setActionError(null); 
    try {
      const data = await getTodosBySpaceUseCase.execute(spaceId);
      setTodos(sortTodos(data));
    } catch (err: any) {
      console.error("Failed to fetch todos:", err);
      setFetchError(err.message || "Could not load to-do items. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [spaceId, getTodosBySpaceUseCase, sortTodos]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const handleOpenImageCaptureForExistingTodo = useCallback((todo: Todo, mode: CaptureMode) => {
    setActionError(null); 
    imageCaptureExisting.handleOpenImageCaptureDialog(todo, mode);
  }, [imageCaptureExisting]);

  const handleTodoCreated = useCallback((newTodo: Todo) => {
    // Optimistically add to local state
    setTodos(prev => sortTodos([newTodo, ...prev]));
    setNewlyAddedTodoId(newTodo.id);
    setTimeout(() => setNewlyAddedTodoId(null), 1000); // Clear after animation
    onItemsChanged(); // Notify parent (e.g., to refresh timeline)
  }, [sortTodos, onItemsChanged]);

  const handleToggleComplete = useCallback(async (todo: Todo) => {
    setIsSubmittingAction(true);
    setActionError(null);
    try {
      // Optimistically update UI first for perceived speed
      const originalTodos = todos;
      const updatedTodoUI = { ...todo, completed: !todo.completed, lastModifiedDate: new Date().toISOString() };
      setTodos(prev => sortTodos(prev.map(t => t.id === updatedTodoUI.id ? updatedTodoUI : t)));

      await updateTodoUseCase.execute({ id: todo.id, completed: !todo.completed });
      // UI is already updated optimistically. Re-fetch or merge if backend returns different data.
      // For IndexedDB, optimistic is usually fine.
      onItemsChanged();
    } catch (error: any) {
      console.error("Error updating to-do:", error);
      setActionError(error.message || "Could not update to-do.");
      setTodos(prev => sortTodos(prev)); // Revert optimistic update on error if needed (or refetch)
    } finally {
      setIsSubmittingAction(false);
    }
  }, [todos, updateTodoUseCase, sortTodos, onItemsChanged]);

  const handleDeleteTodo = useCallback(async (id: string) => {
    // Optimistic UI update handled by TodoItem's local isDeleting state for animation
    // The actual removal from this component's `todos` state happens after the promise resolves.
    setIsSubmittingAction(true);
    setActionError(null);
    try {
      await deleteTodoUseCase.execute(id);
      setTodos(prev => sortTodos(prev.filter(t => t.id !== id)));
      onItemsChanged();
    } catch (error: any) {
      setActionError(error.message || "Could not delete to-do.");
    } finally {
      setIsSubmittingAction(false);
    }
  }, [deleteTodoUseCase, onItemsChanged, sortTodos]);
  
  const handleUpdateDescription = useCallback(async (id: string, newDescription: string) => {
    setIsSubmittingAction(true);
    setActionError(null);
    const originalTodos = todos;
    try {
      // Optimistic UI update
      const updatedTodoUI = todos.find(t => t.id === id);
      if (updatedTodoUI) {
        const tempUpdated = { ...updatedTodoUI, description: newDescription, lastModifiedDate: new Date().toISOString() };
        setTodos(prev => sortTodos(prev.map(t => t.id === id ? tempUpdated : t)));
      }

      await updateTodoUseCase.execute({ id: id, description: newDescription });
      onItemsChanged();
    } catch (error: any) {
      console.error("Error updating to-do description:", error);
      setActionError(error.message || "Could not save to-do description.");
      setTodos(originalTodos); // Revert on error
    } finally {
      setIsSubmittingAction(false);
    }
  }, [todos, updateTodoUseCase, sortTodos, onItemsChanged]);

  const handleCaptureAndSaveImageForExistingTodo = useCallback(async () => {
    if (!imageCaptureExisting.videoRef.current || !imageCaptureExisting.canvasRef.current || !imageCaptureExisting.selectedItemForImage || !imageCaptureExisting.captureMode) return;
    
    imageCaptureExisting.setIsCapturingImage(true);
    setActionError(null);
    const video = imageCaptureExisting.videoRef.current;
    const canvas = imageCaptureExisting.canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
        setActionError("Could not get canvas context for image capture.");
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
      // Optimistically update local state
      setTodos(prev => sortTodos(prev.map(t => t.id === updatedTodo.id ? updatedTodo : t)));
      onItemsChanged();
      imageCaptureExisting.handleCloseImageCaptureDialog();
    } catch (error: any) {
      console.error("Error saving image:", error);
      setActionError(error.message || "Could not save image.");
    } finally {
        imageCaptureExisting.setIsCapturingImage(false);
        setIsSubmittingAction(false);
    }
  }, [imageCaptureExisting, updateTodoUseCase, sortTodos, onItemsChanged]);

  const handleRemoveImageForExistingTodo = useCallback(async (todoId: string, imgMode: CaptureMode) => {
    setIsSubmittingAction(true); 
    setActionError(null);
    try {
        const updateData: UpdateTodoInputDTO = { id: todoId };
        if (imgMode === 'before') {
            updateData.beforeImageDataUri = null; // Signal removal
        } else {
            updateData.afterImageDataUri = null; // Signal removal
        }
        const updatedTodo = await updateTodoUseCase.execute(updateData);
        setTodos(prev => sortTodos(prev.map(t => t.id === updatedTodo.id ? updatedTodo : t)));
        onItemsChanged();
    } catch (error: any) {
        console.error("Error removing image:", error);
        setActionError(error.message || "Could not remove image.");
    } finally {
        setIsSubmittingAction(false);
    }
  }, [updateTodoUseCase, sortTodos, onItemsChanged]);

  const handleOpenCreateTodoDialog = useCallback(() => {
    setActionError(null); 
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
          {(fetchError || actionError) && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{fetchError || actionError}</AlertDescription>
            </Alert>
          )}
          {todos.length === 0 && !fetchError && !isLoading && (
            <p className="text-muted-foreground text-center py-4">No to-do items yet. Click 'Add To-Do' to get started.</p>
          )}
          
          {todos.length > 0 && (
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
                  isNewlyAdded={todo.id === newlyAddedTodoId}
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

    