
"use client";

import { useState, useEffect, useCallback, useRef }
from 'react';

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
  setIsCapturingImage: React.Dispatch<React.SetStateAction<boolean>>; // Expose setter
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
      throw new Error('Camera access denied. Please enable camera permissions in your browser settings.');
    }
  }, [stopStream]);

  const getCameraDevicesAndStartStream = useCallback(async () => {
    setIsCheckingPermission(true);
    try {
      const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
      tempStream.getTracks().forEach(track => track.stop()); 

      setHasCameraPermission(true);
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputDevices = devices.filter(device => device.kind === 'videoinput');
      setVideoDevices(videoInputDevices);

      if (videoInputDevices.length > 0) {
        const newSelectedDeviceId = selectedDeviceId ?? videoInputDevices[0].deviceId;
        if(!selectedDeviceId) setSelectedDeviceId(newSelectedDeviceId);
        await startVideoStream(newSelectedDeviceId);
      } else {
        setHasCameraPermission(false); 
        throw new Error("No video input devices detected.");
      }
    } catch (error) {
      console.error('Error enumerating devices or getting permission:', error);
      setHasCameraPermission(false);
      throw error; // Re-throw for the caller to handle
    } finally {
        setIsCheckingPermission(false);
    }
  }, [selectedDeviceId, startVideoStream]);


  const handleOpenImageCaptureDialog = useCallback(async (item: T, mode: M) => {
    setSelectedItemForImage(item);
    setCaptureMode(mode);
    setShowCameraDialog(true);
    try {
      await getCameraDevicesAndStartStream();
    } catch (e) {
      // Error already handled in getCameraDevicesAndStartStream by throwing
      // The component calling this should catch it.
      console.error("Failed to initialize camera for dialog:", e);
    }
  }, [getCameraDevicesAndStartStream]);


  const handleCloseImageCaptureDialog = useCallback(() => {
    setShowCameraDialog(false);
    stopStream();
    setSelectedItemForImage(null);
    setCaptureMode(null);
  }, [stopStream]);

  const handleDeviceChange = useCallback((deviceId: string) => {
    setSelectedDeviceId(deviceId);
    startVideoStream(deviceId).catch(e => {
      // Error handled in startVideoStream, potentially show UI feedback
      console.error("Failed to change device:", e);
    });
  }, [startVideoStream]);
  
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
    setIsCapturingImage, 
    videoRef,
    canvasRef,
    handleOpenImageCaptureDialog,
    handleCloseImageCaptureDialog,
    handleDeviceChange,
    startVideoStream,
    stopStream,
  };
}
