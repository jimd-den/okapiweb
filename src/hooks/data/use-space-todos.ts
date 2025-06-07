
// src/hooks/data/use-space-todos.ts
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Todo, TodoStatus } from '@/domain/entities';
import {
  CreateTodoUseCase, type CreateTodoInputDTO,
  UpdateTodoUseCase, type UpdateTodoInputDTO,
  DeleteTodoUseCase,
  GetTodosBySpaceUseCase
} from '@/application/use-cases';
import { IndexedDBTodoRepository } from '@/infrastructure/persistence/indexeddb';
import { useImageCaptureDialog, type UseImageCaptureDialogReturn } from '@/hooks';

type CaptureMode = 'before' | 'after';

export interface UseSpaceTodosProps {
  spaceId: string;
  onTodosChanged: (todos: Todo[]) => void; 
}

export interface UseSpaceTodosReturn {
  allTodos: Todo[];
  isLoadingTodos: boolean;
  todosError: string | null;
  newlyAddedTodoId: string | null;
  refreshTodos: () => Promise<void>;
  handleTodoCreatedFromDialog: (newTodoData: Omit<CreateTodoInputDTO, 'spaceId'>) => Promise<Todo>;
  handleUpdateTodoStatus: (todo: Todo, newStatus: TodoStatus) => Promise<void>;
  handleDeleteTodo: (id: string) => Promise<void>;
  handleUpdateTodoDescription: (id: string, newDescription: string) => Promise<void>;
  imageCaptureHook: UseImageCaptureDialogReturn<Todo, CaptureMode>;
  handleCaptureAndSaveImage: () => Promise<void>;
  handleRemoveImage: (todoId: string, mode: CaptureMode) => Promise<void>;
  createTodoUseCase: CreateTodoUseCase;
}

