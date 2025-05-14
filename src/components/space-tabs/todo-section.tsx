// src/components/space-tabs/todo-section.tsx
"use client";

import type { ChangeEvent, FormEvent } from 'react';
import { useState, useEffect, useCallback } from 'react';
import type { Todo } from '@/domain/entities/todo.entity';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, PlusCircle, Edit2, Save, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { CreateTodoInputDTO } from '@/application/use-cases/todo/create-todo.usecase';
import type { UpdateTodoInputDTO } from '@/application/use-cases/todo/update-todo.usecase';

interface TodoSectionProps {
  spaceId: string;
  initialTodos: Todo[];
  createTodo: (data: CreateTodoInputDTO) => Promise<Todo>;
  updateTodo: (data: UpdateTodoInputDTO) => Promise<Todo>;
  deleteTodo: (id: string) => Promise<void>;
  onTodosFetched: (todos: Todo[]) => void; // Callback to update parent state after initial fetch
}

export function TodoSection({
  spaceId,
  initialTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  onTodosFetched
}: TodoSectionProps) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [newTodoDescription, setNewTodoDescription] = useState('');
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editingDescription, setEditingDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setTodos(initialTodos); // Sync with initialTodos prop if it changes
  }, [initialTodos]);

  const handleAddTodo = async (event: FormEvent) => {
    event.preventDefault();
    if (!newTodoDescription.trim()) {
      toast({ title: "Cannot add empty to-do.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const newTodo = await createTodo({ spaceId, description: newTodoDescription });
      setTodos(prev => [newTodo, ...prev]); // Add to top for visibility
      setNewTodoDescription('');
      toast({ title: "To-do Added", description: `"${newTodo.description}"` });
    } catch (error: any) {
      toast({ title: "Error Adding To-do", description: error.message || "Could not save to-do.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleComplete = async (todo: Todo) => {
    try {
      const updated = await updateTodo({ id: todo.id, completed: !todo.completed });
      setTodos(prev => prev.map(t => t.id === updated.id ? updated : t).sort((a, b) => {
        if (a.completed === b.completed) return new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime();
        return a.completed ? 1 : -1;
      }));
       toast({ title: "To-do Updated", description: `"${updated.description}" is now ${updated.completed ? 'complete' : 'incomplete'}.` });
    } catch (error: any) {
      toast({ title: "Error Updating To-do", description: error.message || "Could not update to-do.", variant: "destructive" });
    }
  };

  const handleDeleteTodo = async (id: string) => {
    try {
      await deleteTodo(id);
      setTodos(prev => prev.filter(t => t.id !== id));
      toast({ title: "To-do Deleted" });
    } catch (error: any) {
      toast({ title: "Error Deleting To-do", description: error.message || "Could not delete to-do.", variant: "destructive" });
    }
  };

  const startEdit = (todo: Todo) => {
    setEditingTodoId(todo.id);
    setEditingDescription(todo.description);
  };

  const cancelEdit = () => {
    setEditingTodoId(null);
    setEditingDescription('');
  };

  const handleSaveEdit = async (todoId: string) => {
    if (!editingDescription.trim()) {
      toast({ title: "Description cannot be empty.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const updated = await updateTodo({ id: todoId, description: editingDescription });
      setTodos(prev => prev.map(t => t.id === updated.id ? updated : t));
      cancelEdit();
      toast({ title: "To-do Updated", description: `Description changed for "${updated.description}".` });
    } catch (error: any) {
      toast({ title: "Error Updating To-do", description: error.message || "Could not save changes.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading to-dos...</p>
      </div>
    );
  }

  return (
    <Card className="mt-4 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl flex items-center justify-between">
          <span>To-Do List</span>
          <form onSubmit={handleAddTodo} className="flex gap-2">
            <Input
              type="text"
              value={newTodoDescription}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setNewTodoDescription(e.target.value)}
              placeholder="Add a new to-do..."
              className="text-md p-2 flex-grow"
              disabled={isSubmitting}
            />
            <Button type="submit" size="icon" aria-label="Add to-do" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-5 w-5" />}
            </Button>
          </form>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {todos.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No to-do items yet. Add one above!</p>
        ) : (
          <ul className="space-y-3">
            {todos.map(todo => (
              <li key={todo.id} className={`p-3 rounded-md flex items-center gap-3 transition-colors ${todo.completed ? 'bg-muted/50 hover:bg-muted/70' : 'bg-card hover:bg-muted/30'} border`}>
                <Checkbox
                  id={`todo-${todo.id}`}
                  checked={todo.completed}
                  onCheckedChange={() => handleToggleComplete(todo)}
                  className="h-5 w-5"
                  aria-label={todo.completed ? 'Mark as incomplete' : 'Mark as complete'}
                />
                {editingTodoId === todo.id ? (
                  <Input
                    type="text"
                    value={editingDescription}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setEditingDescription(e.target.value)}
                    className="text-md p-1.5 flex-grow"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(todo.id)}
                    disabled={isSubmitting}
                  />
                ) : (
                  <label htmlFor={`todo-${todo.id}`} className={`flex-grow cursor-pointer text-md ${todo.completed ? 'line-through text-muted-foreground' : ''}`}>
                    {todo.description}
                  </label>
                )}
                <div className="flex gap-1.5 ml-auto shrink-0">
                  {editingTodoId === todo.id ? (
                    <>
                      <Button variant="ghost" size="icon" onClick={() => handleSaveEdit(todo.id)} aria-label="Save edit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-5 w-5 text-green-600" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={cancelEdit} aria-label="Cancel edit" disabled={isSubmitting}>
                        <XCircle className="h-5 w-5 text-muted-foreground" />
                      </Button>
                    </>
                  ) : (
                     !todo.completed && (
                      <Button variant="ghost" size="icon" onClick={() => startEdit(todo)} aria-label="Edit to-do" disabled={isSubmitting}>
                        <Edit2 className="h-5 w-5 text-blue-600" />
                      </Button>
                     )
                  )}
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteTodo(todo.id)} aria-label="Delete to-do" disabled={isSubmitting}>
                    <Trash2 className="h-5 w-5 text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
