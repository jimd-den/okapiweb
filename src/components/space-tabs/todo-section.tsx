// src/components/space-tabs/todo-section.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Todo, TodoStatus } from '@/domain/entities/todo.entity';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, Loader2, AlertTriangle, ListTodo, CheckCircle, Hourglass } from 'lucide-react';
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
import { useDialogState } from '@/hooks/use-dialog-state';

interface TodoSectionProps {
  spaceId: string;
  createTodoUseCase: CreateTodoUseCase;
  updateTodoUseCase: UpdateTodoUseCase;
  deleteTodoUseCase: DeleteTodoUseCase;
  getTodosBySpaceUseCase: GetTodosBySpaceUseCase;
  onItemsChanged: () => void;
}

type CaptureMode = 'before' | 'after';

interface Column {
  id: TodoStatus;
  title: string;
  icon: React.ReactNode;
  todos: Todo[];
}

export function TodoSection({
  spaceId,
  createTodoUseCase,
  updateTodoUseCase,
  deleteTodoUseCase,
  getTodosBySpaceUseCase,
  onItemsChanged,
}: TodoSectionProps) {
  const [allTodos, setAllTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const { 
    isOpen: isCreateTodoDialogOpen, 
    openDialog: openCreateTodoDialog, 
    closeDialog: closeCreateTodoDialog 
  } = useDialogState();
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [newlyAddedTodoId, setNewlyAddedTodoId] = useState<string | null>(null);

  const imageCaptureExisting: UseImageCaptureDialogReturn<Todo, CaptureMode> = useImageCaptureDialog<Todo, CaptureMode>();

  const sortTodosByOrderOrDate = useCallback((todoList: Todo[]) => {
    return [...todoList].sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      if (a.order !== undefined) return -1; // a has order, b doesn't, a comes first
      if (b.order !== undefined) return 1;  // b has order, a doesn't, b comes first
      return new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime(); // Fallback to date
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
      setAllTodos(sortTodosByOrderOrDate(data));
    } catch (err: any) {
      console.error("Failed to fetch todos:", err);
      setFetchError(err.message || "Could not load to-do items. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [spaceId, getTodosBySpaceUseCase, sortTodosByOrderOrDate]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const columns: Column[] = useMemo(() => {
    const todoStatus: Todo[] = sortTodosByOrderOrDate(allTodos.filter(t => t.status === 'todo'));
    const doingStatus: Todo[] = sortTodosByOrderOrDate(allTodos.filter(t => t.status === 'doing'));
    const doneStatus: Todo[] = sortTodosByOrderOrDate(allTodos.filter(t => t.status === 'done'));

    return [
      { id: 'todo', title: 'To Do', icon: <ListTodo className="h-5 w-5" />, todos: todoStatus },
      { id: 'doing', title: 'Doing', icon: <Hourglass className="h-5 w-5" />, todos: doingStatus },
      { id: 'done', title: 'Done', icon: <CheckCircle className="h-5 w-5" />, todos: doneStatus },
    ];
  }, [allTodos, sortTodosByOrderOrDate]);


  const handleOpenImageCaptureForExistingTodo = useCallback((todo: Todo, mode: CaptureMode) => {
    setActionError(null); 
    imageCaptureExisting.handleOpenImageCaptureDialog(todo, mode);
  }, [imageCaptureExisting]);

  const handleTodoCreated = useCallback((newTodo: Todo) => {
    setAllTodos(prev => sortTodosByOrderOrDate([newTodo, ...prev]));
    setNewlyAddedTodoId(newTodo.id);
    setTimeout(() => setNewlyAddedTodoId(null), 1000); 
    onItemsChanged(); 
    closeCreateTodoDialog(); 
  }, [sortTodosByOrderOrDate, onItemsChanged, closeCreateTodoDialog]);

  const handleUpdateStatus = useCallback(async (todo: Todo, newStatus: TodoStatus) => {
    setIsSubmittingAction(true);
    setActionError(null);
    const originalTodos = [...allTodos];
    try {
        const updatedTodo = await updateTodoUseCase.execute({ id: todo.id, status: newStatus });
        setAllTodos(prev => sortTodosByOrderOrDate(prev.map(t => t.id === updatedTodo.id ? updatedTodo : t)));
        onItemsChanged();
    } catch (error: any) {
        console.error("Error updating to-do status:", error);
        setActionError(error.message || "Could not update to-do status.");
        setAllTodos(originalTodos);
    } finally {
        setIsSubmittingAction(false);
    }
  }, [allTodos, updateTodoUseCase, sortTodosByOrderOrDate, onItemsChanged]);


  const handleDeleteTodo = useCallback(async (id: string) => {
    setIsSubmittingAction(true);
    setActionError(null);
    const originalTodos = [...allTodos];
    try {
      await deleteTodoUseCase.execute(id);
      setAllTodos(prev => sortTodosByOrderOrDate(prev.filter(t => t.id !== id))); 
      onItemsChanged();
    } catch (error: any) {
      setActionError(error.message || "Could not delete to-do.");
      setAllTodos(originalTodos);
    } finally {
      setIsSubmittingAction(false);
    }
  }, [allTodos, deleteTodoUseCase, onItemsChanged, sortTodosByOrderOrDate]);
  
  const handleUpdateDescription = useCallback(async (id: string, newDescription: string) => {
    setIsSubmittingAction(true);
    setActionError(null);
    const originalTodos = [...allTodos];
    try {
      const updatedTodo = await updateTodoUseCase.execute({ id: id, description: newDescription });
      setAllTodos(prev => sortTodosByOrderOrDate(prev.map(t => t.id === id ? updatedTodo : t)));
      onItemsChanged();
    } catch (error: any) {
      console.error("Error updating to-do description:", error);
      setActionError(error.message || "Could not save to-do description.");
      setAllTodos(originalTodos);
    } finally {
      setIsSubmittingAction(false);
    }
  }, [allTodos, updateTodoUseCase, sortTodosByOrderOrDate, onItemsChanged]);

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
      setAllTodos(prev => sortTodosByOrderOrDate(prev.map(t => t.id === updatedTodo.id ? updatedTodo : t)));
      onItemsChanged();
      imageCaptureExisting.handleCloseImageCaptureDialog();
    } catch (error: any) {
      console.error("Error saving image:", error);
      setActionError(error.message || "Could not save image.");
    } finally {
        imageCaptureExisting.setIsCapturingImage(false);
        setIsSubmittingAction(false);
    }
  }, [imageCaptureExisting, updateTodoUseCase, sortTodosByOrderOrDate, onItemsChanged, allTodos]);

  const handleRemoveImageForExistingTodo = useCallback(async (todoId: string, imgMode: CaptureMode) => {
    setIsSubmittingAction(true); 
    setActionError(null);
    const originalTodos = [...allTodos];
    try {
        const updateData: UpdateTodoInputDTO = { id: todoId };
        if (imgMode === 'before') {
            updateData.beforeImageDataUri = null; 
        } else {
            updateData.afterImageDataUri = null; 
        }
        const updatedTodo = await updateTodoUseCase.execute(updateData);
        setAllTodos(prev => sortTodosByOrderOrDate(prev.map(t => t.id === updatedTodo.id ? updatedTodo : t)));
        onItemsChanged();
    } catch (error: any) {
        console.error("Error removing image:", error);
        setActionError(error.message || "Could not remove image.");
        setAllTodos(originalTodos);
    } finally {
        setIsSubmittingAction(false);
    }
  }, [allTodos, updateTodoUseCase, sortTodosByOrderOrDate, onItemsChanged]);

  return (
    <>
      <div className="h-full flex flex-col">
        <div className="flex justify-between items-center p-4 pb-2 shrink-0">
          <h2 className="text-xl font-semibold">To-Do Board</h2>
          <Button onClick={openCreateTodoDialog} className="text-md">
            <PlusCircle className="mr-2 h-5 w-5" /> Add To-Do
          </Button>
        </div>

        {(fetchError || actionError) && !isLoading && (
          <div className="p-4 shrink-0">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{fetchError || actionError}</AlertDescription>
            </Alert>
          </div>
        )}
        
        {isLoading && (
          <div className="flex-1 flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2 text-muted-foreground">Loading to-dos...</p>
          </div>
        )}

        {!isLoading && !fetchError && allTodos.length === 0 && (
            <div className="flex-1 flex flex-col justify-center items-center text-muted-foreground">
              <ListTodo className="h-16 w-16 mb-4 opacity-50" />
              <p>No to-do items yet.</p>
              <p>Click 'Add To-Do' to get started.</p>
          </div>
        )}

        {!isLoading && !fetchError && allTodos.length > 0 && (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden p-4">
            {columns.map((column) => (
              <Card key={column.id} className="flex flex-col overflow-hidden shadow-md">
                <CardHeader className="p-3 border-b sticky top-0 bg-card z-10">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {column.icon}
                    {column.title}
                    <Badge variant="secondary" className="ml-auto">{column.todos.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <ScrollArea className="flex-1 bg-muted/20">
                  <CardContent className="p-3 space-y-3">
                    {column.todos.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No items in this stage.</p>
                    ) : (
                      column.todos.map(todo => (
                        <TodoItem
                          key={todo.id}
                          todo={todo}
                          onUpdateStatus={handleUpdateStatus}
                          onDelete={handleDeleteTodo}
                          onUpdateDescription={handleUpdateDescription}
                          onOpenImageCapture={handleOpenImageCaptureForExistingTodo}
                          onRemoveImage={handleRemoveImageForExistingTodo}
                          isSubmittingParent={isSubmittingAction}
                          isNewlyAdded={todo.id === newlyAddedTodoId}
                        />
                      ))
                    )}
                  </CardContent>
                </ScrollArea>
              </Card>
            ))}
          </div>
        )}
      </div>

      <CreateTodoDialog
        spaceId={spaceId}
        isOpen={isCreateTodoDialogOpen}
        onClose={closeCreateTodoDialog}
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
