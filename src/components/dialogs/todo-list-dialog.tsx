// src/components/dialogs/todo-list-dialog.tsx
"use client";

import type { Todo, TodoStatus } from '@/domain/entities/todo.entity';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TodoItem } from '@/components/space-tabs/todo-item'; // Adjusted path if necessary

interface TodoListDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  todos: Todo[];
  onUpdateStatus: (todo: Todo, newStatus: TodoStatus) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpdateDescription: (id: string, newDescription: string) => Promise<void>;
  onOpenImageCapture: (todo: Todo, mode: 'before' | 'after') => void;
  onRemoveImage: (todoId: string, mode: 'before' | 'after') => Promise<void>;
  isSubmittingParent: boolean;
  newlyAddedTodoId?: string | null;
}

export function TodoListDialog({
  isOpen,
  onClose,
  title,
  todos,
  onUpdateStatus,
  onDelete,
  onUpdateDescription,
  onOpenImageCapture,
  onRemoveImage,
  isSubmittingParent,
  newlyAddedTodoId,
}: TodoListDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">{title}</DialogTitle>
          <DialogDescription>
            Manage items in this list. Changes are saved automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-hidden py-4">
          {todos.length === 0 ? (
            <p className="text-muted-foreground text-center">No items in this list.</p>
          ) : (
            <ScrollArea className="h-full pr-4">
              <div className="space-y-3">
                {todos.map((todo) => (
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
            </ScrollArea>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" size="lg">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
