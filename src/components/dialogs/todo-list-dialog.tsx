
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
} from '@/components/ui/dialog'; // Removed DialogClose
import { ScrollArea } from '@/components/ui/scroll-area';
import { TodoItem } from '@/components/space-tabs/todo-item'; 
import { ClipboardList } from 'lucide-react';

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
      <DialogContent className="sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-2xl">{title}</DialogTitle>
          <DialogDescription>
            Manage items in this list. Changes are saved automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-hidden p-6">
          {todos.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <ClipboardList className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg">No items in this list yet.</p>
            </div>
          ) : (
            <ScrollArea className="h-full pr-2"> {/* Reduced padding for scrollbar if needed */}
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
        <DialogFooter className="p-6 pt-4 border-t">
          <Button type="button" variant="outline" size="lg" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
