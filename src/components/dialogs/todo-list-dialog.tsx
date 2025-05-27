
// src/components/dialogs/todo-list-dialog.tsx
"use client";

import { useState, useMemo, useCallback } from 'react';
import type { Todo, TodoStatus } from '@/domain/entities/todo.entity';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TodoItem } from '@/components/space-tabs/todo-item'; 
import { ClipboardList, PlusCircle, ListTodo, History, ClipboardCheck } from 'lucide-react';
import { CreateTodoDialog } from './create-todo-dialog'; 
import type { CreateTodoUseCase } from '@/application/use-cases/todo/create-todo.usecase';
import { useDialogState } from '@/hooks/use-dialog-state'; 
import { cn } from '@/lib/utils';


const KANBAN_COLUMNS_ORDER: TodoStatus[] = ['todo', 'doing', 'done'];

const KANBAN_COLUMN_TITLES: Record<TodoStatus, string> = {
  todo: 'To Do',
  doing: 'Doing',
  done: 'Done',
};

interface TodoListDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string; 
  allTodos: Todo[]; 
  initialStatusFilter?: TodoStatus | null; 
  onUpdateStatus: (todo: Todo, newStatus: TodoStatus) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpdateDescription: (id: string, newDescription: string) => Promise<void>;
  onOpenImageCapture: (todo: Todo, mode: 'before' | 'after') => void;
  onRemoveImage: (todoId: string, mode: 'before' | 'after') => Promise<void>;
  isSubmittingParent: boolean;
  newlyAddedTodoId?: string | null;
  createTodoUseCase: CreateTodoUseCase;
  spaceId: string;
  onTodoCreated: (newTodo: Todo) => void; 
}

export function TodoListDialog({
  isOpen,
  onClose,
  title,
  allTodos,
  initialStatusFilter, 
  onUpdateStatus,
  onDelete,
  onUpdateDescription,
  onOpenImageCapture,
  onRemoveImage,
  isSubmittingParent,
  newlyAddedTodoId,
  createTodoUseCase,
  spaceId,
  onTodoCreated,
}: TodoListDialogProps) {

  const { isOpen: isCreateNewTodoDialogOpen, openDialog: openCreateNewTodoDialog, closeDialog: closeCreateNewTodoDialog } = useDialogState();

  const todosByStatus = useMemo(() => {
    const grouped: Record<TodoStatus, Todo[]> = {
      todo: [],
      doing: [],
      done: [],
    };
    if (allTodos && Array.isArray(allTodos)) {
      allTodos.forEach(todo => {
        if (todo && todo.status && Object.prototype.hasOwnProperty.call(grouped, todo.status)) {
          grouped[todo.status].push(todo);
        } else {
          console.warn(`Encountered To-Do (ID: ${todo?.id}) with invalid or missing status: '${todo?.status}'. Skipping this item for grouping.`);
        }
      });
    } else {
      console.warn("TodoListDialog: allTodos prop is not a valid array.", allTodos);
    }
    
    for (const status in grouped) {
      grouped[status as TodoStatus].sort((a, b) => (a.order || 0) - (b.order || 0) || new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime());
    }
    return grouped;
  }, [allTodos]);

  const handleInternalTodoCreated = useCallback((newTodo: Todo) => {
    onTodoCreated(newTodo); 
    closeCreateNewTodoDialog(); 
  }, [onTodoCreated, closeCreateNewTodoDialog]);

  const visibleColumns = initialStatusFilter ? [initialStatusFilter] : KANBAN_COLUMNS_ORDER;


  if (!isOpen) {
    return null;
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-4xl md:max-w-5xl lg:max-w-6xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-4 sm:p-5 pb-2 sm:pb-3 border-b shrink-0 flex flex-row justify-between items-center">
            <div>
              <DialogTitle className="text-lg sm:text-xl">{title}</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Manage your tasks. Drag and drop coming soon!
              </DialogDescription>
            </div>
            <Button onClick={openCreateNewTodoDialog} size="sm" className="text-xs sm:text-sm">
              <PlusCircle className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Add New To-Do
            </Button>
          </DialogHeader>
          
          <div className={cn(
            "flex-1 grid gap-2 sm:gap-3 p-2 sm:p-3 overflow-hidden",
            visibleColumns.length === 1 ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3"
          )}>
            {visibleColumns.map((status) => (
              <div key={status} className="flex flex-col bg-muted/30 rounded-lg overflow-hidden h-full">
                <h3 className="text-sm sm:text-md font-semibold p-2 border-b bg-muted/50 shrink-0 flex items-center justify-between">
                  {KANBAN_COLUMN_TITLES[status]} 
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    {todosByStatus[status]?.length || 0}
                  </span>
                </h3>
                <ScrollArea className="flex-1 p-2">
                  {(todosByStatus[status]?.length || 0) === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-6 text-center">
                      <ClipboardList className="h-8 w-8 sm:h-10 sm:w-10 mb-1.5 opacity-40" />
                      <p className="text-xs sm:text-sm">No items here.</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 sm:space-y-2">
                      {todosByStatus[status].map((todo) => (
                        <TodoItem
                          key={todo.id}
                          todo={todo}
                          onUpdateStatus={onUpdateStatus}
                          onDelete={onDelete}
                          onUpdateDescription={onUpdateDescription}
                          onOpenImageCapture={onOpenImageCapture}
                          onRemoveImage={onRemoveImage}
                          isSubmittingParent={isSubmittingParent}
                          isNewlyAdded={todo.id === newlyAddedTodoId}
                        />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            ))}
          </div>
          
          <DialogFooter className="p-4 sm:p-5 pt-2 sm:pt-3 border-t shrink-0">
            <Button type="button" variant="outline" size="default" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {spaceId && createTodoUseCase && ( 
        <CreateTodoDialog
            spaceId={spaceId}
            isOpen={isCreateNewTodoDialogOpen}
            onClose={closeCreateNewTodoDialog}
            createTodoUseCase={createTodoUseCase}
            onTodoCreated={handleInternalTodoCreated}
        />
      )}
    </>
  );
}
    