export function useSpaceTodos({
  spaceId,
  onTodosChanged,
}: UseSpaceTodosProps): UseSpaceTodosReturn {
  const [allTodos, setAllTodos] = useState<Todo[]>([]);
  const [isLoadingTodos, setIsLoadingTodos] = useState(true);
  const [todosError, setTodosError] = useState<string | null>(null);
  const [newlyAddedTodoId, setNewlyAddedTodoId] = useState<string | null>(null);

  const imageCaptureHook = useImageCaptureDialog<Todo, CaptureMode>();

  const todoRepository = useMemo(() => new IndexedDBTodoRepository(), []);
  const createTodoUseCase = useMemo(() => new CreateTodoUseCase(todoRepository), [todoRepository]);
  const updateTodoUseCase = useMemo(() => new UpdateTodoUseCase(todoRepository), [todoRepository]);
  const deleteTodoUseCase = useMemo(() => new DeleteTodoUseCase(todoRepository), [todoRepository]);
  const getTodosBySpaceUseCase = useMemo(() => new GetTodosBySpaceUseCase(todoRepository), [todoRepository]);

  const sortTodos = useCallback((todoList: Todo[]) => {
    return [...todoList].sort((a, b) => (a.order || 0) - (b.order || 0) || new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime());
  }, []);

  const fetchTodos = useCallback(async () => {
    if (!spaceId) {
      setTodosError("Space ID not provided for fetching todos.");
      setIsLoadingTodos(false);
      return;
    }
    setIsLoadingTodos(true);
    setTodosError(null);
    try {
      const data = await getTodosBySpaceUseCase.execute(spaceId);
      const sortedData = sortTodos(data);
      setAllTodos(sortedData);
      queueMicrotask(() => {
        onTodosChanged(sortedData);
      });
    } catch (err: any) {
      console.error("Failed to fetch todos:", err);
      setTodosError(err.message || "Could not load to-do items.");
    } finally {
      setIsLoadingTodos(false);
    }
  }, [spaceId, getTodosBySpaceUseCase, sortTodos, onTodosChanged]);

  useEffect(() => {
    if(spaceId) {
      fetchTodos();
    }
  }, [fetchTodos, spaceId]);

  const handleTodoCreatedFromDialog = useCallback(async (newTodoPartialData: Omit<CreateTodoInputDTO, 'spaceId'>): Promise<Todo> => {
    setIsLoadingTodos(true); 
    setTodosError(null);
    try {
      const fullNewTodoData: CreateTodoInputDTO = { ...newTodoPartialData, spaceId };
      const newTodo = await createTodoUseCase.execute(fullNewTodoData);
      setAllTodos(prev => {
        const updated = sortTodos([newTodo, ...prev]);
        queueMicrotask(() => {
           onTodosChanged(updated);
        });
        return updated;
      });
      setNewlyAddedTodoId(newTodo.id);
      setTimeout(() => setNewlyAddedTodoId(null), 1000);
      return newTodo;
    } catch (err: any) {
      console.error("Error creating todo:", err);
      setTodosError(err.message || "Could not create to-do.");
      throw err;
    } finally {
      setIsLoadingTodos(false);
    }
  }, [spaceId, createTodoUseCase, sortTodos, onTodosChanged]);

  const handleUpdateTodoStatus = useCallback(async (todo: Todo, newStatus: TodoStatus) => {
    setTodosError(null);
    try {
      const updatedTodo = await updateTodoUseCase.execute({ id: todo.id, status: newStatus });
      setAllTodos(prev => {
        const updated = sortTodos(prev.map(t => t.id === updatedTodo.id ? updatedTodo : t));
        queueMicrotask(() => {
           onTodosChanged(updated);
        });
        return updated;
      });
    } catch (error: any) {
      console.error("Error updating to-do status:", error);
      setTodosError(error.message || "Could not update to-do status.");
      throw error;
    }
  }, [updateTodoUseCase, sortTodos, onTodosChanged]);

  const handleDeleteTodo = useCallback(async (id: string) => {
    setTodosError(null);
    try {
      await deleteTodoUseCase.execute(id);
      setAllTodos(prev => {
        const updated = sortTodos(prev.filter(t => t.id !== id));
        queueMicrotask(() => {
           onTodosChanged(updated);
        });
        return updated;
      });
    } catch (error: any) {
      console.error("Error deleting to-do:", error);
      setTodosError(error.message || "Could not delete to-do.");
      throw error;
    }
  }, [deleteTodoUseCase, sortTodos, onTodosChanged]);

  const handleUpdateTodoDescription = useCallback(async (id: string, newDescription: string) => {
    setTodosError(null);
    try {
      const updatedTodo = await updateTodoUseCase.execute({ id: id, description: newDescription });
      setAllTodos(prev => {
        const updated = sortTodos(prev.map(t => t.id === id ? updatedTodo : t));
        queueMicrotask(() => {
           onTodosChanged(updated);
        });
        return updated;
      });
    } catch (error: any) {
      console.error("Error updating to-do description:", error);
      setTodosError(error.message || "Could not save to-do description.");
      throw error;
    }
  }, [updateTodoUseCase, sortTodos, onTodosChanged]);

  const handleCaptureAndSaveImage = useCallback(async () => {
    if (!imageCaptureHook.videoRef.current || !imageCaptureHook.canvasRef.current || !imageCaptureHook.selectedItemForImage || !imageCaptureHook.captureMode) return;
    
    imageCaptureHook.setIsCapturingImage(true);
    setTodosError(null);
    const video = imageCaptureHook.videoRef.current;
    const canvas = imageCaptureHook.canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
      setTodosError("Could not get canvas context for image capture.");
      imageCaptureHook.setIsCapturingImage(false);
      return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageDataUri = canvas.toDataURL('image/jpeg', 0.8);

    try {
      const updateData: UpdateTodoInputDTO = { id: imageCaptureHook.selectedItemForImage.id };
      if (imageCaptureHook.captureMode === 'before') {
        updateData.beforeImageDataUri = imageDataUri;
      } else {
        updateData.afterImageDataUri = imageDataUri;
      }
      const updatedTodo = await updateTodoUseCase.execute(updateData);
      setAllTodos(prev => {
        const updated = sortTodos(prev.map(t => t.id === updatedTodo.id ? updatedTodo : t));
        queueMicrotask(() => {
           onTodosChanged(updated);
        });
        return updated;
      });
      imageCaptureHook.handleCloseImageCaptureDialog();
    } catch (error: any) {
      console.error("Error saving image for todo:", error);
      setTodosError(error.message || "Could not save image.");
      throw error;
    } finally {
      imageCaptureHook.setIsCapturingImage(false);
    }
  }, [imageCaptureHook, updateTodoUseCase, sortTodos, onTodosChanged]);

  const handleRemoveImage = useCallback(async (todoId: string, mode: CaptureMode) => {
    setTodosError(null);
    try {
      const updateData: UpdateTodoInputDTO = { id: todoId };
      if (mode === 'before') {
        updateData.beforeImageDataUri = null;
      } else {
        updateData.afterImageDataUri = null;
      }
      const updatedTodo = await updateTodoUseCase.execute(updateData);
      setAllTodos(prev => {
        const updated = sortTodos(prev.map(t => t.id === updatedTodo.id ? updatedTodo : t));
        queueMicrotask(() => {
           onTodosChanged(updated);
        });
        return updated;
      });
    } catch (error: any) {
      console.error("Error removing image from todo:", error);
      setTodosError(error.message || "Could not remove image.");
      throw error;
    }
  }, [updateTodoUseCase, sortTodos, onTodosChanged]);

  return {
    allTodos,
    isLoadingTodos,
    todosError,
    newlyAddedTodoId,
    refreshTodos: fetchTodos,
    handleTodoCreatedFromDialog,
    handleUpdateTodoStatus,
    handleDeleteTodo,
    handleUpdateTodoDescription,
    imageCaptureHook,
    handleCaptureAndSaveImage,
    handleRemoveImage,
    createTodoUseCase, 
  };
}
