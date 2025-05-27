
// src/components/dialogs/create-todo-dialog.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Loader2, PlusCircle, Camera, AlertTriangle } from 'lucide-react';
import type { Todo } from '@/domain/entities/todo.entity';
import type { CreateTodoInputDTO, CreateTodoUseCase } from '@/application/use-cases/todo/create-todo.usecase';
import { useImageCaptureDialog, type UseImageCaptureDialogReturn } from '@/hooks/use-image-capture-dialog';
import { ImageCaptureDialogView } from '@/components/dialogs/image-capture-dialog-view';
import NextImage from 'next/image';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage
} from '@/components/ui/form';

const todoFormSchema = z.object({
  description: z.string().min(1, { message: "Description is required." }).max(300, { message: "Description must be 300 characters or less." }),
});

type TodoFormValues = z.infer<typeof todoFormSchema>;

interface CreateTodoDialogProps {
  spaceId: string;
  isOpen: boolean;
  onClose: () => void;
  createTodoUseCase: CreateTodoUseCase;
  onTodoCreated: (newTodo: Todo) => void;
}

type CaptureMode = 'before'; 

export function CreateTodoDialog({
  spaceId,
  isOpen,
  onClose,
  createTodoUseCase,
  onTodoCreated,
}: CreateTodoDialogProps) {
  const [beforeImageDataUri, setBeforeImageDataUri] = useState<string | undefined>(undefined);
  const [imageCaptureError, setImageCaptureError] = useState<string | null>(null);

  const imageCapture: UseImageCaptureDialogReturn<null, CaptureMode> = useImageCaptureDialog<null, CaptureMode>();

  const form = useForm<TodoFormValues>({
    resolver: zodResolver(todoFormSchema),
    defaultValues: {
      description: '',
    },
  });
  const { formState: { isSubmitting, errors } } = form;

  const resetDialogState = useCallback(() => {
    form.reset();
    setBeforeImageDataUri(undefined);
    setImageCaptureError(null);
    form.clearErrors();
  }, [form]);

  useEffect(() => {
    if (isOpen) {
      resetDialogState();
    }
  }, [isOpen, resetDialogState]);

  const handleOpenImageCapture = useCallback(async () => {
    setImageCaptureError(null);
    try {
      await imageCapture.handleOpenImageCaptureDialog(null, 'before');
    } catch (e: any) {
      setImageCaptureError(e.message || "Failed to initialize camera.");
    }
  }, [imageCapture]);

  const handleCaptureAndSetImage = useCallback(async () => {
    if (!imageCapture.videoRef.current || !imageCapture.canvasRef.current) return;
    setImageCaptureError(null);
    imageCapture.setIsCapturingImage(true);

    const video = imageCapture.videoRef.current;
    const canvas = imageCapture.canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
      setImageCaptureError("Could not get canvas context.");
      imageCapture.setIsCapturingImage(false);
      return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageDataUri = canvas.toDataURL('image/jpeg', 0.8);
    setBeforeImageDataUri(imageDataUri);
    imageCapture.setIsCapturingImage(false);
    imageCapture.handleCloseImageCaptureDialog();
  }, [imageCapture]);

  const onSubmit = async (values: TodoFormValues) => {
    try {
      const newTodoData: CreateTodoInputDTO = {
        spaceId,
        description: values.description.trim(),
        beforeImageDataUri: beforeImageDataUri,
      };
      const newTodo = await createTodoUseCase.execute(newTodoData);
      onTodoCreated(newTodo); 
    } catch (err: any) {
      form.setError("root", { type: "manual", message: err.message || "Could not save the new to-do." });
    }
  };

  const handleDialogClose = useCallback(() => {
    if (isSubmitting) return;
    resetDialogState();
    onClose();
  }, [isSubmitting, onClose, resetDialogState]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleDialogClose()}>
        <DialogContent className="sm:max-w-sm p-4">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-lg">Add New To-Do</DialogTitle>
            <DialogDescription className="text-xs">Enter the details for your new task.</DialogDescription>
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
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Description</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="What needs to be done?"
                        className="text-sm p-2 h-9 mt-0.5"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <div>
                <Label className="text-sm">Before Image (Optional)</Label>
                {imageCaptureError && (
                  <Alert variant="destructive" className="mt-0.5 p-2 text-xs">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <AlertDescription>{imageCaptureError}</AlertDescription>
                  </Alert>
                )}
                {beforeImageDataUri ? (
                  <div className="mt-1 space-y-1.5">
                    <NextImage src={beforeImageDataUri} alt="Before image preview" width={120} height={90} className="rounded border object-cover" data-ai-hint="task setup" />
                    <Button type="button" variant="outline" size="sm" onClick={handleOpenImageCapture} disabled={isSubmitting} className="text-xs h-8">
                      <Camera className="mr-1.5 h-3.5 w-3.5" /> Retake Image
                    </Button>
                  </div>
                ) : (
                  <Button type="button" variant="outline" className="w-full mt-0.5 text-sm h-9" onClick={handleOpenImageCapture} disabled={isSubmitting}>
                    <Camera className="mr-1.5 h-4 w-4" /> Add Image
                  </Button>
                )}
              </div>
              <DialogFooter className="mt-4">
                <Button type="button" variant="outline" size="sm" onClick={handleDialogClose} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-1.5 h-4 w-4" />}
                  Add To-Do
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ImageCaptureDialogView
        isOpen={imageCapture.showCameraDialog}
        onClose={imageCapture.handleCloseImageCaptureDialog}
        dialogTitle="Capture 'Before' Image"
        itemDescription={form.getValues("description")}
        videoRef={imageCapture.videoRef}
        canvasRef={imageCapture.canvasRef}
        videoDevices={imageCapture.videoDevices}
        selectedDeviceId={imageCapture.selectedDeviceId}
        onDeviceChange={imageCapture.handleDeviceChange}
        hasCameraPermission={imageCapture.hasCameraPermission}
        isCheckingPermission={imageCapture.isCheckingPermission}
        stream={imageCapture.stream}
        onCaptureAndSave={handleCaptureAndSetImage}
        isCapturingImage={imageCapture.isCapturingImage}
      />
    </>
  );
}

