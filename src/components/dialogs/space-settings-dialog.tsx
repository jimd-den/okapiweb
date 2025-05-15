
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Space } from '@/domain/entities/space.entity';
import type { UpdateSpaceInputDTO } from '@/application/use-cases/space/update-space.usecase';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription as AlertDialogDesc, // Renamed to avoid conflict
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SpaceSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  space: Space;
  onSave: (data: UpdateSpaceInputDTO) => Promise<void>;
  onDelete: () => Promise<void>;
}

export function SpaceSettingsDialog({
  isOpen,
  onClose,
  space,
  onSave,
  onDelete,
}: SpaceSettingsDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState('');
  const [tags, setTags] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (space && isOpen) {
      setName(space.name);
      setDescription(space.description || '');
      setGoal(space.goal || '');
      setTags(space.tags.join(', '));
    }
  }, [space, isOpen]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);

    if (!name.trim()) {
      toast({ title: "Validation Error", description: "Space name cannot be empty.", variant: "destructive" });
      setIsSaving(false);
      return;
    }

    const updateData: UpdateSpaceInputDTO = {
      id: space.id,
      name: name.trim(),
      description: description.trim() || null, // Send null to clear
      goal: goal.trim() || null, // Send null to clear
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
    };

    try {
      await onSave(updateData);
      // Toast for success is handled in the parent component (SpaceDashboardPage)
      // onClose(); // Close dialog is handled by parent after successful save
    } catch (error) {
      // Toast for error is handled in the parent component
      console.error("Error saving space settings from dialog:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
      // Toast and navigation handled by parent
      // onClose(); // Dialog will be unmounted as page navigates away
    } catch (error) {
      // Toast handled by parent
      console.error("Error deleting space from dialog:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl">Space Settings: {space?.name}</DialogTitle>
          <DialogDescription className="text-md">
            Edit the details of your space or delete it.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="space-name" className="text-md">Name</Label>
            <Input
              id="space-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-md p-3"
              disabled={isSaving || isDeleting}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="space-description" className="text-md">Description (Optional)</Label>
            <Textarea
              id="space-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief overview of this space's purpose"
              className="text-md p-3 min-h-[80px]"
              disabled={isSaving || isDeleting}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="space-goal" className="text-md">Current Goal (Optional)</Label>
            <Input
              id="space-goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g., Finalize Q3 report"
              className="text-md p-3"
              disabled={isSaving || isDeleting}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="space-tags" className="text-md">Tags (comma-separated)</Label>
            <Input
              id="space-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., work, project-x, high-priority"
              className="text-md p-3"
              disabled={isSaving || isDeleting}
            />
          </div>
          <DialogFooter className="mt-8 sm:justify-between">
             <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" size="lg" className="text-md" disabled={isSaving || isDeleting}>
                  {isDeleting ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <Trash2 className="mr-2 h-5 w-5" />}
                  Delete Space
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center text-xl"><AlertTriangle className="h-6 w-6 mr-2 text-destructive"/>Confirm Deletion</AlertDialogTitle>
                  <AlertDialogDesc className="text-md">
                    Are you absolutely sure you want to delete the space "{space?.name}"? 
                    This will permanently remove the space and all its associated actions, to-dos, problems, and activity logs. This action cannot be undone.
                  </AlertDialogDesc>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="text-md" disabled={isDeleting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteConfirm} 
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground text-md" 
                    disabled={isDeleting}
                  >
                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                    Yes, Delete Space
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <div className="flex gap-2 justify-end">
              <DialogClose asChild>
                <Button type="button" variant="outline" size="lg" className="text-md" disabled={isSaving || isDeleting}>Cancel</Button>
              </DialogClose>
              <Button type="submit" size="lg" className="text-md" disabled={isSaving || isDeleting}>
                {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
