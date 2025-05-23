
// src/components/space-tabs/todo-section.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Todo } from '@/domain/entities/todo.entity';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  onItemsChanged: () => void;
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
    if (!spaceId || !getTodosBySpaceUseCase) {
      setFetchError("Configuration error in TodoSection.");
      setIsLoading(false);
      return;
    }
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
    setTodos(prev => sortTodos([newTodo, ...prev]));
    setNewlyAddedTodoId(newTodo.id);
    setTimeout(() => setNewlyAddedTodoId(null), 1000); 
    onItemsChanged(); 
    setIsCreateTodoDialogOpen(false); 
  }, [sortTodos, onItemsChanged]);

  const handleToggleComplete = useCallback(async (todo: Todo) => {
    setIsSubmittingAction(true);
    setActionError(null);
    const originalTodos = [...todos]; 
    try {
      const updatedTodoUI = { ...todo, completed: !todo.completed, lastModifiedDate: new Date().toISOString() };
      setTodos(prev => sortTodos(prev.map(t => t.id === updatedTodoUI.id ? updatedTodoUI : t)));

      await updateTodoUseCase.execute({ id: todo.id, completed: !todo.completed });
      onItemsChanged();
    } catch (error: any) {
      console.error("Error updating to-do:", error);
      setActionError(error.message || "Could not update to-do.");
      setTodos(originalTodos); 
    } finally {
      setIsSubmittingAction(false);
    }
  }, [todos, updateTodoUseCase, sortTodos, onItemsChanged]);

  const handleDeleteTodo = useCallback(async (id: string) => {
    setIsSubmittingAction(true);
    setActionError(null);
    const originalTodos = [...todos];
    try {
      await deleteTodoUseCase.execute(id);
      // Optimistic removal happens in TodoItem's animation callback
      // This ensures the backend operation is complete before actual state removal if animation isn't used.
      // For animation: TodoItem handles its own removal from UI, then this confirms data removal.
      setTodos(prev => sortTodos(prev.filter(t => t.id !== id))); // Keep this if no animation or as fallback
      onItemsChanged();
    } catch (error: any) {
      console.error("Error deleting to-do:", error);
      setActionError(error.message || "Could not delete to-do.");
      setTodos(originalTodos);
    } finally {
      setIsSubmittingAction(false);
    }
  }, [todos, deleteTodoUseCase, onItemsChanged, sortTodos]);
  
  const handleUpdateDescription = useCallback(async (id: string, newDescription: string) => {
    setIsSubmittingAction(true);
    setActionError(null);
    const originalTodos = [...todos];
    try {
      const todoToUpdate = todos.find(t => t.id === id);
      if (todoToUpdate) {
        const updatedTodoUI = { ...todoToUpdate, description: newDescription, lastModifiedDate: new Date().toISOString() };
        setTodos(prev => sortTodos(prev.map(t => t.id === id ? updatedTodoUI : t)));
      }
      await updateTodoUseCase.execute({ id: id, description: newDescription });
      onItemsChanged();
    } catch (error: any) {
      console.error("Error updating to-do description:", error);
      setActionError(error.message || "Could not save to-do description.");
      setTodos(originalTodos);
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
    const originalTodos = [...todos];
    try {
        const updateData: UpdateTodoInputDTO = { id: todoId };
        if (imgMode === 'before') {
            updateData.beforeImageDataUri = null; 
        } else {
            updateData.afterImageDataUri = null; 
        }
        const updatedTodo = await updateTodoUseCase.execute(updateData);
        setTodos(prev => sortTodos(prev.map(t => t.id === updatedTodo.id ? updatedTodo : t)));
        onItemsChanged();
    } catch (error: any) {
        console.error("Error removing image:", error);
        setActionError(error.message || "Could not remove image.");
        setTodos(originalTodos);
    } finally {
        setIsSubmittingAction(false);
    }
  }, [todos, updateTodoUseCase, sortTodos, onItemsChanged]);

  const handleOpenCreateTodoDialog = useCallback(() => {
    setActionError(null); 
    setIsCreateTodoDialogOpen(true);
  }, []);

  const handleCloseCreateTodoDialog = useCallback(() => {
    setIsCreateTodoDialogOpen(false);
  }, []);

  return (
    <>
      <Card className="shadow-lg h-full flex flex-col">
        <CardHeader className="shrink-0">
          <CardTitle className="text-xl flex items-center justify-between">
            <span>To-Do List</span>
            <Button onClick={handleOpenCreateTodoDialog} className="text-md">
              <PlusCircle className="mr-2 h-5 w-5" /> Add To-Do
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0 sm:p-4">
          {isLoading && (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Loading to-dos...</p>
            </div>
          )}
          {(fetchError || actionError) && !isLoading && (
            <div className="p-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{fetchError || actionError}</AlertDescription>
              </Alert>
            </div>
          )}
          {!isLoading && !fetchError && !actionError && todos.length === 0 && (
             <div className="flex justify-center items-center h-full">
                <p className="text-muted-foreground text-center py-4">No to-do items yet. Click 'Add To-Do' to get started.</p>
            </div>
          )}
          
          {!isLoading && !fetchError && !actionError && todos.length > 0 && (
            <ScrollArea className="h-full pr-3">
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
            </ScrollArea>
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
