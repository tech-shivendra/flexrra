import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCheckIn } from '@/hooks/useCheckIn';
import QRScanner from '@/components/QRScanner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, CheckCircle2, XCircle, Ticket } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CheckInResult {
  success: boolean;
  error?: string;
  gym?: {
    name: string;
    address: string;
    city: string;
  };
  remainingSessions?: number;
}

const ScanCheckIn = () => {
  const navigate = useNavigate();
  const { qrCheckIn, fetchSubscription, subscription, isLoading } = useCheckIn();
  const [checkInResult, setCheckInResult] = useState<CheckInResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const handleScan = async (qrCode: string) => {
    setIsProcessing(true);
    const result = await qrCheckIn(qrCode);
    setCheckInResult(result);
    setIsProcessing(false);

    if (result.success) {
      toast({
        title: 'Check-in Successful! 🎉',
        description: `Welcome to ${result.gym?.name}`,
      });
    } else {
      toast({
        title: 'Check-in Failed',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const handleScanError = (error: string) => {
    toast({
      title: 'Scanner Error',
      description: error,
      variant: 'destructive',
    });
  };

  const resetScanner = () => {
    setCheckInResult(null);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="gradient-hero pb-6 pt-4">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="mb-2 text-2xl font-bold text-foreground">
            Scan QR to <span className="text-gradient">Check In</span>
          </h1>
          <p className="text-muted-foreground">
            Scan the gym's QR code to mark your attendance
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Session Info Card */}
        {subscription && (
          <Card className="mb-6">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Ticket className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Sessions Remaining</p>
                <p className="text-2xl font-bold text-foreground">
                  {subscription.remaining_sessions}{' '}
                  <span className="text-sm font-normal text-muted-foreground">
                    / {subscription.total_sessions}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {!subscription && !isLoading && (
          <Card className="mb-6 border-destructive/50 bg-destructive/10">
            <CardContent className="p-4">
              <p className="mb-2 font-semibold text-destructive">No Active Subscription</p>
              <p className="mb-4 text-sm text-muted-foreground">
                You need an active subscription to check in at gyms.
              </p>
              <Button onClick={() => navigate('/plans')}>View Plans</Button>
            </CardContent>
          </Card>
        )}

        {/* Scanner or Result */}
        {!checkInResult ? (
          <QRScanner
            onScan={handleScan}
            onError={handleScanError}
            isProcessing={isProcessing}
          />
        ) : (
          <Card className="mx-auto max-w-md">
            <CardContent className="p-6 text-center">
              {checkInResult.success ? (
                <>
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20">
                    <CheckCircle2 className="h-12 w-12 text-green-500" />
                  </div>
                  <h2 className="mb-2 text-xl font-bold text-foreground">
                    Check-in Successful!
                  </h2>
                  <p className="mb-1 text-lg font-medium text-foreground">
                    {checkInResult.gym?.name}
                  </p>
                  <p className="mb-4 text-sm text-muted-foreground">
                    {checkInResult.gym?.address}, {checkInResult.gym?.city}
                  </p>
                  <div className="mb-6 rounded-lg bg-muted p-4">
                    <p className="text-sm text-muted-foreground">Sessions Remaining</p>
                    <p className="text-3xl font-bold text-primary">
                      {checkInResult.remainingSessions}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/20">
                    <XCircle className="h-12 w-12 text-destructive" />
                  </div>
                  <h2 className="mb-2 text-xl font-bold text-foreground">
                    Check-in Failed
                  </h2>
                  <p className="mb-6 text-muted-foreground">{checkInResult.error}</p>
                </>
              )}
              
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => navigate('/')}>
                  Go Home
                </Button>
                <Button className="flex-1" onClick={resetScanner}>
                  Scan Again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ScanCheckIn;
