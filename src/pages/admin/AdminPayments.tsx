import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, IndianRupee, Tag } from 'lucide-react';
import { format } from 'date-fns';

interface Payment {
  id: string;
  user_id: string;
  plan: string;
  price: number;
  original_price: number | null;
  discount_percent: number | null;
  coupon_code: string | null;
  status: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

const AdminPayments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalDiscount, setTotalDiscount] = useState(0);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      // Fetch subscriptions with user profiles
      const { data: subscriptions, error } = await supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles for user names
      const userIds = [...new Set(subscriptions?.map((s) => s.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]));

      const paymentsWithUsers = subscriptions?.map((sub) => ({
        ...sub,
        user_name: profileMap.get(sub.user_id)?.name || 'Unknown',
        user_email: profileMap.get(sub.user_id)?.email || 'Unknown',
      })) || [];

      setPayments(paymentsWithUsers);

      // Calculate total revenue from active/completed payments (actual amount paid)
      const revenue = paymentsWithUsers
        .filter((p) => p.status === 'active' || p.razorpay_payment_id)
        .reduce((sum, p) => sum + p.price, 0);
      setTotalRevenue(revenue);

      // Calculate total discount given
      const discount = paymentsWithUsers
        .filter((p) => p.coupon_code && p.original_price)
        .reduce((sum, p) => sum + ((p.original_price || 0) - p.price), 0);
      setTotalDiscount(discount);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredPayments = payments.filter(
    (payment) =>
      payment.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.razorpay_order_id?.includes(searchQuery) ||
      payment.razorpay_payment_id?.includes(searchQuery) ||
      payment.coupon_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'paused':
        return 'secondary';
      case 'expired':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Payments</h1>
        <p className="text-muted-foreground">View subscription payments and transactions</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">₹{totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">Amount collected after discounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Discounts
            </CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-500">₹{totalDiscount.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">Discount given via coupons</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{payments.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">
              {payments.filter((p) => p.status === 'active').length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by customer name, email, coupon code, or transaction ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              No payments found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount Paid</TableHead>
                  <TableHead>Coupon</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment ID</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{payment.user_name}</p>
                        <p className="text-sm text-muted-foreground">{payment.user_email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{payment.plan}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-foreground">
                          ₹{payment.price.toLocaleString()}
                        </p>
                        {payment.original_price && payment.original_price !== payment.price && (
                          <p className="text-xs text-muted-foreground line-through">
                            ₹{payment.original_price.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {payment.coupon_code ? (
                        <Badge variant="outline" className="gap-1 text-green-600 border-green-600/30 bg-green-50">
                          <Tag className="h-3 w-3" />
                          {payment.coupon_code} ({payment.discount_percent}% off)
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(payment.status)}>{payment.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs">
                        {payment.razorpay_payment_id || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {format(new Date(payment.created_at), 'MMM d, yyyy')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPayments;
