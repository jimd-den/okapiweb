
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, buttonVariants } from '@/components/ui/button'; // Import buttonVariants
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, VideoOff, AlertTriangle } from 'lucide-react';
import { BrowserMultiFormatReader, NotFoundException, ChecksumException, FormatException } from '@zxing/library';
import { cn } from '@/lib/utils'; // Import cn

interface BarcodeScannerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (scannedValue: string) => void;
  fieldLabel?: string;
}

export function BarcodeScannerDialog({
  isOpen,
  onClose,
  onScanSuccess,
  fieldLabel,
}: BarcodeScannerDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);

  const stopMediaTracks = useCallback((stream: MediaStream | null) => {
    stream?.getTracks().forEach(track => {
      track.stop();
    });
  }, []);

  const cleanupScanner = useCallback(() => {
    try {
      codeReader.current?.reset();
    } catch (e) {
      // console.warn("Error resetting codeReader:", e);
    }
    if (videoRef.current && videoRef.current.srcObject) {
      stopMediaTracks(videoRef.current.srcObject as MediaStream);
      videoRef.current.srcObject = null;
    }
  }, [stopMediaTracks]);


  useEffect(() => {
    if (isOpen) {
      codeReader.current = new BrowserMultiFormatReader();
      setIsLoading(true);
      setError(null);
      setHasPermission(null);

      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          stopMediaTracks(stream); 
          setHasPermission(true);
          return navigator.mediaDevices.enumerateDevices();
        })
        .then(devices => {
          const videoInputDevices = devices.filter(device => device.kind === 'videoinput');
          setVideoDevices(videoInputDevices);
          if (videoInputDevices.length > 0) {
            const defaultDeviceId = videoInputDevices[0].deviceId;
            setSelectedDeviceId(s => s ?? defaultDeviceId); 
          } else {
            setError("No video input devices found.");
            setIsLoading(false);
          }
        })
        .catch(err => {
          console.error("Camera permission error:", err);
          setError("Camera permission denied. Please enable camera access in your browser settings.");
          setHasPermission(false);
          setIsLoading(false);
        });
    } else {
      cleanupScanner();
    }
    return () => {
      cleanupScanner();
    };
  }, [isOpen, cleanupScanner, stopMediaTracks]);


  useEffect(() => {
    if (isOpen && selectedDeviceId && videoRef.current && codeReader.current && hasPermission === true) {
      setIsLoading(true);
      setError(null);
      
      codeReader.current.decodeFromVideoDevice(selectedDeviceId, videoRef.current, (result, err, controls) => {
        setIsLoading(false); 
        if (result) {
          onScanSuccess(result.getText());
        } else if (err) {
          if (!(err instanceof NotFoundException || err instanceof ChecksumException || err instanceof FormatException)) {
            // console.error("Barcode scanning error:", err);
          }
        }
      }).catch(err => {
        console.error("Failed to start video device for scanning:", err);
        setError("Could not start scanning. Ensure the camera is not in use by another app.");
        setIsLoading(false);
      });
    }
  }, [isOpen, selectedDeviceId, hasPermission, onScanSuccess]);


  const handleDeviceChange = (deviceId: string) => {
    cleanupScanner(); 
    codeReader.current = new BrowserMultiFormatReader(); 
    setSelectedDeviceId(deviceId);
  };
  
  const handleCloseDialog = () => {
    cleanupScanner();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
      <DialogContent className="sm:max-w-lg p-0"> {/* Changed to sm:max-w-lg for better mobile layout */}
        <DialogHeader className="p-5 sm:p-6 pb-3 border-b"> {/* Increased padding */}
          <DialogTitle className="text-xl sm:text-2xl">Scan Barcode{fieldLabel ? ` for ${fieldLabel}` : ''}</DialogTitle> {/* Increased font size */}
          <DialogDescription className="text-sm sm:text-base">Position the barcode within the camera view.</DialogDescription> {/* Increased font size */}
        </DialogHeader>
        <div className="p-5 sm:p-6 space-y-4"> {/* Increased padding and space-y */}
          {hasPermission === false && !isLoading && (
            <Alert variant="destructive" className="p-3"> {/* Increased padding */}
              <AlertTriangle className="h-5 w-5" /> {/* Increased icon size */}
              <AlertTitle>Camera Access Denied</AlertTitle>
              <AlertDescription>
                Please enable camera permissions in your browser settings to use the scanner.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="p-3"> {/* Increased padding */}
               <AlertTriangle className="h-5 w-5" /> {/* Increased icon size */}
              <AlertTitle>Scanning Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {hasPermission && videoDevices.length > 0 && (
            <div className="space-y-1.5"> {/* Increased space-y */}
              <Label htmlFor="camera-select-barcode" className="text-base">Select Camera:</Label> {/* Increased font size */}
              <Select value={selectedDeviceId || ''} onValueChange={handleDeviceChange} disabled={isLoading}>
                <SelectTrigger id="camera-select-barcode" className="text-base p-3 h-12"> {/* Increased p and h */}
                  <SelectValue placeholder="Select a camera" />
                </SelectTrigger>
                <SelectContent>
                  {videoDevices.map(device => (
                    <SelectItem key={device.deviceId} value={device.deviceId} className="text-base py-2"> {/* Increased py and font size */}
                      {device.label || `Camera ${videoDevices.indexOf(device) + 1}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden border"> {/* Added rounded-lg */}
            <video ref={videoRef} className="w-full h-full object-cover" playsInline />
            {isLoading && hasPermission !== false && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40"> {/* Increased bg opacity */}
                <Loader2 className="h-10 w-10 animate-spin text-white" /> {/* Increased icon size */}
              </div>
            )}
            {hasPermission === true && !selectedDeviceId && videoDevices.length > 0 && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white p-5 text-center"> {/* Increased bg opacity and p */}
                    <VideoOff className="h-12 w-12 mb-2.5" /> {/* Increased icon size and mb */}
                    <p className="text-lg">Initializing camera...</p> {/* Increased font size */}
                 </div>
            )}
             {hasPermission === true && videoDevices.length === 0 && !isLoading && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white p-5 text-center"> {/* Increased bg opacity and p */}
                    <VideoOff className="h-12 w-12 mb-2.5" /> {/* Increased icon size and mb */}
                    <p className="text-lg">No camera devices found.</p> {/* Increased font size */}
                 </div>
            )}
          </div>
        </div>
        <DialogFooter className="p-5 sm:p-6 pt-3 border-t"> {/* Increased padding */}
          <DialogClose className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
            Cancel
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
