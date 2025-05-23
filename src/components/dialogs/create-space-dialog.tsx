
"use client";

import { useState, type FormEvent, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Space } from '@/domain/entities/space.entity';
import type { CreateSpaceInputDTO } from '@/application/use-cases/space/create-space.usecase';
import { PlusCircle, Loader2, AlertTriangle } from 'lucide-react';

interface CreateSpaceDialogProps {
  onSpaceCreated: (newSpace: Space) => void;
  createSpace: (data: CreateSpaceInputDTO) => Promise<Space>; 
}

export function CreateSpaceDialog({ onSpaceCreated, createSpace }: CreateSpaceDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [goal, setGoal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setName('');
    setDescription('');
    setTags('');
    setGoal('');
    setError(null);
  }, []);

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!name.trim()) {
      setError("Space name is required.");
      setIsLoading(false);
      return;
    }

    const spaceInput: CreateSpaceInputDTO = {
      name: name.trim(),
      description: description.trim() || undefined,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      goal: goal.trim() || undefined,
    };

    try {
      const createdSpace = await createSpace(spaceInput);
      onSpaceCreated(createdSpace);
      // Success feedback can be implicit by dialog closing and list updating,
      // or a brief success message could be shown if preferred.
      setIsOpen(false); 
    } catch (err) {
      console.error("Failed to create space:", err);
      setError(err instanceof Error ? err.message : "Could not save the new space. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleOpenChange = useCallback((open: boolean) => {
    if (isLoading) return; // Don't allow closing while loading
    setIsOpen(open);
    if (!open) {
      resetForm();
    }
  }, [isLoading, resetForm]);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="lg" className="text-lg px-6 py-4">
          <PlusCircle className="mr-2 h-6 w-6" /> Create New Space
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px] p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create a New Workflow Space</DialogTitle>
          <DialogDescription className="text-md">
            Set up a new area for your tasks and projects. Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-md">Space Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Morning Routine, Project Alpha"
              required
              className="text-md p-3"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-md">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief overview of this space's purpose."
              className="text-md p-3 min-h-[100px]"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags" className="text-md">Tags (Optional, comma-separated)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., work, personal, urgent"
              className="text-md p-3"
              disabled={isLoading}
            />
          </div>
           <div className="space-y-2">
            <Label htmlFor="goal" className="text-md">Current Goal (Optional)</Label>
            <Input
              id="goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g., Finish report by Friday"
              className="text-md p-3"
              disabled={isLoading}
            />
          </div>
          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" size="lg" className="text-md" disabled={isLoading}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" size="lg" className="text-md" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
              {isLoading ? "Creating..." : "Create Space"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
