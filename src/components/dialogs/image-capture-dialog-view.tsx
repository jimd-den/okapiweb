
// src/components/dialogs/image-capture-dialog-view.tsx
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CheckCircle } from 'lucide-react';

interface ImageCaptureDialogViewProps {
  isOpen: boolean;
  onClose: () => void;
  dialogTitle: string;
  itemDescription?: string;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  videoDevices: MediaDeviceInfo[];
  selectedDeviceId: string | null;
  onDeviceChange: (deviceId: string) => void;
  hasCameraPermission: boolean | null;
  isCheckingPermission: boolean;
  stream: MediaStream | null;
  onCaptureAndSave: () => Promise<void>;
  isCapturingImage: boolean;
}

export function ImageCaptureDialogView({
  isOpen,
  onClose,
  dialogTitle,
  itemDescription,
  videoRef,
  canvasRef,
  videoDevices,
  selectedDeviceId,
  onDeviceChange,
  hasCameraPermission,
  isCheckingPermission,
  stream,
  onCaptureAndSave,
  isCapturingImage,
}: ImageCaptureDialogViewProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl">{dialogTitle}</DialogTitle>
          {itemDescription && (
            <DialogDescription>
              For: {itemDescription}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="px-6 py-4 space-y-4">
          {isCheckingPermission && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin mr-2" /> Checking camera permission...
            </div>
          )}
          {hasCameraPermission === false && !isCheckingPermission && (
            <Alert variant="destructive">
              <AlertTitle>Camera Access Required</AlertTitle>
              <AlertDescription>
                Please allow camera access in your browser settings and refresh.
              </AlertDescription>
            </Alert>
          )}
          {hasCameraPermission && videoDevices.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="camera-select-view">Select Camera:</Label>
              <Select value={selectedDeviceId || ''} onValueChange={onDeviceChange}>
                <SelectTrigger id="camera-select-view">
                  <SelectValue placeholder="Select a camera" />
                </SelectTrigger>
                <SelectContent>
                  {videoDevices.map(device => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${videoDevices.indexOf(device) + 1}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <div className="relative aspect-video bg-muted overflow-hidden mx-6">
          <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
          {!stream && hasCameraPermission === true && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          )}
        </div>
        <canvas ref={canvasRef} className="hidden" />
        <DialogFooter className="p-6 pt-4">
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={onClose} disabled={isCapturingImage}>Cancel</Button>
          </DialogClose>
          <Button
            onClick={onCaptureAndSave}
            disabled={!stream || isCapturingImage || !hasCameraPermission}
          >
            {isCapturingImage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
            Capture & Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
