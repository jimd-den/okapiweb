// src/components/dialogs/create-space-dialog.tsx
"use client";

import { useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Space } from '@/domain/entities/space.entity';
import type { CreateSpaceInputDTO } from '@/application/use-cases/space/create-space.usecase';
import { PlusCircle, Loader2, AlertTriangle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage
} from '@/components/ui/form';
import { useDialogState } from '@/hooks/use-dialog-state';


const spaceFormSchema = z.object({
  name: z.string().min(1, { message: "Space name is required." }).max(100, { message: "Space name must be 100 characters or less." }),
  description: z.string().max(500, { message: "Description must be 500 characters or less." }).optional().or(z.literal('')),
  tags: z.string().optional().or(z.literal('')),
  goal: z.string().max(200, { message: "Goal must be 200 characters or less." }).optional().or(z.literal('')),
});

type SpaceFormValues = z.infer<typeof spaceFormSchema>;

interface CreateSpaceDialogProps {
  onSpaceCreated: (newSpace: Space) => void;
  createSpace: (data: CreateSpaceInputDTO) => Promise<Space>; 
}

export function CreateSpaceDialog({ onSpaceCreated, createSpace }: CreateSpaceDialogProps) {
  const { isOpen, openDialog, closeDialog } = useDialogState();
  
  const form = useForm<SpaceFormValues>({
    resolver: zodResolver(spaceFormSchema),
    defaultValues: {
      name: '',
      description: '',
      tags: '',
      goal: '',
    },
  });

  const {formState: { isSubmitting, errors }} = form;


  const resetAndClose = useCallback(() => {
    form.reset();
    closeDialog();
  }, [form, closeDialog]);

  useEffect(() => {
    if (isOpen) {
      form.reset(); // Reset form when dialog opens
    }
  }, [isOpen, form]);

  const onSubmit = async (values: SpaceFormValues) => {
    const spaceInput: CreateSpaceInputDTO = {
      name: values.name.trim(),
      description: values.description?.trim() || undefined,
      tags: values.tags ? values.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
      goal: values.goal?.trim() || undefined,
    };

    try {
      const createdSpace = await createSpace(spaceInput);
      onSpaceCreated(createdSpace);
      resetAndClose();
    } catch (err: any) {
      console.error("Failed to create space:", err);
      form.setError("root", { type: "manual", message: err.message || "Could not save the new space. Please try again." });
    }
  };
  
  const handleDialogTriggerClick = useCallback(() => {
    form.reset(); // Ensure form is reset when triggered
    openDialog();
  }, [form, openDialog]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => open ? handleDialogTriggerClick() : resetAndClose()}>
      <DialogTrigger asChild>
        <Button size="lg" className="text-lg px-6 py-4" onClick={handleDialogTriggerClick}>
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            {errors.root && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{errors.root.message}</AlertDescription>
              </Alert>
            )}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-md">Space Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Morning Routine, Project Alpha" className="text-md p-3" disabled={isSubmitting} />
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
                    <Textarea {...field} placeholder="A brief overview of this space's purpose." className="text-md p-3 min-h-[100px]" disabled={isSubmitting} />
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
                  <FormLabel className="text-md">Tags (Optional, comma-separated)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., work, personal, urgent" className="text-md p-3" disabled={isSubmitting} />
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
                    <Input {...field} placeholder="e.g., Finish report by Friday" className="text-md p-3" disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="mt-2">
                <Button type="button" variant="outline" size="lg" className="text-md" onClick={resetAndClose} disabled={isSubmitting}>
                  Cancel
                </Button>
              <Button type="submit" size="lg" className="text-md" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                {isSubmitting ? "Creating..." : "Create Space"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
