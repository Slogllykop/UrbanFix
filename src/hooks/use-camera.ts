"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface CameraState {
  stream: MediaStream | null;
  error: Error | null;
  isLoading: boolean;
  hasPermission: boolean | null;
}

interface UseCameraOptions {
  facingMode?: "user" | "environment";
  width?: number;
  height?: number;
}

export function useCamera(options: UseCameraOptions = {}) {
  const { facingMode = "environment", width = 1920, height = 1080 } = options;

  const [state, setState] = useState<CameraState>({
    stream: null,
    error: null,
    isLoading: false,
    hasPermission: null,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const startCamera = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: width },
          height: { ideal: height },
        },
        audio: false,
      });

      setState({
        stream,
        error: null,
        isLoading: false,
        hasPermission: true,
      });

      // Attach to video element if ref is set
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      let message = "Failed to access camera";

      if (error instanceof DOMException) {
        switch (error.name) {
          case "NotAllowedError":
            message = "Camera permission denied";
            break;
          case "NotFoundError":
            message = "No camera found";
            break;
          case "NotSupportedError":
            message = "Camera not supported";
            break;
          case "NotReadableError":
            message = "Camera is already in use";
            break;
        }
      }

      setState({
        stream: null,
        error: new Error(message),
        isLoading: false,
        hasPermission: false,
      });
    }
  }, [facingMode, width, height]);

  const stopCamera = useCallback(() => {
    if (state.stream) {
      for (const track of state.stream.getTracks()) {
        track.stop();
      }
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setState((prev) => ({ ...prev, stream: null }));
  }, [state.stream]);

  const capturePhoto = useCallback((): Blob | null => {
    if (!videoRef.current || !state.stream) return null;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0);

    // Convert to blob synchronously using toDataURL
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    const binaryString = atob(dataUrl.split(",")[1]);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes], { type: "image/jpeg" });
  }, [state.stream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.stream) {
        for (const track of state.stream.getTracks()) {
          track.stop();
        }
      }
    };
  }, [state.stream]);

  return {
    ...state,
    videoRef,
    startCamera,
    stopCamera,
    capturePhoto,
  };
}
