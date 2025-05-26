
// src/components/dialogs/space-settings-dialog.tsx
"use client";

import { useEffect, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
// Label from form is used instead
// import { Label } from '@/components/ui/label'; 
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Trash2, AlertTriangle as AlertTriangleIcon } from 'lucide-react';
import type { Space } from '@/domain/entities/space.entity';
import type { UpdateSpaceInputDTO } from '@/application/use-cases/space/update-space.usecase';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription as AlertDialogDesc, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage
} from '@/components/ui/form';

const spaceSettingsFormSchema = z.object({
  name: z.string().min(1, { message: "Space name is required." }).max(100, { message: "Space name must be 100 characters or less." }),
  description: z.string().max(500, { message: "Description must be 500 characters or less." }).optional().or(z.literal('')),
  goal: z.string().max(200, { message: "Goal must be 200 characters or less." }).optional().or(z.literal('')),
  tags: z.string().optional().or(z.literal('')),
});

type SpaceSettingsFormValues = z.infer<typeof spaceSettingsFormSchema>;

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
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const form = useForm<SpaceSettingsFormValues>({
    resolver: zodResolver(spaceSettingsFormSchema),
    defaultValues: {
      name: space?.name || '',
      description: space?.description || '',
      goal: space?.goal || '',
      tags: space?.tags?.join(', ') || '',
    },
  });
  
  const {formState: { isSubmitting, errors: formErrors }} = form;

  useEffect(() => {
    if (space && isOpen) {
      form.reset({
        name: space.name,
        description: space.description || '',
        goal: space.goal || '',
        tags: space.tags.join(', '),
      });
      setDeleteError(null); // Reset delete error when dialog opens/space changes
      form.clearErrors(); // Clear previous form errors
    }
  }, [space, isOpen, form]);

  const onSubmit = async (values: SpaceSettingsFormValues) => {
    const updateData: UpdateSpaceInputDTO = {
      id: space.id,
      name: values.name.trim(),
      description: values.description?.trim() || null,
      goal: values.goal?.trim() || null,
      tags: values.tags ? values.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
    };

    try {
      await onSave(updateData);
      // Parent (SpaceDashboardPage) calls onClose after successful save.
    } catch (err: any) {
      console.error("Error saving space settings from dialog:", err);
      form.setError("root", { type: "manual", message: err.message || "Could not save settings."});
    }
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await onDelete();
      // Parent handles navigation/closing, so no explicit onClose needed here
    } catch (err: any) {
      console.error("Error deleting space from dialog:", err);
      setDeleteError(err.message || "Could not delete space.");
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleDialogClose = useCallback(() => {
    if (isSubmitting || isDeleting) return;
    // form.reset(); // Reset by useEffect when isOpen changes
    onClose();
  }, [isSubmitting, isDeleting, onClose]);

  if (!isOpen) return null; // Don't render if not open, to ensure form defaultValues are set correctly on open

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDialogClose()}>
      <DialogContent className="sm:max-w-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl">Space Settings: {form.getValues("name") || space?.name}</DialogTitle>
          <DialogDescription className="text-md">
            Edit the details of your space or delete it.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            {formErrors.root && (
                <Alert variant="destructive">
                    <AlertTriangleIcon className="h-4 w-4" />
                    <AlertDescription>{formErrors.root.message}</AlertDescription>
                </Alert>
            )}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-md">Name</FormLabel>
                  <FormControl>
                    <Input {...field} className="text-md p-3" disabled={isSubmitting || isDeleting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-md">Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="A brief overview of this space's purpose" className="text-md p-3 min-h-[80px]" disabled={isSubmitting || isDeleting}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="goal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-md">Current Goal (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Finalize Q3 report" className="text-md p-3" disabled={isSubmitting || isDeleting}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-md">Tags (comma-separated)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., work, project-x, high-priority" className="text-md p-3" disabled={isSubmitting || isDeleting}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="mt-8 sm:justify-between">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" size="lg" className="text-md" disabled={isSubmitting || isDeleting}>
                    {isDeleting ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <Trash2 className="mr-2 h-5 w-5" />}
                    Delete Space
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center text-xl"><AlertTriangleIcon className="h-6 w-6 mr-2 text-destructive"/>Confirm Deletion</AlertDialogTitle>
                    <AlertDialogDesc className="text-md">
                      Are you absolutely sure you want to delete the space "{form.getValues("name") || space?.name}"? 
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
                <Button type="button" variant="outline" size="lg" className="text-md" onClick={handleDialogClose} disabled={isSubmitting || isDeleting}>Cancel</Button>
                <Button type="submit" size="lg" className="text-md" disabled={isSubmitting || isDeleting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
