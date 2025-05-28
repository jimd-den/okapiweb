// src/components/dialogs/create-space-dialog.tsx
"use client";

import { useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Space } from '@/domain/entities/space.entity';
import type { CreateSpaceInputDTO } from '@/application/use-cases/space/create-space.usecase';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage
} from '@/components/ui/form';
import { format } from 'date-fns';


const spaceFormSchema = z.object({
  name: z.string().min(1, { message: "Space name is required." }).max(100, { message: "Space name must be 100 characters or less." }),
  description: z.string().max(500, { message: "Description must be 500 characters or less." }).optional().or(z.literal('')),
  tags: z.string().optional().or(z.literal('')),
  goal: z.string().max(200, { message: "Goal must be 200 characters or less." }).optional().or(z.literal('')),
});

type SpaceFormValues = z.infer<typeof spaceFormSchema>;

interface CreateSpaceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSpaceCreated: (newSpace: Space) => void;
  createSpace: (data: Omit<CreateSpaceInputDTO, 'date'>) => Promise<Space>; // Expecting date to be handled by HomePage
  selectedDate?: Date;
}

export function CreateSpaceDialog({ isOpen, onClose, onSpaceCreated, createSpace, selectedDate }: CreateSpaceDialogProps) {

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
    onClose();
  }, [form, onClose]);

  useEffect(() => {
    if (isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  const onSubmit = async (values: SpaceFormValues) => {
    if (!selectedDate) {
      form.setError("root", { type: "manual", message: "No date selected. Please select a date on the calendar." });
      return;
    }

    const spaceInput: Omit<CreateSpaceInputDTO, 'date'> = { // Date will be added by the caller (HomePage)
      name: values.name.trim(),
      description: values.description?.trim() || undefined,
      tags: values.tags ? values.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
      goal: values.goal?.trim() || undefined,
    };

    try {
      const createdSpace = await createSpace(spaceInput); // createSpace (from HomePage) adds the date
      onSpaceCreated(createdSpace);
      resetAndClose();
    } catch (err: any) {
      console.error("Failed to create space:", err);
      form.setError("root", { type: "manual", message: err.message || "Could not save the new space. Please try again." });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && resetAndClose()}>
      <DialogContent className="sm:max-w-md p-4">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg">Create New Space for {selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'Selected Date'}</DialogTitle>
          <DialogDescription className="text-xs">
            Set up a new area for your tasks and projects for the selected day.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 py-2">
            {errors.root && (
              <Alert variant="destructive" className="p-2 text-xs">
                <AlertTriangle className="h-3.5 w-3.5" />
                <AlertDescription>{errors.root.message}</AlertDescription>
              </Alert>
            )}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Space Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Morning Focus Block" className="text-sm p-2 h-9" disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage className="text-xs"/>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="A brief overview..." className="text-sm p-2 min-h-[70px]" disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage className="text-xs"/>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Tags (Optional, comma-separated)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., work, deep-work" className="text-sm p-2 h-9" disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage className="text-xs"/>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="goal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Goal for this Space (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Complete report draft" className="text-sm p-2 h-9" disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage className="text-xs"/>
                </FormItem>
              )}
            />
            <DialogFooter className="mt-4">
                <Button type="button" variant="outline" size="sm" onClick={resetAndClose} disabled={isSubmitting}>
                  Cancel
                </Button>
              <Button type="submit" size="sm" disabled={isSubmitting || !selectedDate}>
                {isSubmitting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                {isSubmitting ? "Creating..." : "Create Space"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
