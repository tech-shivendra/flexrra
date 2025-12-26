import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  age: number | null;
  gender: string | null;
  home_area: string | null;
  subscription_status: string | null;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  created_at: string;
}

interface CheckIn {
  id: string;
  gym_name: string | null;
  check_in_time: string;
  status: string | null;
}

interface Subscription {
  id: string;
  plan: string;
  status: string;
  start_date: string;
  end_date: string;
  remaining_sessions: number;
  total_sessions: number;
  price: number;
}

const AdminCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerCheckIns, setCustomerCheckIns] = useState<CheckIn[]>([]);
  const [customerSubscriptions, setCustomerSubscriptions] = useState<Subscription[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const viewCustomerDetails = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDetailLoading(true);

    try {
      const [checkInsResult, subscriptionsResult] = await Promise.all([
        supabase
          .from('check_ins')
          .select('*')
          .eq('user_id', customer.id)
          .order('check_in_time', { ascending: false })
          .limit(10),
        supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', customer.id)
          .order('created_at', { ascending: false }),
      ]);

      setCustomerCheckIns(checkInsResult.data || []);
      setCustomerSubscriptions(subscriptionsResult.data || []);
    } catch (error) {
      console.error('Error fetching customer details:', error);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.includes(searchQuery)
  );

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'paused':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Customers</h1>
        <p className="text-muted-foreground">View and manage customer accounts</p>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
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
          ) : filteredCustomers.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              No customers found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.phone || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(customer.subscription_status)}>
                        {customer.subscription_status || 'inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(customer.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => viewCustomerDetails(customer)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedCustomer.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedCustomer.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedCustomer.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Age</p>
                  <p className="font-medium">{selectedCustomer.age || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gender</p>
                  <p className="font-medium capitalize">{selectedCustomer.gender || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Home Area</p>
                  <p className="font-medium">{selectedCustomer.home_area || '-'}</p>
                </div>
              </div>

              {isDetailLoading ? (
                <div className="flex h-20 items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : (
                <>
                  <div>
                    <h3 className="mb-3 font-semibold">Subscriptions</h3>
                    {customerSubscriptions.length === 0 ? (
                      <p className="text-muted-foreground">No subscriptions</p>
                    ) : (
                      <div className="space-y-2">
                        {customerSubscriptions.map((sub) => (
                          <div key={sub.id} className="rounded-lg border p-3">
                            <div className="flex items-center justify-between">
                              <span className="font-medium capitalize">{sub.plan}</span>
                              <Badge variant={getStatusColor(sub.status)}>{sub.status}</Badge>
                            </div>
                            <div className="mt-2 text-sm text-muted-foreground">
                              <p>Sessions: {sub.remaining_sessions}/{sub.total_sessions}</p>
                              <p>Price: ₹{sub.price}</p>
                              <p>
                                {format(new Date(sub.start_date), 'MMM d')} -{' '}
                                {format(new Date(sub.end_date), 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="mb-3 font-semibold">Recent Check-ins</h3>
                    {customerCheckIns.length === 0 ? (
                      <p className="text-muted-foreground">No check-ins</p>
                    ) : (
                      <div className="space-y-2">
                        {customerCheckIns.map((checkIn) => (
                          <div key={checkIn.id} className="flex items-center justify-between rounded-lg border p-3">
                            <span>{checkIn.gym_name || 'Unknown Gym'}</span>
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(checkIn.check_in_time), 'MMM d, yyyy h:mm a')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCustomers;
