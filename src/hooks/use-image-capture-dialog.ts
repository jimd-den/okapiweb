
"use client";

import { useState, useEffect, useCallback, useRef }
from 'react';
import { useToast } from '@/hooks/use-toast';

// T: Type of the item being associated with the image (e.g., Todo, Problem)
// M: Type for the capture mode (e.g., 'before' | 'after' for Todo, or a single mode for Problem)
export interface UseImageCaptureDialogReturn<T, M> {
  showCameraDialog: boolean;
  selectedItemForImage: T | null;
  captureMode: M | null;
  videoDevices: MediaDeviceInfo[];
  selectedDeviceId: string | null;
  hasCameraPermission: boolean | null;
  isCheckingPermission: boolean;
  stream: MediaStream | null;
  isCapturingImage: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  handleOpenImageCaptureDialog: (item: T, mode: M) => void;
  handleCloseImageCaptureDialog: () => void;
  handleDeviceChange: (deviceId: string) => void;
  startVideoStream: (deviceId?: string) => Promise<void>;
  stopStream: () => void;
}

export function useImageCaptureDialog<T, M>(): UseImageCaptureDialogReturn<T, M> {
  const [showCameraDialog, setShowCameraDialog] = useState(false);
  const [selectedItemForImage, setSelectedItemForImage] = useState<T | null>(null);
  const [captureMode, setCaptureMode] = useState<M | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isCheckingPermission, setIsCheckingPermission] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturingImage, setIsCapturingImage] = useState(false); // For the actual capture process

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  const startVideoStream = useCallback(async (deviceId?: string) => {
    stopStream();
    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : true,
      };
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setHasCameraPermission(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions in your browser settings.',
      });
    }
  }, [stopStream, toast]);

  const getCameraDevicesAndStartStream = useCallback(async () => {
    setIsCheckingPermission(true);
    try {
      // Attempt to get user media to prompt for permission if not already granted
      // and to ensure the device list is populated.
      const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
      tempStream.getTracks().forEach(track => track.stop()); // Stop temp stream immediately

      setHasCameraPermission(true);
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputDevices = devices.filter(device => device.kind === 'videoinput');
      setVideoDevices(videoInputDevices);

      if (videoInputDevices.length > 0) {
        const newSelectedDeviceId = selectedDeviceId ?? videoInputDevices[0].deviceId;
        if(!selectedDeviceId) setSelectedDeviceId(newSelectedDeviceId);
        await startVideoStream(newSelectedDeviceId);
      } else {
        toast({ title: "No Camera Found", description: "No video input devices detected.", variant: "destructive" });
        setHasCameraPermission(false); // Explicitly set if no devices found
      }
    } catch (error) {
      console.error('Error enumerating devices or getting permission:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Error',
        description: 'Could not access camera. Please check permissions and ensure a camera is connected.',
      });
    } finally {
        setIsCheckingPermission(false);
    }
  }, [selectedDeviceId, startVideoStream, toast]);


  const handleOpenImageCaptureDialog = useCallback(async (item: T, mode: M) => {
    setSelectedItemForImage(item);
    setCaptureMode(mode);
    setShowCameraDialog(true);
    await getCameraDevicesAndStartStream();
  }, [getCameraDevicesAndStartStream]);


  const handleCloseImageCaptureDialog = useCallback(() => {
    setShowCameraDialog(false);
    stopStream();
    setSelectedItemForImage(null);
    setCaptureMode(null);
    // Optionally reset selectedDeviceId if you want it to pick the default next time
    // setSelectedDeviceId(null); 
  }, [stopStream]);

  const handleDeviceChange = useCallback((deviceId: string) => {
    setSelectedDeviceId(deviceId);
    startVideoStream(deviceId);
  }, [startVideoStream]);
  
  // Effect to stop stream when dialog is not shown
  useEffect(() => {
    if (!showCameraDialog) {
      stopStream();
    }
  }, [showCameraDialog, stopStream]);

  return {
    showCameraDialog,
    selectedItemForImage,
    captureMode,
    videoDevices,
    selectedDeviceId,
    hasCameraPermission,
    isCheckingPermission,
    stream,
    isCapturingImage,
    setIsCapturingImage, // Expose setter for external control during capture
    videoRef,
    canvasRef,
    handleOpenImageCaptureDialog,
    handleCloseImageCaptureDialog,
    handleDeviceChange,
    startVideoStream,
    stopStream,
  };
}
