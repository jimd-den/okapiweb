
// src/components/dialogs/todo-list-dialog.tsx
"use client";

import React, { useMemo, useCallback } from 'react';
import type { Todo, TodoStatus } from '@/domain/entities';
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
import { cn } from '@/lib/utils';


const KANBAN_COLUMNS_ORDER: TodoStatus[] = ['todo', 'doing', 'done'];

const KANBAN_COLUMN_UI_DATA: Record<TodoStatus, { id: TodoStatus; title: string; icon: React.ReactNode; }> = {
  todo: { id: 'todo', title: 'To Do', icon: <ListTodo className="h-5 w-5" /> },
  doing: { id: 'doing', title: 'Doing', icon: <History className="h-5 w-5" /> },
  done: { id: 'done', title: 'Done', icon: <ClipboardCheck className="h-5 w-5" /> },
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
  onOpenCreateTodoDialog: () => void; 
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
  onOpenCreateTodoDialog,
}: TodoListDialogProps) {

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
        }
      });
    }
    
    for (const status in grouped) {
      grouped[status as TodoStatus].sort((a, b) => (a.order || 0) - (b.order || 0) || new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime());
    }
    return grouped;
  }, [allTodos]);


  const visibleColumns = initialStatusFilter ? [initialStatusFilter] : KANBAN_COLUMNS_ORDER;


  if (!isOpen) {
    return null;
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className={cn(
          "sm:max-w-4xl md:max-w-5xl lg:max-w-6xl max-h-[90vh] flex flex-col p-0",
          visibleColumns.length === 1 && "sm:max-w-md md:max-w-lg" 
        )}>
          <DialogHeader className="p-4 sm:p-5 pb-2 sm:pb-3 border-b shrink-0 flex flex-row justify-between items-center">
            <div>
              <DialogTitle className="text-lg sm:text-xl">{title}</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                {visibleColumns.length > 1 ? "Manage your tasks across different stages." : `Tasks currently in "${initialStatusFilter || 'Unknown'}" status.`}
              </DialogDescription>
            </div>
            <Button onClick={onOpenCreateTodoDialog} size="sm" className="text-xs sm:text-sm">
              <PlusCircle className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Add New To-Do
            </Button>
          </DialogHeader>
          
          <div className={cn(
            "flex-1 grid gap-2 sm:gap-3 p-2 sm:p-3 overflow-hidden",
            visibleColumns.length === 1 ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3"
          )}>
            {visibleColumns.map((statusKey) => {
              const column = KANBAN_COLUMN_UI_DATA[statusKey];
              const items = todosByStatus[statusKey] || [];
              
              return (
                  <div key={column.id} className="flex flex-col bg-muted/30 rounded-lg overflow-hidden h-full">
                    <h3 className="text-sm sm:text-md font-semibold p-2 border-b bg-muted/50 shrink-0 flex items-center justify-between">
                      <span className="flex items-center">
                        {React.cloneElement(column.icon as React.ReactElement, { className: "h-4 w-4 mr-1.5" })}
                        {column.title} 
                      </span>
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        {items.length || 0}
                      </span>
                    </h3>
                    <ScrollArea className="flex-1 p-2">
                      {(items.length || 0) === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-6 text-center">
                          <ClipboardList className="h-8 w-8 sm:h-10 sm:w-10 mb-1.5 opacity-40" />
                          <p className="text-xs sm:text-sm">No items here.</p>
                        </div>
                      ) : (
                        <div className="space-y-1.5 sm:space-y-2">
                          {items.map((todo) => (
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
              );
            })}
          </div>
          
          <DialogFooter className="p-4 sm:p-5 pt-2 sm:pt-3 border-t shrink-0">
            <Button type="button" variant="outline" size="default" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
