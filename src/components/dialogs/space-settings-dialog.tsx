
"use client";

import { useState, useEffect, type FormEvent, useCallback } from 'react';
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
import { Loader2, Trash2, AlertTriangle as AlertTriangleIcon } from 'lucide-react'; // Renamed AlertTriangle to avoid conflict
import type { Space } from '@/domain/entities/space.entity';
import type { UpdateSpaceInputDTO } from '@/application/use-cases/space/update-space.usecase';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription as AlertDialogDesc, 
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
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (space && isOpen) {
      setName(space.name);
      setDescription(space.description || '');
      setGoal(space.goal || '');
      setTags(space.tags.join(', '));
      setError(null);
      setDeleteError(null);
    }
  }, [space, isOpen]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    if (!name.trim()) {
      setError("Space name cannot be empty.");
      setIsSaving(false);
      return;
    }

    const updateData: UpdateSpaceInputDTO = {
      id: space.id,
      name: name.trim(),
      description: description.trim() || null, 
      goal: goal.trim() || null, 
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
    };

    try {
      await onSave(updateData);
      // Parent component (SpaceDashboardPage) handles success feedback (toast & refresh)
      // Parent component is also responsible for closing the dialog via the `onClose` prop if successful.
    } catch (err) {
      console.error("Error saving space settings from dialog:", err);
      setError(err instanceof Error ? err.message : "Could not save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await onDelete();
      // Parent handles toast and navigation, which should unmount this dialog.
    } catch (err) {
      console.error("Error deleting space from dialog:", err);
      setDeleteError(err instanceof Error ? err.message : "Could not delete space.");
      // Keep AlertDialog open to show error
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleDialogClose = useCallback(() => {
    if (isSaving || isDeleting) return;
    onClose();
  }, [isSaving, isDeleting, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl">Space Settings: {space?.name}</DialogTitle>
          <DialogDescription className="text-md">
            Edit the details of your space or delete it.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangleIcon className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
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
                  <AlertDialogTitle className="flex items-center text-xl"><AlertTriangleIcon className="h-6 w-6 mr-2 text-destructive"/>Confirm Deletion</AlertDialogTitle>
                  <AlertDialogDesc className="text-md">
                    Are you absolutely sure you want to delete the space "{space?.name}"? 
                    This will permanently remove the space and all its associated actions, to-dos, problems, and activity logs. This action cannot be undone.
                  </AlertDialogDesc>
                </AlertDialogHeader>
                {deleteError && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertTriangleIcon className="h-4 w-4" />
                    <AlertDescription>{deleteError}</AlertDescription>
                  </Alert>
                )}
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
