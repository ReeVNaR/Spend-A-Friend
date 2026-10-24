import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import {
  Camera,
  Upload,
  X,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { parseUpiUri } from '../../utils/upi';

const UpiQrScanner = ({ isOpen, onClose, onScanSuccess }) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
  const [manualInput, setManualInput] = useState('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const fileInputRef = useRef(null);

  // Stop camera tracks helper
  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Start camera stream
  const startCamera = async () => {
    stopCamera();
    setCameraError('');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access is not supported by your browser.');
      return;
    }

    try {
      const constraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);
        scanLoop();
      }
    } catch (err) {
      console.error('Camera access error:', err);
      let msg = 'Could not access camera. Please allow camera permissions.';
      if (err.name === 'NotAllowedError') {
        msg = 'Camera permission was denied. Please allow camera access in browser settings.';
      } else if (err.name === 'NotFoundError') {
        msg = 'No camera found on this device.';
      }
      setCameraError(msg);
      setCameraActive(false);
    }
  };

  // Continuously analyze video frames
  const scanLoop = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(scanLoop);
      return;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (code && code.data) {
      handleScannedData(code.data);
      return; // Stop scan loop on success
    }

    animationFrameRef.current = requestAnimationFrame(scanLoop);
  };

  // Handle scanned raw QR text
  const handleScannedData = (rawText) => {
    stopCamera();

    const parsed = parseUpiUri(rawText);
    if (!parsed || !parsed.upiId) {
      toast.error('Scanned QR is not a valid UPI payment QR code.');
      startCamera(); // Resume
      return;
    }

    if (navigator.vibrate) {
      navigator.vibrate([40, 60, 40]);
    }

    toast.success(`Scanned UPI: ${parsed.payeeName} (${parsed.upiId})`);
    onScanSuccess(parsed);
    onClose();
  };

  // Handle file/image upload for QR scanning
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });

        setIsProcessingImage(false);

        if (code && code.data) {
          handleScannedData(code.data);
        } else {
          toast.error('Could not detect a QR code in the uploaded image. Please try a clearer photo.');
        }
      };

      img.onerror = () => {
        setIsProcessingImage(false);
        toast.error('Failed to load image.');
      };

      img.src = event.target.result;
    };

    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Handle manual input submission
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualInput.trim()) return;

    const parsed = parseUpiUri(manualInput.trim());
    if (!parsed || !parsed.upiId) {
      toast.error('Invalid UPI ID or URI format (e.g. name@bank or upi://pay?...)');
      return;
    }

    stopCamera();
    onScanSuccess(parsed);
    onClose();
  };

  // Manage camera on modal open/close
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 text-white shadow-2xl relative overflow-hidden flex flex-col space-y-4 max-h-[92dvh] overflow-y-auto custom-scrollbar">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight text-white flex items-center space-x-1.5">
                <span>Scan Merchant UPI QR</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">
                Auto-fills payee, amount & launches 1-tap payment
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden Canvas for QR frame processing */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Camera Viewport / Scanning Window */}
        <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-black/60 border border-slate-700/60 shadow-inner flex items-center justify-center">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            muted
            playsInline
          />

          {/* Viewfinder Target Box Overlay */}
          {cameraActive && (
            <div className="absolute inset-8 sm:inset-10 border-2 border-emerald-400/70 rounded-2xl pointer-events-none flex flex-col justify-between p-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              {/* Corner targeting marks */}
              <div className="flex justify-between">
                <div className="w-4 h-4 border-t-4 border-l-4 border-emerald-400 -mt-1 -ml-1 rounded-tl-sm" />
                <div className="w-4 h-4 border-t-4 border-r-4 border-emerald-400 -mt-1 -mr-1 rounded-tr-sm" />
              </div>

              {/* Animated Glowing Laser Scanning Bar */}
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-bounce" />

              <div className="flex justify-between">
                <div className="w-4 h-4 border-b-4 border-l-4 border-emerald-400 -mb-1 -ml-1 rounded-bl-sm" />
                <div className="w-4 h-4 border-b-4 border-r-4 border-emerald-400 -mb-1 -mr-1 rounded-br-sm" />
              </div>
            </div>
          )}

          {/* Camera Error / Fallback State */}
          {cameraError && (
            <div className="absolute inset-0 p-5 bg-slate-900/95 flex flex-col items-center justify-center text-center space-y-3 z-20">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-300 font-medium px-4">
                {cameraError}
              </p>
              <button
                type="button"
                onClick={startCamera}
                className="py-2 px-4 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center space-x-2 active:scale-95 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Camera</span>
              </button>
            </div>
          )}

          {/* Flip Camera Control */}
          {cameraActive && (
            <button
              type="button"
              onClick={() =>
                setFacingMode((prev) =>
                  prev === 'environment' ? 'user' : 'environment'
                )
              }
              className="absolute bottom-3 right-3 p-2 rounded-xl bg-black/60 backdrop-blur-md text-white hover:bg-black/80 active:scale-95 transition-all z-20 cursor-pointer text-xs font-bold flex items-center space-x-1.5 border border-white/20"
              title="Switch Camera"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Flip</span>
            </button>
          )}
        </div>

        {/* Scan Actions: Upload QR Photo */}
        <div className="grid grid-cols-1 gap-2 relative z-10">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            type="button"
            disabled={isProcessingImage}
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2.5 px-4 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-95 border border-white/15 text-xs font-bold text-slate-200 hover:text-white flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>
              {isProcessingImage
                ? 'Analyzing image...'
                : 'Upload QR Image / Bill Photo'}
            </span>
          </button>
        </div>

        {/* Manual Input Fallback */}
        <form onSubmit={handleManualSubmit} className="space-y-1.5 pt-2 border-t border-slate-800 relative z-10">
          <label className="text-[11px] font-semibold text-slate-400 block">
            Or paste UPI ID / Payment Link manually:
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="e.g. coffee@icici or upi://pay?pa=..."
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/40"
            />
            <button
              type="submit"
              disabled={!manualInput.trim()}
              className="py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs active:scale-95 transition-all cursor-pointer"
            >
              Apply
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpiQrScanner;
