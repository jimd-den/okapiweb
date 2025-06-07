
// src/components/dialogs/space-settings-dialog.tsx
"use client";

import { useEffect, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Trash2, AlertTriangle as AlertTriangleIcon } from 'lucide-react';
import type { Space } from '@/domain/entities';
import type { UpdateSpaceInputDTO } from '@/application/use-cases';
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
      setDeleteError(null); 
      form.clearErrors(); 
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
    } catch (err: any) {
      console.error("Error deleting space from dialog:", err);
      setDeleteError(err.message || "Could not delete space.");
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleDialogClose = useCallback(() => {
    if (isSubmitting || isDeleting) return;
    onClose();
  }, [isSubmitting, isDeleting, onClose]);

  if (!isOpen) return null; 

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDialogClose()}>
      <DialogContent className="sm:max-w-lg p-6"> {/* Increased padding */}
        <DialogHeader className="pb-3"> {/* Increased padding */}
          <DialogTitle className="text-xl">Space Settings: {form.getValues("name") || space?.name}</DialogTitle> {/* Increased font size */}
          <DialogDescription className="text-sm"> {/* Increased font size */}
            Edit the details of your space or delete it.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 py-3"> {/* Increased space-y and py */}
            {formErrors.root && (
                <Alert variant="destructive" className="p-3 text-sm"> {/* Increased padding and font size */}
                    <AlertTriangleIcon className="h-5 w-5" /> {/* Increased icon size */}
                    <AlertDescription>{formErrors.root.message}</AlertDescription>
                </Alert>
            )}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Name</FormLabel> {/* Increased font size */}
                  <FormControl>
                    <Input {...field} className="text-base p-3 h-12" disabled={isSubmitting || isDeleting} /> {/* Increased class values */}
                  </FormControl>
                  <FormMessage className="text-sm" /> {/* Increased font size */}
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Description (Optional)</FormLabel> {/* Increased font size */}
                  <FormControl>
                    <Textarea {...field} placeholder="A brief overview of this space's purpose" className="text-base p-3 min-h-[100px]" disabled={isSubmitting || isDeleting}/> {/* Increased class values */}
                  </FormControl>
                  <FormMessage className="text-sm" /> {/* Increased font size */}
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="goal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Current Goal (Optional)</FormLabel> {/* Increased font size */}
                  <FormControl>
                    <Input {...field} placeholder="e.g., Finalize Q3 report" className="text-base p-3 h-12" disabled={isSubmitting || isDeleting}/> {/* Increased class values */}
                  </FormControl>
                  <FormMessage className="text-sm" /> {/* Increased font size */}
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Tags (comma-separated)</FormLabel> {/* Increased font size */}
                  <FormControl>
                    <Input {...field} placeholder="e.g., work, project-x" className="text-base p-3 h-12" disabled={isSubmitting || isDeleting}/> {/* Increased class values */}
                  </FormControl>
                  <FormMessage className="text-sm" /> {/* Increased font size */}
                </FormItem>
              )}
            />
            <DialogFooter className="mt-6 sm:justify-between flex flex-col-reverse sm:flex-row gap-3"> {/* Increased mt and gap */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" size="lg" className="w-full sm:w-auto" disabled={isSubmitting || isDeleting}> {/* size="lg" */}
                    {isDeleting ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <Trash2 className="mr-2 h-5 w-5" />}
                    Delete Space
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="p-5"> {/* Increased padding */}
                  <AlertDialogHeader className="pb-3"> {/* Increased padding */}
                    <AlertDialogTitle className="flex items-center text-lg"><AlertTriangleIcon className="h-6 w-6 mr-2 text-destructive"/>Confirm Deletion</AlertDialogTitle> {/* Increased font/icon size */}
                    <AlertDialogDesc className="text-sm"> {/* Increased font size */}
                      Are you sure you want to delete "{form.getValues("name") || space?.name}"? 
                      This will permanently remove the space and all its associated data. This action cannot be undone.
                    </AlertDialogDesc>
                  </AlertDialogHeader>
                  {deleteError && (
                    <Alert variant="destructive" className="mt-2 p-3 text-sm"> {/* Increased mt, padding, font size */}
                      <AlertTriangleIcon className="h-5 w-5" /> {/* Increased icon size */}
                      <AlertDescription>{deleteError}</AlertDescription>
                    </Alert>
                  )}
                  <AlertDialogFooter className="pt-3"> {/* Increased padding */}
                    <AlertDialogCancel size="lg" disabled={isDeleting}>Cancel</AlertDialogCancel> {/* size="lg" */}
                    <AlertDialogAction 
                      onClick={handleDeleteConfirm} 
                      className="bg-destructive hover:bg-destructive/90 text-destructive-foreground" 
                      size="lg" // size="lg"
                      disabled={isDeleting}
                    >
                      {isDeleting ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : null}
                      Yes, Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <div className="flex gap-3 justify-end"> {/* Increased gap */}
                <Button type="button" variant="outline" size="lg" onClick={handleDialogClose} disabled={isSubmitting || isDeleting}>Cancel</Button> {/* size="lg" */}
                <Button type="submit" size="lg" disabled={isSubmitting || isDeleting}> {/* size="lg" */}
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
