
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

  const [isCreateNewTodoDialogOpen, setIsCreateNewTodoDialogOpen] = useState(false);

  const todosByStatus = useMemo(() => {
    const grouped: Record<TodoStatus, Todo[]> = {
      todo: [],
      doing: [],
      done: [],
    };
    allTodos.forEach(todo => {
      grouped[todo.status].push(todo);
    });
    for (const status in grouped) {
      grouped[status as TodoStatus].sort((a, b) => (a.order || 0) - (b.order || 0) || new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime());
    }
    return grouped;
  }, [allTodos]);

  const handleInternalTodoCreated = (newTodo: Todo) => {
    onTodoCreated(newTodo); 
    setIsCreateNewTodoDialogOpen(false); 
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-4xl md:max-w-5xl lg:max-w-6xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-4 sm:p-6 pb-2 sm:pb-4 border-b shrink-0 flex flex-row justify-between items-center">
            <div>
              <DialogTitle className="text-xl sm:text-2xl">{title}</DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                Manage your tasks across different stages. Drag and drop coming soon!
              </DialogDescription>
            </div>
            <Button onClick={() => setIsCreateNewTodoDialogOpen(true)} size="sm" className="text-sm">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New To-Do
            </Button>
          </DialogHeader>
          
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 p-3 sm:p-4 overflow-hidden">
            {KANBAN_COLUMNS_ORDER.map((status) => (
              <div key={status} className="flex flex-col bg-muted/30 rounded-lg overflow-hidden h-full"> {/* h-full for flex item */}
                <h3 className="text-md sm:text-lg font-semibold p-2 sm:p-3 border-b bg-muted/50 shrink-0">
                  {KANBAN_COLUMN_TITLES[status]} ({todosByStatus[status].length})
                </h3>
                <ScrollArea className="flex-1 p-2 sm:p-3"> {/* flex-1 to take remaining space */}
                  {todosByStatus[status].length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-10 text-center">
                      <ClipboardList className="h-10 w-10 mb-2 opacity-40" />
                      <p className="text-xs sm:text-sm">No items here.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 sm:space-y-3">
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
          
          <DialogFooter className="p-4 sm:p-6 pt-2 sm:pt-4 border-t shrink-0">
            <Button type="button" variant="outline" size="lg" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateTodoDialog
        spaceId={spaceId}
        isOpen={isCreateNewTodoDialogOpen}
        onClose={() => setIsCreateNewTodoDialogOpen(false)}
        createTodoUseCase={createTodoUseCase}
        onTodoCreated={handleInternalTodoCreated}
      />
    </>
  );
}
    
