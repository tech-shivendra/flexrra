import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { QrCode, Download, RefreshCw, Activity, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Gym {
  id: string;
  name: string;
  address: string;
  city: string;
  qr_code: string;
  status: string;
}

interface CheckIn {
  id: string;
  user_id: string;
  check_in_time: string;
  check_in_type: string;
  status: string;
  gym_name: string;
  profiles?: {
    name: string;
    email: string;
    phone: string;
  };
}

interface GymQRManagerProps {
  gym: Gym | null;
  isOpen: boolean;
  onClose: () => void;
  onQRRegenerated: () => void;
}

const GymQRManager = ({ gym, isOpen, onClose, onQRRegenerated }: GymQRManagerProps) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [isLoadingCheckIns, setIsLoadingCheckIns] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'qr' | 'activity'>('qr');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (gym && isOpen) {
      generateQRCode(gym.qr_code);
      fetchCheckIns();
    }
  }, [gym, isOpen]);

  const generateQRCode = async (qrCode: string) => {
    setIsGenerating(true);
    try {
      const dataUrl = await QRCode.toDataURL(qrCode, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
      setQrDataUrl(dataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
    } finally {
      setIsGenerating(false);
    }
  };

  const fetchCheckIns = async () => {
    if (!gym) return;
    
    setIsLoadingCheckIns(true);
    try {
      const { data, error } = await supabase
        .from('check_ins')
        .select(`
          id,
          user_id,
          check_in_time,
          check_in_type,
          status,
          gym_name
        `)
        .eq('gym_id', gym.id)
        .order('check_in_time', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch user profiles for check-ins
      const userIds = [...new Set((data || []).map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, email, phone')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      const enrichedCheckIns = (data || []).map(checkIn => ({
        ...checkIn,
        profiles: profileMap.get(checkIn.user_id) as CheckIn['profiles'],
      }));

      setCheckIns(enrichedCheckIns);
    } catch (error) {
      console.error('Error fetching check-ins:', error);
      toast.error('Failed to fetch activity');
    } finally {
      setIsLoadingCheckIns(false);
    }
  };

  const regenerateQRCode = async () => {
    if (!gym) return;
    
    setIsRegenerating(true);
    try {
      const { data, error } = await (supabase as any)
        .rpc('admin_regenerate_gym_qr', { p_gym_id: gym.id });
      if (error) throw error;
      const newQRCode = (data as { qr_code: string })?.qr_code;
      if (!newQRCode) throw new Error('Failed to regenerate QR code');
      await generateQRCode(newQRCode);
      onQRRegenerated();
      toast.success('QR code regenerated successfully');
    } catch (error: any) {
      console.error('Error regenerating QR code:', error);
      toast.error(error.message || 'Failed to regenerate QR code');
    } finally {
      setIsRegenerating(false);
    }
  };

  const downloadQRCode = async () => {
    if (!gym || !qrDataUrl) return;
    
    try {
      // Create a canvas to add gym name to the QR
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.src = qrDataUrl;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const padding = 40;
      const textHeight = 60;
      canvas.width = img.width + padding * 2;
      canvas.height = img.height + padding * 2 + textHeight;

      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw QR code
      ctx.drawImage(img, padding, padding);

      // Add gym name
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(gym.name, canvas.width / 2, img.height + padding + 30);
      
      ctx.font = '14px Arial';
      ctx.fillStyle = '#666666';
      ctx.fillText(gym.city, canvas.width / 2, img.height + padding + 50);

      // Download
      const link = document.createElement('a');
      link.download = `${gym.name.replace(/\s+/g, '-').toLowerCase()}-qr-code.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.success('QR code downloaded');
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast.error('Failed to download QR code');
    }
  };

  const copyUID = async () => {
    if (!gym) return;
    
    try {
      await navigator.clipboard.writeText(gym.qr_code);
      setCopied(true);
      toast.success('UID copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy UID');
    }
  };

  if (!gym) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code & Activity - {gym.name}
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border pb-2">
          <Button
            variant={activeTab === 'qr' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('qr')}
            className="gap-2"
          >
            <QrCode className="h-4 w-4" />
            QR Code
          </Button>
          <Button
            variant={activeTab === 'activity' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('activity')}
            className="gap-2"
          >
            <Activity className="h-4 w-4" />
            Activity ({checkIns.length})
          </Button>
        </div>

        {activeTab === 'qr' && (
          <div className="space-y-6">
            {/* QR Code Display */}
            <Card>
              <CardContent className="flex flex-col items-center p-6">
                {isGenerating ? (
                  <div className="flex h-[300px] w-[300px] items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </div>
                ) : (
                  <img
                    src={qrDataUrl}
                    alt={`QR Code for ${gym.name}`}
                    className="h-[300px] w-[300px] rounded-lg border border-border"
                  />
                )}
                
                <div className="mt-4 text-center">
                  <p className="text-lg font-semibold">{gym.name}</p>
                  <p className="text-sm text-muted-foreground">{gym.city}</p>
                </div>

                <div className="mt-4 flex gap-3">
                  <Button onClick={downloadQRCode} className="gap-2">
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    onClick={regenerateQRCode}
                    disabled={isRegenerating}
                    className="gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                    Regenerate
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* UID Display */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Unique Identifier (UID)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Input
                    value={gym.qr_code}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button variant="outline" size="icon" onClick={copyUID}>
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  This UID is encoded in the QR code and used for check-ins.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'activity' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Recent Check-ins</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchCheckIns}
                disabled={isLoadingCheckIns}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingCheckIns ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingCheckIns ? (
                <div className="flex h-32 items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : checkIns.length === 0 ? (
                <div className="flex h-32 items-center justify-center text-muted-foreground">
                  No check-ins recorded yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {checkIns.map((checkIn) => (
                      <TableRow key={checkIn.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {checkIn.profiles?.name || 'Unknown'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {checkIn.profiles?.phone || checkIn.profiles?.email || '-'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(checkIn.check_in_time), 'dd MMM yyyy, hh:mm a')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {checkIn.check_in_type || 'manual'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={checkIn.status === 'checkedIn' ? 'default' : 'secondary'}
                          >
                            {checkIn.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GymQRManager;
