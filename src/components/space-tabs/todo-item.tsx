
// src/components/space-tabs/todo-item.tsx
"use client";

import type { ChangeEvent } from 'react';
import type { Todo } from '@/domain/entities/todo.entity';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Edit2, Save, XCircle, Loader2, Camera, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { useEditableItem } from '@/hooks/use-editable-item';
import { cn } from '@/lib/utils';
import { useState } from 'react'; // Added for isDeleting state

type CaptureMode = 'before' | 'after';

interface TodoItemProps {
  todo: Todo;
  onToggleComplete: (todo: Todo) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpdateDescription: (id: string, newDescription: string) => Promise<void>;
  onOpenImageCapture: (todo: Todo, mode: CaptureMode) => void;
  onRemoveImage: (todoId: string, mode: CaptureMode) => Promise<void>;
  isSubmittingParent: boolean;
  isNewlyAdded?: boolean;
}

export function TodoItem({
  todo,
  onToggleComplete,
  onDelete,
  onUpdateDescription,
  onOpenImageCapture,
  onRemoveImage,
  isSubmittingParent,
  isNewlyAdded,
}: TodoItemProps) {
  const [isDeleting, setIsDeleting] = useState(false); // Local state for delete animation

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
  
  const combinedSubmitting = isSubmittingParent || isItemSubmitting || isDeleting;

  const handleDeleteWithAnimation = () => {
    setIsDeleting(true);
    // Wait for animation to (partially) play before calling actual delete
    setTimeout(async () => {
      try {
        await onDelete(todo.id);
        // No need to setIsDeleting(false) as component will unmount
      } catch (error) {
        console.error("Failed to delete todo item:", error);
        setIsDeleting(false); // Reset if delete fails
      }
    }, 300); // Duration should match animation-fade-out
  };

  return (
    <li className={cn(
        "p-4 rounded-md flex flex-col gap-3 transition-all border",
        todo.completed ? 'bg-muted/50 hover:bg-muted/70' : 'bg-card hover:bg-muted/30',
        isNewlyAdded && "animate-in fade-in-50 slide-in-from-top-5 duration-500 ease-out",
        isDeleting && "animate-out fade-out duration-300" // Fade-out animation
      )}>
      <div className="flex items-start gap-3">
        <Checkbox
          id={`todo-${todo.id}`}
          checked={todo.completed}
          onCheckedChange={() => onToggleComplete(todo)}
          className="h-5 w-5 shrink-0 mt-0.5"
          aria-label={todo.completed ? 'Mark as incomplete' : 'Mark as complete'}
          disabled={combinedSubmitting}
        />
        {isEditing ? (
          <Input
            type="text"
            value={editedData.description}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleFieldChange('description', e.target.value)}
            className="text-md p-1.5 flex-grow"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && !combinedSubmitting && handleSave()}
            disabled={combinedSubmitting}
          />
        ) : (
          <label htmlFor={`todo-${todo.id}`} className={`flex-grow cursor-pointer text-md ${todo.completed ? 'line-through text-muted-foreground' : ''}`}>
            {todo.description}
          </label>
        )}
        <div className="flex gap-1.5 ml-auto shrink-0">
          {isEditing ? (
            <>
              <Button variant="ghost" size="icon" onClick={handleSave} aria-label="Save edit" disabled={combinedSubmitting}>
                {isItemSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-5 w-5 text-green-600" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={cancelEdit} aria-label="Cancel edit" disabled={combinedSubmitting}>
                <XCircle className="h-5 w-5 text-muted-foreground" />
              </Button>
            </>
          ) : (
            !todo.completed && (
              <Button variant="ghost" size="icon" onClick={startEdit} aria-label="Edit to-do" disabled={combinedSubmitting}>
                <Edit2 className="h-5 w-5 text-blue-600" />
              </Button>
            )
          )}
          <Button variant="ghost" size="icon" onClick={handleDeleteWithAnimation} aria-label="Delete to-do" disabled={combinedSubmitting}>
            <Trash2 className="h-5 w-5 text-destructive" />
          </Button>
        </div>
      </div>
      {/* Image Capture/Display Area */}
      <div className="flex flex-col sm:flex-row gap-4 pl-8">
        {(['before', 'after'] as CaptureMode[]).map((mode) => {
          const imageUri = mode === 'before' ? todo.beforeImageDataUri : todo.afterImageDataUri;
          return (
            <div key={mode} className="flex-1 space-y-2">
              <p className="text-sm font-medium text-muted-foreground capitalize">{mode} Image</p>
              {imageUri ? (
                <div className="relative group">
                  <Image src={imageUri} alt={`${mode} image for ${todo.description}`} width={160} height={120} className="rounded-md border object-cover w-full aspect-[4/3]" data-ai-hint={`${mode} state`}/>
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                    <Button variant="outline" size="sm" onClick={() => onOpenImageCapture(todo, mode)} className="mr-1" disabled={combinedSubmitting}>
                      <RefreshCw className="h-4 w-4 mr-1" /> Retake
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => onRemoveImage(todo.id, mode)} disabled={combinedSubmitting}>
                      <Trash2 className="h-4 w-4 mr-1" /> Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={() => onOpenImageCapture(todo, mode)} className="w-full" disabled={combinedSubmitting}>
                  <Camera className="h-4 w-4 mr-2" /> Add {mode} Image
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </li>
  );
}

    