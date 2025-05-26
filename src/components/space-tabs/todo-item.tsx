// src/components/space-tabs/todo-item.tsx
"use client";

import type { ChangeEvent } from 'react';
import type { Todo, TodoStatus } from '@/domain/entities/todo.entity';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Edit2, Save, XCircle, Loader2, Camera, RefreshCw, ArrowRight, Check, RotateCcw } from 'lucide-react';
import Image from 'next/image';
import { useEditableItem } from '@/hooks/use-editable-item';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { ANIMATION_ITEM_FADE_OUT, ANIMATION_ITEM_NEWLY_ADDED } from '@/lib/constants';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';

type CaptureMode = 'before' | 'after';

interface TodoItemProps {
  todo: Todo;
  onUpdateStatus: (todo: Todo, newStatus: TodoStatus) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpdateDescription: (id: string, newDescription: string) => Promise<void>;
  onOpenImageCapture: (todo: Todo, mode: CaptureMode) => void;
  onRemoveImage: (todoId: string, mode: CaptureMode) => Promise<void>;
  isSubmittingParent: boolean;
  isNewlyAdded?: boolean;
}

export function TodoItem({
  todo,
  onUpdateStatus,
  onDelete,
  onUpdateDescription,
  onOpenImageCapture,
  onRemoveImage,
  isSubmittingParent,
  isNewlyAdded,
}: TodoItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  const {
    isEditing,
    editedData,
    isSubmitting: isItemSubmitting,
    startEdit,
    cancelEdit,
    handleFieldChange,
    handleSave,
  } = useEditableItem<Todo>({
    initialData: todo,
    onSave: async (updatedTodo) => {
      await onUpdateDescription(updatedTodo.id, updatedTodo.description);
    },
    editableFields: ['description'],
  });
  
  const combinedSubmitting = isSubmittingParent || isItemSubmitting || isDeleting || isChangingStatus;

  const handleDeleteWithAnimation = () => {
    setIsDeleting(true);
    setTimeout(async () => {
      try {
        await onDelete(todo.id);
      } catch (error) {
        console.error("Failed to delete todo item:", error);
        setIsDeleting(false); 
      }
    }, 300); 
  };

  const handleStatusChange = async (newStatus: TodoStatus) => {
    if (combinedSubmitting) return;
    setIsChangingStatus(true);
    try {
      await onUpdateStatus(todo, newStatus);
    } catch (error) {
      console.error("Failed to update status:", error);
      // Parent component (TodoSection) should handle displaying this error
    } finally {
      setIsChangingStatus(false);
    }
  };
  
  const getStatusBadgeVariant = (status: TodoStatus) => {
    switch (status) {
      case 'todo': return 'outline';
      case 'doing': return 'secondary';
      case 'done': return 'default';
      default: return 'outline';
    }
  };


  return (
    <div className={cn(
        "p-3 rounded-lg flex flex-col gap-2 transition-all border shadow-sm",
        todo.status === 'done' ? 'bg-muted/30 hover:bg-muted/40' : 'bg-card hover:bg-card/90',
        isNewlyAdded && ANIMATION_ITEM_NEWLY_ADDED,
        isDeleting && ANIMATION_ITEM_FADE_OUT,
        isEditing && "ring-2 ring-primary"
      )}>
      <div className="flex items-start gap-2">
        <div className="flex-grow min-w-0">
          {isEditing ? (
            <Input
              type="text"
              value={editedData.description}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleFieldChange('description', e.target.value)}
              className="text-sm p-1.5 w-full"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && !combinedSubmitting && handleSave()}
              disabled={combinedSubmitting}
            />
          ) : (
            <p className={cn(
                "text-sm font-medium break-words", 
                todo.status === 'done' && 'line-through text-muted-foreground'
              )}
              onClick={!isEditing && !combinedSubmitting ? startEdit : undefined} // Allow click to edit if not done
              title={todo.description}
            >
              {todo.description}
            </p>
          )}
        </div>
        <div className="flex gap-1 ml-auto shrink-0 items-center">
          {isEditing ? (
            <>
              <Button variant="ghost" size="icon" onClick={handleSave} aria-label="Save edit" disabled={combinedSubmitting} className="h-7 w-7">
                {isItemSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 text-green-600" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={cancelEdit} aria-label="Cancel edit" disabled={combinedSubmitting} className="h-7 w-7">
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </Button>
            </>
          ) : (
            todo.status !== 'done' && (
              <Button variant="ghost" size="icon" onClick={startEdit} aria-label="Edit to-do" disabled={combinedSubmitting} className="h-7 w-7">
                <Edit2 className="h-4 w-4 text-blue-600" />
              </Button>
            )
          )}
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-1">
        <Badge variant={getStatusBadgeVariant(todo.status)} className="capitalize text-xs px-2 py-0.5">{todo.status}</Badge>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs h-7 px-2 py-1" disabled={combinedSubmitting}>
              {isChangingStatus ? <Loader2 className="h-3 w-3 animate-spin" /> : "Move"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {todo.status !== 'todo' && (
              <DropdownMenuItem onClick={() => handleStatusChange('todo')} disabled={isChangingStatus}>
                <RotateCcw className="mr-2 h-4 w-4" /> Move to: To Do
              </DropdownMenuItem>
            )}
            {todo.status !== 'doing' && (
              <DropdownMenuItem onClick={() => handleStatusChange('doing')} disabled={isChangingStatus}>
                <ArrowRight className="mr-2 h-4 w-4" /> Move to: Doing
              </DropdownMenuItem>
            )}
            {todo.status !== 'done' && (
              <DropdownMenuItem onClick={() => handleStatusChange('done')} disabled={isChangingStatus}>
                <Check className="mr-2 h-4 w-4" /> Move to: Done
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {(todo.beforeImageDataUri || todo.afterImageDataUri) && (
        <div className="flex gap-2 mt-2">
          {todo.beforeImageDataUri && (
            <div className="relative group w-1/2">
              <Image src={todo.beforeImageDataUri} alt={`Before image for ${todo.description}`} width={120} height={90} className="rounded border object-cover w-full aspect-[4/3]" data-ai-hint="initial state" />
               <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity rounded">
                <Button variant="outline" size="icon" onClick={() => onOpenImageCapture(todo, 'before')} disabled={combinedSubmitting} className="h-7 w-7">
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button variant="destructive" size="icon" onClick={() => onRemoveImage(todo.id, 'before')} disabled={combinedSubmitting} className="h-7 w-7">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-center text-muted-foreground mt-0.5">Before</p>
            </div>
          )}
          {todo.afterImageDataUri && (
            <div className="relative group w-1/2">
              <Image src={todo.afterImageDataUri} alt={`After image for ${todo.description}`} width={120} height={90} className="rounded border object-cover w-full aspect-[4/3]" data-ai-hint="final state"/>
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity rounded">
                <Button variant="outline" size="icon" onClick={() => onOpenImageCapture(todo, 'after')} disabled={combinedSubmitting} className="h-7 w-7">
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button variant="destructive" size="icon" onClick={() => onRemoveImage(todo.id, 'after')} disabled={combinedSubmitting} className="h-7 w-7">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-center text-muted-foreground mt-0.5">After</p>
            </div>
          )}
        </div>
      )}
       <div className="flex items-center justify-end mt-1">
         <Button variant="ghost" size="icon" onClick={handleDeleteWithAnimation} aria-label="Delete to-do" disabled={combinedSubmitting} className="h-7 w-7">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
      </div>
    </div>
  );
}
