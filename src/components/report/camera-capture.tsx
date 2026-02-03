"use client";

import { IconCamera, IconCheck, IconRefresh } from "@tabler/icons-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface CameraCaptureProps {
  onCapture: (imageBlob: Blob) => void;
  onError: (error: Error) => void;
}

type CameraState = "idle" | "captured";

export function CameraCapture({ onCapture }: CameraCaptureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useState<CameraState>("idle");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // Handle file input change
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const imageUrl = URL.createObjectURL(file);
      setCapturedImage(imageUrl);
      setState("captured");

      // Draw to canvas for consistent export and preview resizing
      const img = new Image();
      img.onload = () => {
        if (canvasRef.current) {
          // Set canvas dimensions to match image
          canvasRef.current.width = img.width;
          canvasRef.current.height = img.height;

          const ctx = canvasRef.current.getContext("2d");
          ctx?.drawImage(img, 0, 0);
        }
      };
      img.src = imageUrl;
    },
    [],
  );

  // Trigger file input
  const openCamera = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Confirm captured photo
  const confirmPhoto = useCallback(() => {
    if (!canvasRef.current) return;

    canvasRef.current.toBlob(
      (blob) => {
        if (blob) {
          onCapture(blob);
        }
      },
      "image/jpeg",
      0.9,
    );
  }, [onCapture]);

  // Retake photo
  const retakePhoto = useCallback(() => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
    }
    setCapturedImage(null);
    setState("idle");

    // Clear the input so selecting the same file works if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // Immediately reopen camera if that's the desired UX,
    // but usually user might want to see the "Open Camera" button again.
    // openCamera();
  }, [capturedImage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (capturedImage) {
        URL.revokeObjectURL(capturedImage);
      }
    };
  }, [capturedImage]);

  return (
    <div className="flex flex-col gap-4">
      {/* Camera viewport / Preview Area */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted border border-border">
        {/* Captured image preview */}
        {capturedImage && state === "captured" ? (
          <img
            src={capturedImage}
            alt="Captured"
            className="absolute inset-0 h-full w-full object-contain bg-black/5"
          />
        ) : (
          /* Idle state */
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={openCamera}
          >
            <div className="rounded-full bg-muted-foreground/10 p-6">
              <IconCamera className="h-12 w-12 text-muted-foreground z-10" />
            </div>
            <Button variant="ghost" className="pointer-events-none">
              Tap to Take Photo
            </Button>
          </div>
        )}

        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Hidden file input for native camera */}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
      </div>

      {/* Action buttons for captured state */}
      {state === "captured" && (
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={retakePhoto}>
            <IconRefresh className="mr-2 h-4 w-4" />
            Retake
          </Button>
          <Button className="flex-1" onClick={confirmPhoto}>
            <IconCheck className="mr-2 h-4 w-4" />
            Use Photo
          </Button>
        </div>
      )}
    </div>
  );
}
