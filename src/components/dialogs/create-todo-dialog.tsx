
// src/components/dialogs/create-todo-dialog.tsx
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, PlusCircle, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Todo } from '@/domain/entities/todo.entity';
import type { CreateTodoInputDTO, CreateTodoUseCase } from '@/application/use-cases/todo/create-todo.usecase';
import { useImageCaptureDialog } from '@/hooks/use-image-capture-dialog';
import { ImageCaptureDialogView } from '@/components/dialogs/image-capture-dialog-view';
import NextImage from 'next/image';

interface CreateTodoDialogProps {
  spaceId: string;
  isOpen: boolean;
  onClose: () => void;
  createTodoUseCase: CreateTodoUseCase;
  onTodoCreated: (newTodo: Todo) => void;
}

type CaptureMode = 'before'; // Only 'before' for new todos

export function CreateTodoDialog({
  spaceId,
  isOpen,
  onClose,
  createTodoUseCase,
  onTodoCreated,
}: CreateTodoDialogProps) {
  const [description, setDescription] = useState('');
  const [beforeImageDataUri, setBeforeImageDataUri] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const imageCapture = useImageCaptureDialog<null, CaptureMode>(); // No item needed initially for new todo

  useEffect(() => {
    if (isOpen) {
      setDescription('');
      setBeforeImageDataUri(undefined);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleOpenImageCapture = () => {
    imageCapture.handleOpenImageCaptureDialog(null, 'before');
  };

  const handleCaptureAndSetImage = async () => {
    if (!imageCapture.videoRef.current || !imageCapture.canvasRef.current) return;
    imageCapture.setIsCapturingImage(true);

    const video = imageCapture.videoRef.current;
    const canvas = imageCapture.canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) {
      toast({ title: "Error", description: "Could not get canvas context.", variant: "destructive" });
      imageCapture.setIsCapturingImage(false);
      return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageDataUri = canvas.toDataURL('image/jpeg', 0.8);
    setBeforeImageDataUri(imageDataUri);
    imageCapture.setIsCapturingImage(false);
    imageCapture.handleCloseImageCaptureDialog(); // Close camera dialog after capture
    toast({ title: "Image Captured!", description: "'Before' image has been set.", duration: 2000 });
  };


  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!description.trim()) {
      toast({ title: "Description is required", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const newTodoData: CreateTodoInputDTO = {
        spaceId,
        description: description.trim(),
        beforeImageDataUri: beforeImageDataUri,
      };
      const newTodo = await createTodoUseCase.execute(newTodoData);
      onTodoCreated(newTodo);
      toast({ title: "To-Do Added!", description: `"${newTodo.description}" has been created.` });
      onClose(); // Close this dialog
    } catch (error: any) {
      toast({ title: "Error Adding To-Do", description: error.message || "Could not save the new to-do.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(openState) => !openState && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Add New To-Do</DialogTitle>
            <DialogDescription>Enter the details for your new task.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div>
              <Label htmlFor="todo-description" className="text-md">Description</Label>
              <Input
                id="todo-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What needs to be done?"
                className="text-md p-3 mt-1"
                disabled={isSubmitting}
                required
              />
            </div>
            <div>
              <Label className="text-md">Before Image (Optional)</Label>
              {beforeImageDataUri ? (
                <div className="mt-2 space-y-2">
                  <NextImage src={beforeImageDataUri} alt="Before image preview" width={160} height={120} className="rounded border object-cover" data-ai-hint="task setup"/>
                  <Button type="button" variant="outline" size="sm" onClick={handleOpenImageCapture} disabled={isSubmitting}>
                    <Camera className="mr-2 h-4 w-4" /> Retake Before Image
                  </Button>
                </div>
              ) : (
                <Button type="button" variant="outline" className="w-full mt-1 text-md" onClick={handleOpenImageCapture} disabled={isSubmitting}>
                  <Camera className="mr-2 h-5 w-5" /> Add Before Image
                </Button>
              )}
            </div>
            <DialogFooter className="mt-6">
              <DialogClose asChild>
                <Button type="button" variant="outline" size="lg" disabled={isSubmitting}>Cancel</Button>
              </DialogClose>
              <Button type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PlusCircle className="mr-2 h-5 w-5" />}
                Add To-Do
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ImageCaptureDialogView
        isOpen={imageCapture.showCameraDialog}
        onClose={imageCapture.handleCloseImageCaptureDialog}
        dialogTitle="Capture 'Before' Image"
        videoRef={imageCapture.videoRef}
        canvasRef={imageCapture.canvasRef}
        videoDevices={imageCapture.videoDevices}
        selectedDeviceId={imageCapture.selectedDeviceId}
        onDeviceChange={imageCapture.handleDeviceChange}
        hasCameraPermission={imageCapture.hasCameraPermission}
        isCheckingPermission={imageCapture.isCheckingPermission}
        stream={imageCapture.stream}
        onCaptureAndSave={handleCaptureAndSetImage} // Use specific handler for this dialog
        isCapturingImage={imageCapture.isCapturingImage}
      />
    </>
  );
}
