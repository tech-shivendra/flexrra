import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, CameraOff, Loader2 } from 'lucide-react';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onError?: (error: string) => void;
  isProcessing?: boolean;
}

const QRScanner = ({ onScan, onError, isProcessing = false }: QRScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasScannedRef = useRef(false);
  const isStoppingRef = useRef(false);

  const startScanner = async () => {
    if (!containerRef.current) return;
    if (scannerRef.current) return; // already running
    hasScannedRef.current = false;

    try {
      const html5QrCode = new Html5Qrcode('qr-reader');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          // Guard: html5-qrcode fires the success callback for every frame
          // that decodes the QR until stop() resolves (async). Without this
          // ref the camera stays open on mobile and triggers multiple
          // check-ins in the same session.
          if (hasScannedRef.current) return;
          hasScannedRef.current = true;
          stopScanner();
          onScan(decodedText);
        },
        (errorMessage) => {
          // Ignore scan errors (these are normal when no QR is in view)
        }
      );

      setIsScanning(true);
      setHasPermission(true);
    } catch (err: any) {
      console.error('Error starting scanner:', err);
      scannerRef.current = null;
      setHasPermission(false);
      onError?.('Camera permission denied or not available');
    }
  };

  const stopScanner = async () => {
    if (!scannerRef.current || isStoppingRef.current) {
      setIsScanning(false);
      return;
    }
    isStoppingRef.current = true;
    const instance = scannerRef.current;
    scannerRef.current = null;
    try {
      // Only stop if actively scanning; guards against "Scanner is not running" errors.
      // @ts-expect-error - getState is on the instance
      if (typeof instance.getState === 'function' && instance.getState() === 2) {
        await instance.stop();
      }
      instance.clear();
    } catch (err) {
      console.error('Error stopping scanner:', err);
    } finally {
      isStoppingRef.current = false;
      setIsScanning(false);
    }
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <Card className="mx-auto max-w-md overflow-hidden">
      <CardContent className="p-4">
        <div className="relative">
          <div
            id="qr-reader"
            ref={containerRef}
            className="min-h-[300px] rounded-lg bg-muted"
          />

          {!isScanning && !isProcessing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-lg bg-muted">
              <Camera className="h-16 w-16 text-muted-foreground" />
              <p className="text-center text-sm text-muted-foreground">
                {hasPermission === false
                  ? 'Camera permission denied'
                  : 'Tap to start scanning'}
              </p>
              <Button onClick={startScanner} size="lg">
                <Camera className="mr-2 h-4 w-4" />
                Start Scanner
              </Button>
            </div>
          )}

          {isProcessing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-lg bg-muted/90">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Processing check-in...</p>
            </div>
          )}
        </div>

        {isScanning && !isProcessing && (
          <div className="mt-4 flex justify-center">
            <Button variant="outline" onClick={stopScanner}>
              <CameraOff className="mr-2 h-4 w-4" />
              Stop Scanner
            </Button>
          </div>
        )}

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Point your camera at the gym's QR code to check in
        </p>
      </CardContent>
    </Card>
  );
};

export default QRScanner;
