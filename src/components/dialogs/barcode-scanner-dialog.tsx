
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, VideoOff, AlertTriangle } from 'lucide-react';
import { BrowserMultiFormatReader, NotFoundException, ChecksumException, FormatException } from '@zxing/library';

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
    // No explicit stopContinuousDecode in @zxing/library v0.21.0
    // reset() should handle stopping active decodes and camera.
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
          stopMediaTracks(stream); // Stop the initial permission stream immediately
          setHasPermission(true);
          return navigator.mediaDevices.enumerateDevices();
        })
        .then(devices => {
          const videoInputDevices = devices.filter(device => device.kind === 'videoinput');
          setVideoDevices(videoInputDevices);
          if (videoInputDevices.length > 0) {
            const defaultDeviceId = videoInputDevices[0].deviceId;
            setSelectedDeviceId(s => s ?? defaultDeviceId); // Keep current if already set, else default
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
        setIsLoading(false); // Started attempting to scan
        if (result) {
          onScanSuccess(result.getText());
          // onClose(); // The parent dialog will close this one after setting the value
        } else if (err) {
          if (!(err instanceof NotFoundException || err instanceof ChecksumException || err instanceof FormatException)) {
            // console.error("Barcode scanning error:", err);
            // setError("An error occurred during scanning. Please try again.");
            // Don't stop on minor errors, allow continuous scanning
          }
        }
      }).catch(err => {
        // This catch is for the initial promise of decodeFromVideoDevice if it fails to start
        console.error("Failed to start video device for scanning:", err);
        setError("Could not start scanning. Ensure the camera is not in use by another app.");
        setIsLoading(false);
      });
    }
  }, [isOpen, selectedDeviceId, hasPermission, onScanSuccess, onClose]);


  const handleDeviceChange = (deviceId: string) => {
    cleanupScanner(); // Stop current stream before switching
    codeReader.current = new BrowserMultiFormatReader(); // Re-initialize for new device
    setSelectedDeviceId(deviceId);
    // The useEffect for selectedDeviceId will trigger the new stream
  };
  
  const handleCloseDialog = () => {
    cleanupScanner();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
      <DialogContent className="sm:max-w-md p-0">
        <DialogHeader className="p-4 pb-2 border-b">
          <DialogTitle className="text-lg">Scan Barcode{fieldLabel ? ` for ${fieldLabel}` : ''}</DialogTitle>
          <DialogDescription className="text-xs">Position the barcode within the camera view.</DialogDescription>
        </DialogHeader>
        <div className="p-4 space-y-3">
          {hasPermission === false && !isLoading && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Camera Access Denied</AlertTitle>
              <AlertDescription>
                Please enable camera permissions in your browser settings to use the scanner.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
               <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Scanning Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {hasPermission && videoDevices.length > 0 && (
            <div className="space-y-1">
              <Label htmlFor="camera-select-barcode" className="text-sm">Select Camera:</Label>
              <Select value={selectedDeviceId || ''} onValueChange={handleDeviceChange} disabled={isLoading}>
                <SelectTrigger id="camera-select-barcode" className="text-sm p-2 h-9">
                  <SelectValue placeholder="Select a camera" />
                </SelectTrigger>
                <SelectContent>
                  {videoDevices.map(device => (
                    <SelectItem key={device.deviceId} value={device.deviceId} className="text-sm">
                      {device.label || `Camera ${videoDevices.indexOf(device) + 1}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="relative aspect-video bg-muted rounded overflow-hidden border">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline />
            {isLoading && hasPermission !== false && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}
            {hasPermission === true && !selectedDeviceId && videoDevices.length > 0 && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-4 text-center">
                    <VideoOff className="h-10 w-10 mb-2" />
                    <p>Initializing camera...</p>
                 </div>
            )}
             {hasPermission === true && videoDevices.length === 0 && !isLoading && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-4 text-center">
                    <VideoOff className="h-10 w-10 mb-2" />
                    <p>No camera devices found.</p>
                 </div>
            )}
          </div>
        </div>
        <DialogFooter className="p-4 pt-2 border-t">
          <DialogClose asChild>
            <Button type="button" variant="outline" size="sm" onClick={handleCloseDialog}>Cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

