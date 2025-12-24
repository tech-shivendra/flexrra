import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  DialogDescription,
  DialogFooter,
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
import { toast } from 'sonner';
import { Plus, Trash2, Edit, Tag, Loader2, ArrowLeft, Percent } from 'lucide-react';

interface Coupon {
  id: string;
  code: string;
  discount_percent: number;
  is_active: boolean;
  created_at: string;
}

const AdminCoupons = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);
  
  const [newCode, setNewCode] = useState('');
  const [newDiscount, setNewDiscount] = useState('');

  const fetchCoupons = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching coupons:', error);
      toast.error('Failed to load coupons');
    } else {
      setCoupons(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreate = async () => {
    if (!newCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }
    
    const discount = parseInt(newDiscount);
    if (isNaN(discount) || discount < 1 || discount > 100) {
      toast.error('Discount must be between 1 and 100');
      return;
    }

    setIsCreating(true);
    const { error } = await supabase
      .from('coupons')
      .insert({
        code: newCode.toUpperCase().trim(),
        discount_percent: discount,
        is_active: true,
      });

    if (error) {
      if (error.code === '23505') {
        toast.error('Coupon code already exists');
      } else {
        console.error('Error creating coupon:', error);
        toast.error('Failed to create coupon');
      }
    } else {
      toast.success('Coupon created successfully!');
      setNewCode('');
      setNewDiscount('');
      setCreateDialogOpen(false);
      fetchCoupons();
    }
    setIsCreating(false);
  };

  const toggleCouponStatus = async (coupon: Coupon) => {
    const { error } = await supabase
      .from('coupons')
      .update({ is_active: !coupon.is_active })
      .eq('id', coupon.id);

    if (error) {
      console.error('Error updating coupon:', error);
      toast.error('Failed to update coupon');
    } else {
      toast.success(`Coupon ${!coupon.is_active ? 'activated' : 'deactivated'}`);
      fetchCoupons();
    }
  };

  const confirmDelete = (coupon: Coupon) => {
    setCouponToDelete(coupon);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!couponToDelete) return;

    setIsDeleting(true);
    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', couponToDelete.id);

    if (error) {
      console.error('Error deleting coupon:', error);
      toast.error('Failed to delete coupon');
    } else {
      toast.success('Coupon deleted successfully');
      fetchCoupons();
    }
    setIsDeleting(false);
    setDeleteDialogOpen(false);
    setCouponToDelete(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground md:text-3xl">
              Coupon <span className="text-gradient">Management</span>
            </h1>
            <p className="text-sm text-muted-foreground">Create and manage discount coupons</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">All Coupons</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {coupons.length}
              </span>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="gradient" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Coupon
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Coupon</DialogTitle>
                  <DialogDescription>
                    Add a new discount coupon for your customers
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Coupon Code</Label>
                    <Input
                      id="code"
                      placeholder="e.g., SUMMER20"
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                      className="uppercase"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discount">Discount Percentage</Label>
                    <div className="relative">
                      <Input
                        id="discount"
                        type="number"
                        placeholder="e.g., 20"
                        min="1"
                        max="100"
                        value={newDiscount}
                        onChange={(e) => setNewDiscount(e.target.value)}
                      />
                      <Percent className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                    disabled={isCreating}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="gradient"
                    onClick={handleCreate}
                    disabled={isCreating || !newCode || !newDiscount}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Coupon'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : coupons.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center text-center">
              <Tag className="mb-2 h-10 w-10 text-muted-foreground/50" />
              <p className="text-muted-foreground">No coupons yet</p>
              <p className="text-sm text-muted-foreground/70">
                Create your first coupon to get started
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map((coupon) => (
                    <TableRow key={coupon.id}>
                      <TableCell className="font-mono font-semibold">
                        {coupon.code}
                      </TableCell>
                      <TableCell>
                        <span className="rounded-full bg-primary/10 px-2 py-1 text-sm font-medium text-primary">
                          {coupon.discount_percent}% off
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={coupon.is_active}
                            onCheckedChange={() => toggleCouponStatus(coupon)}
                          />
                          <span className={coupon.is_active ? 'text-success' : 'text-muted-foreground'}>
                            {coupon.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(coupon.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => confirmDelete(coupon)}
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Coupon</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the coupon "{couponToDelete?.code}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default AdminCoupons;
