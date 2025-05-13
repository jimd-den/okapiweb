
"use client";

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import type { Space } from '@/domain/entities/space.entity';
import type { CreateSpaceInputDTO } from '@/application/use-cases/space/create-space.usecase';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle } from 'lucide-react';

interface CreateSpaceDialogProps {
  onSpaceCreated: (newSpace: Space) => void;
  createSpace: (data: CreateSpaceInputDTO) => Promise<Space>; // Changed prop
}

export function CreateSpaceDialog({ onSpaceCreated, createSpace }: CreateSpaceDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [goal, setGoal] = useState('');
  const [sequentialSteps, setSequentialSteps] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    if (!name.trim()) {
      toast({ title: "Validation Error", description: "Space name is required.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const spaceInput: CreateSpaceInputDTO = {
      name: name.trim(),
      description: description.trim() || undefined,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      goal: goal.trim() || undefined,
      sequentialSteps: sequentialSteps,
    };

    try {
      // Use the injected createSpace function (which is the use case's execute method)
      const createdSpace = await createSpace(spaceInput);
      onSpaceCreated(createdSpace);
      toast({
        title: "Space Created!",
        description: `"${createdSpace.name}" is ready.`,
      });
      setIsOpen(false);
      // Reset form
      setName('');
      setDescription('');
      setTags('');
      setGoal('');
      setSequentialSteps(false);
    } catch (error) {
      console.error("Failed to create space:", error);
      toast({
        title: "Error Creating Space",
        description: "Could not save the new space. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
          <div className="space-y-2">
            <Label htmlFor="name" className="text-md">Space Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Morning Routine, Project Alpha"
              required
              className="text-md p-3"
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
            />
          </div>
          <div className="flex items-center space-x-3">
            <Switch
              id="sequentialSteps"
              checked={sequentialSteps}
              onCheckedChange={setSequentialSteps}
            />
            <Label htmlFor="sequentialSteps" className="text-md">Actions are sequential?</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} size="lg" className="text-md" disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" size="lg" className="text-md" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Space"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
