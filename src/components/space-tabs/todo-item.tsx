
// src/components/space-tabs/todo-item.tsx
"use client";

import type { ChangeEvent } from 'react';
import type { Todo, TodoStatus } from '@/domain/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Edit2, Save, XCircle, Loader2, Camera, RefreshCw, ArrowRight, Check, RotateCcw, GripVertical } from 'lucide-react';
import NextImage from 'next/image';
import { useEditableItem } from '@/hooks';
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
import { Card } from '@/components/ui/card'; 

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
      if (!updatedTodo.description.trim()) {
        throw new Error("Description cannot be empty.");
      }
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
    <Card className={cn(
        "p-2.5 rounded-md flex flex-col gap-1.5 transition-all shadow-sm hover:shadow-md",
        todo.status === 'done' ? 'bg-slate-100 dark:bg-slate-800/30 hover:bg-slate-200 dark:hover:bg-slate-700/40' : 'bg-background hover:bg-slate-50 dark:hover:bg-slate-800/60',
        isNewlyAdded && ANIMATION_ITEM_NEWLY_ADDED,
        isDeleting && ANIMATION_ITEM_FADE_OUT,
        isEditing && "ring-1 ring-primary"
      )}>
      <div className="flex items-start gap-1.5">
        <div className="flex-grow min-w-0">
          {isEditing ? (
            <Input
              type="text"
              value={editedData.description}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleFieldChange('description', e.target.value)}
              className="text-sm p-1 w-full h-7" 
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !combinedSubmitting) handleSave();
                if (e.key === 'Escape' && !combinedSubmitting) cancelEdit();
              }}
              disabled={combinedSubmitting}
            />
          ) : (
            <p className={cn(
                "text-sm font-medium break-words", 
                todo.status === 'done' && 'line-through text-muted-foreground'
              )}
              onClick={!isEditing && !combinedSubmitting && todo.status !== 'done' ? startEdit : undefined}
              title={todo.description}
            >
              {todo.description}
            </p>
          )}
        </div>
        <div className="flex gap-0.5 ml-auto shrink-0 items-center">
          {isEditing ? (
            <>
              <Button variant="ghost" size="icon" onClick={handleSave} aria-label="Save edit" disabled={combinedSubmitting} className="h-6 w-6">
                {isItemSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5 text-green-600" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={cancelEdit} aria-label="Cancel edit" disabled={combinedSubmitting} className="h-6 w-6">
                <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </>
          ) : (
            todo.status !== 'done' && (
              <Button variant="ghost" size="icon" onClick={startEdit} aria-label="Edit to-do" disabled={combinedSubmitting} className="h-6 w-6">
                <Edit2 className="h-3.5 w-3.5 text-blue-600" />
              </Button>
            )
          )}
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-0.5">
        <Badge variant={getStatusBadgeVariant(todo.status)} className="capitalize text-[0.65rem] px-1.5 py-0.5 h-5">
            {todo.status}
        </Badge>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-xs h-6 w-6" disabled={combinedSubmitting}>
              {isChangingStatus ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowRight className="h-3 w-3"/>}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="text-xs">
            {todo.status !== 'todo' && (
              <DropdownMenuItem onClick={() => handleStatusChange('todo')} disabled={isChangingStatus} className="text-xs p-1.5">
                <RotateCcw className="mr-1.5 h-3 w-3" /> To Do
              </DropdownMenuItem>
            )}
            {todo.status !== 'doing' && (
              <DropdownMenuItem onClick={() => handleStatusChange('doing')} disabled={isChangingStatus} className="text-xs p-1.5">
                <ArrowRight className="mr-1.5 h-3 w-3" /> Doing
              </DropdownMenuItem>
            )}
            {todo.status !== 'done' && (
              <DropdownMenuItem onClick={() => handleStatusChange('done')} disabled={isChangingStatus} className="text-xs p-1.5">
                <Check className="mr-1.5 h-3 w-3" /> Done
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {(todo.beforeImageDataUri || todo.afterImageDataUri) && (
        <div className="flex gap-1.5 mt-1">
          {todo.beforeImageDataUri && (
            <div className="relative group w-1/2">
              <NextImage src={todo.beforeImageDataUri} alt={`Before image for ${todo.description}`} width={80} height={60} className="rounded border object-cover w-full aspect-[4/3]" data-ai-hint="initial state" />
               <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity rounded">
                <Button variant="outline" size="icon" onClick={() => onOpenImageCapture(todo, 'before')} disabled={combinedSubmitting} className="h-6 w-6">
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
                <Button variant="destructive" size="icon" onClick={() => onRemoveImage(todo.id, 'before')} disabled={combinedSubmitting} className="h-6 w-6">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p className="text-[0.65rem] text-center text-muted-foreground mt-0.5">Before</p>
            </div>
          )}
          {todo.afterImageDataUri && (
            <div className="relative group w-1/2">
              <NextImage src={todo.afterImageDataUri} alt={`After image for ${todo.description}`} width={80} height={60} className="rounded border object-cover w-full aspect-[4/3]" data-ai-hint="final state"/>
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity rounded">
                <Button variant="outline" size="icon" onClick={() => onOpenImageCapture(todo, 'after')} disabled={combinedSubmitting} className="h-6 w-6">
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
                <Button variant="destructive" size="icon" onClick={() => onRemoveImage(todo.id, 'after')} disabled={combinedSubmitting} className="h-6 w-6">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p className="text-[0.65rem] text-center text-muted-foreground mt-0.5">After</p>
            </div>
          )}
        </div>
      )}
       <div className="flex items-center justify-end mt-0.5">
         <Button variant="ghost" size="icon" onClick={handleDeleteWithAnimation} aria-label="Delete to-do" disabled={combinedSubmitting} className="h-6 w-6">
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
      </div>
    </Card>
  );
}
