"use client";
import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";
import { X, FlashlightOff, Flashlight, SwitchCamera } from "lucide-react";

interface QRScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
  isActive?: boolean;
}

export default function QRScanner({ onScan, onClose, isActive = true }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isMountedRef = useRef(true);
  const hasScannedRef = useRef(false);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [torch, setTorch] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  // Main scanning effect - runs once on mount and when facingMode changes
  useEffect(() => {
    if (!isActive) return;

    let reader: BrowserMultiFormatReader | null = null;
    hasScannedRef.current = false;

    const initScanner = async () => {
      try {
        setError(null);

        // Create reader
        reader = new BrowserMultiFormatReader();
        readerRef.current = reader;

        // Get available video devices
        const devices = await reader.listVideoInputDevices();
        
        if (devices.length === 0) {
          throw new Error("No camera found");
        }

        // Select camera based on facing mode
        let selectedDeviceId: string | undefined;
        if (facingMode === "environment") {
          const backCamera = devices.find(d => 
            d.label.toLowerCase().includes("back") || 
            d.label.toLowerCase().includes("rear") ||
            d.label.toLowerCase().includes("environment")
          );
          selectedDeviceId = backCamera?.deviceId || devices[devices.length - 1]?.deviceId;
        } else {
          const frontCamera = devices.find(d => 
            d.label.toLowerCase().includes("front") || 
            d.label.toLowerCase().includes("user")
          );
          selectedDeviceId = frontCamera?.deviceId || devices[0]?.deviceId;
        }

        if (!videoRef.current || !isMountedRef.current) return;

        // Start continuous decoding
        await reader.decodeFromVideoDevice(
          selectedDeviceId,
          videoRef.current,
          (result, err) => {
            if (!isMountedRef.current || hasScannedRef.current) return;

            if (result) {
              const text = result.getText();
              console.log("QR Code detected:", text);
              hasScannedRef.current = true;
              onScan(text);
            }
            // Ignore NotFoundException - just means no QR in current frame
            if (err && err.name !== "NotFoundException") {
              console.warn("Decode warning:", err.message);
            }
          }
        );

        // Get stream reference for torch control
        if (videoRef.current?.srcObject && isMountedRef.current) {
          streamRef.current = videoRef.current.srcObject as MediaStream;
          setHasPermission(true);
        }

      } catch (err) {
        console.error("Camera error:", err);
        if (!isMountedRef.current) return;
        
        setHasPermission(false);
        if (err instanceof Error) {
          if (err.name === "NotAllowedError") {
            setError("Camera permission denied. Please allow camera access.");
          } else if (err.name === "NotFoundError" || err.message === "No camera found") {
            setError("No camera found on this device.");
          } else {
            setError(`Camera error: ${err.message}`);
          }
        }
      }
    };

    initScanner();

    // Cleanup function
    return () => {
      if (reader) {
        reader.reset();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [isActive, facingMode, onScan]);

  // Track mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const toggleTorch = async () => {
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as MediaTrackCapabilities & { torch?: boolean };
      
      if (capabilities.torch) {
        try {
          await track.applyConstraints({
            advanced: [{ torch: !torch } as MediaTrackConstraintSet],
          });
          setTorch(!torch);
        } catch (e) {
          console.warn("Torch not available:", e);
        }
      }
    }
  };

  const switchCamera = () => {
    // Reset reader before switching
    if (readerRef.current) {
      readerRef.current.reset();
      readerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setTorch(false);
    setFacingMode(prev => prev === "environment" ? "user" : "environment");
  };

  const retryCamera = () => {
    setHasPermission(null);
    setError(null);
    // Trigger re-init by updating facingMode
    setFacingMode(prev => prev);
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-linear-to-b from-black/80 to-transparent p-4 pt-12">
        <div className="flex items-center justify-between max-w-120 mx-auto">
          <button
            onClick={onClose}
            className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-white text-lg font-semibold">Scan QRIS</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative">
        {hasPermission === false ? (
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-10 h-10 text-red-500" />
              </div>
              <p className="text-white text-lg font-medium mb-2">Camera Access Required</p>
              <p className="text-white/70 text-sm mb-6">{error}</p>
              <button
                onClick={retryCamera}
                className="px-6 py-3 bg-blue-500 text-white rounded-xl font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              playsInline
              muted
              autoPlay
            />

            {/* Scanning Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/50" />
              
              <div className="relative w-72 h-72">
                <div 
                  className="absolute inset-0 bg-transparent border-4 border-white/30 rounded-3xl"
                  style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)" }} 
                />
                
                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-blue-500 rounded-tl-3xl" />
                <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-blue-500 rounded-tr-3xl" />
                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-blue-500 rounded-bl-3xl" />
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-blue-500 rounded-br-3xl" />
                
                {/* Scanning line */}
                <div className="absolute inset-x-4 h-0.5 bg-linear-to-r from-transparent via-blue-500 to-transparent animate-[scan_2s_ease-in-out_infinite]" />
              </div>
            </div>

            <div className="absolute bottom-32 left-0 right-0 text-center">
              <p className="text-white text-sm">
                Position the QRIS code within the frame
              </p>
            </div>
          </>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-6 pb-12">
        <div className="flex justify-center gap-8 max-w-120 mx-auto">
          <button
            onClick={toggleTorch}
            className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
          >
            {torch ? (
              <Flashlight className="w-6 h-6 text-yellow-400" />
            ) : (
              <FlashlightOff className="w-6 h-6 text-white" />
            )}
          </button>
          <button
            onClick={switchCamera}
            className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
          >
            <SwitchCamera className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes scan {
          0%, 100% { top: 1rem; }
          50% { top: calc(100% - 1rem); }
        }
      `}</style>
    </div>
  );
}
