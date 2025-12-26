import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Search, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import GymQRManager from '@/components/admin/GymQRManager';
interface Gym {
  id: string;
  name: string;
  address: string;
  city: string;
  pincode: string | null;
  phone: string | null;
  status: string;
  open_time: string;
  close_time: string;
  amenities: string[];
  facilities: string[];
  qr_code: string;
  created_at: string;
}

const AdminGyms = () => {
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGym, setEditingGym] = useState<Gym | null>(null);
  const [deleteGym, setDeleteGym] = useState<Gym | null>(null);
  const [qrManagerGym, setQrManagerGym] = useState<Gym | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    pincode: '',
    phone: '',
    open_time: '06:00',
    close_time: '22:00',
    amenities: '',
    facilities: '',
  });

  const fetchGyms = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('gyms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGyms(data || []);
    } catch (error) {
      console.error('Error fetching gyms:', error);
      toast.error('Failed to fetch gyms');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGyms();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const gymData = {
      name: formData.name.trim(),
      address: formData.address.trim(),
      city: formData.city.trim(),
      pincode: formData.pincode.trim() || null,
      phone: formData.phone.trim() || null,
      open_time: formData.open_time,
      close_time: formData.close_time,
      amenities: formData.amenities.split(',').map(s => s.trim()).filter(Boolean),
      facilities: formData.facilities.split(',').map(s => s.trim()).filter(Boolean),
    };

    try {
      if (editingGym) {
        const { error } = await supabase
          .from('gyms')
          .update(gymData)
          .eq('id', editingGym.id);

        if (error) throw error;
        toast.success('Gym updated successfully');
      } else {
        const { error } = await supabase.from('gyms').insert(gymData);
        if (error) throw error;
        toast.success('Gym created successfully');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchGyms();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save gym');
    }
  };

  const handleEdit = (gym: Gym) => {
    setEditingGym(gym);
    setFormData({
      name: gym.name,
      address: gym.address,
      city: gym.city,
      pincode: gym.pincode || '',
      phone: gym.phone || '',
      open_time: gym.open_time,
      close_time: gym.close_time,
      amenities: gym.amenities?.join(', ') || '',
      facilities: gym.facilities?.join(', ') || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteGym) return;

    try {
      const { error } = await supabase.from('gyms').delete().eq('id', deleteGym.id);
      if (error) throw error;
      toast.success('Gym deleted successfully');
      fetchGyms();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete gym');
    } finally {
      setDeleteGym(null);
    }
  };

  const toggleStatus = async (gym: Gym) => {
    const newStatus = gym.status === 'active' ? 'inactive' : 'active';
    try {
      const { error } = await supabase
        .from('gyms')
        .update({ status: newStatus })
        .eq('id', gym.id);

      if (error) throw error;
      toast.success(`Gym ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      fetchGyms();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  const resetForm = () => {
    setEditingGym(null);
    setFormData({
      name: '',
      address: '',
      city: '',
      pincode: '',
      phone: '',
      open_time: '06:00',
      close_time: '22:00',
      amenities: '',
      facilities: '',
    });
  };

  const filteredGyms = gyms.filter(
    (gym) =>
      gym.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gym.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gyms</h1>
          <p className="text-muted-foreground">Manage partner gyms</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Gym
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingGym ? 'Edit Gym' : 'Add New Gym'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="open_time">Opening Time</Label>
                  <Input
                    id="open_time"
                    type="time"
                    value={formData.open_time}
                    onChange={(e) => setFormData({ ...formData, open_time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="close_time">Closing Time</Label>
                  <Input
                    id="close_time"
                    type="time"
                    value={formData.close_time}
                    onChange={(e) => setFormData({ ...formData, close_time: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amenities">Amenities (comma-separated)</Label>
                <Input
                  id="amenities"
                  value={formData.amenities}
                  onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                  placeholder="WiFi, Parking, Locker"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="facilities">Facilities (comma-separated)</Label>
                <Input
                  id="facilities"
                  value={formData.facilities}
                  onChange={(e) => setFormData({ ...formData, facilities: e.target.value })}
                  placeholder="Cardio, Weights, Yoga"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingGym ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search gyms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : filteredGyms.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              No gyms found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>UID</TableHead>
                  <TableHead>Timing</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGyms.map((gym) => (
                  <TableRow key={gym.id}>
                    <TableCell className="font-medium">{gym.name}</TableCell>
                    <TableCell>{gym.city}</TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-2 py-1 font-mono text-xs">
                        {gym.qr_code.substring(0, 8)}...
                      </code>
                    </TableCell>
                    <TableCell>{gym.open_time} - {gym.close_time}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={gym.status === 'active'}
                          onCheckedChange={() => toggleStatus(gym)}
                        />
                        <Badge variant={gym.status === 'active' ? 'default' : 'secondary'}>
                          {gym.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setQrManagerGym(gym)}
                          title="Manage QR Code"
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(gym)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setDeleteGym(gym)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteGym} onOpenChange={() => setDeleteGym(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Gym</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteGym?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* QR Manager Dialog */}
      <GymQRManager
        gym={qrManagerGym}
        isOpen={!!qrManagerGym}
        onClose={() => setQrManagerGym(null)}
        onQRRegenerated={fetchGyms}
      />
    </div>
  );
};

export default AdminGyms;
