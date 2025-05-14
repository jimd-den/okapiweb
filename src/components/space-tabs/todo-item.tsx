// src/components/space-tabs/todo-item.tsx
"use client";

import type { ChangeEvent } from 'react';
import { useState } from 'react';
import type { Todo } from '@/domain/entities/todo.entity';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Edit2, Save, XCircle, Loader2, Camera, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

type CaptureMode = 'before' | 'after';

interface TodoItemProps {
  todo: Todo;
  onToggleComplete: (todo: Todo) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpdateDescription: (id: string, newDescription: string) => Promise<void>;
  onOpenImageCapture: (todo: Todo, mode: CaptureMode) => void;
  onRemoveImage: (todoId: string, mode: CaptureMode) => Promise<void>;
  isSubmitting: boolean; // To disable actions during parent operations
}

export function TodoItem({
  todo,
  onToggleComplete,
  onDelete,
  onUpdateDescription,
  onOpenImageCapture,
  onRemoveImage,
  isSubmitting,
}: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingDescription, setEditingDescription] = useState(todo.description);
  const [isItemSubmitting, setIsItemSubmitting] = useState(false); // For item-specific actions
  const { toast } = useToast();

  const handleEdit = () => {
    setEditingDescription(todo.description);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!editingDescription.trim()) {
      toast({ title: "Description cannot be empty.", variant: "destructive" });
      return;
    }
    setIsItemSubmitting(true);
    try {
      await onUpdateDescription(todo.id, editingDescription);
      setIsEditing(false);
    } finally {
      setIsItemSubmitting(false);
    }
  };
  
  const combinedSubmitting = isSubmitting || isItemSubmitting;

  return (
    <li className={`p-4 rounded-md flex flex-col gap-3 transition-colors ${todo.completed ? 'bg-muted/50 hover:bg-muted/70' : 'bg-card hover:bg-muted/30'} border`}>
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
            value={editingDescription}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setEditingDescription(e.target.value)}
            className="text-md p-1.5 flex-grow"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && !combinedSubmitting && handleSaveEdit()}
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
              <Button variant="ghost" size="icon" onClick={handleSaveEdit} aria-label="Save edit" disabled={combinedSubmitting}>
                {isItemSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-5 w-5 text-green-600" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={handleCancelEdit} aria-label="Cancel edit" disabled={combinedSubmitting}>
                <XCircle className="h-5 w-5 text-muted-foreground" />
              </Button>
            </>
          ) : (
            !todo.completed && (
              <Button variant="ghost" size="icon" onClick={handleEdit} aria-label="Edit to-do" disabled={combinedSubmitting}>
                <Edit2 className="h-5 w-5 text-blue-600" />
              </Button>
            )
          )}
          <Button variant="ghost" size="icon" onClick={() => onDelete(todo.id)} aria-label="Delete to-do" disabled={combinedSubmitting}>
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
