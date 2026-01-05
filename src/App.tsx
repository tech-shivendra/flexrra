import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { InstallPrompt } from "@/components/InstallPrompt";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import GymDetail from "@/pages/GymDetail";
import Plans from "@/pages/Plans";
import Profile from "@/pages/Profile";
import History from "@/pages/History";
import ScanCheckIn from "@/pages/ScanCheckIn";
import Install from "@/pages/Install";
import NotFound from "./pages/NotFound";

// Admin imports
import AdminLayout from "@/components/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminGyms from "@/pages/admin/AdminGyms";
import AdminCustomers from "@/pages/admin/AdminCustomers";
import AdminPayments from "@/pages/admin/AdminPayments";
import AdminPlans from "@/pages/admin/AdminPlans";
import AdminCoupons from "@/pages/admin/AdminCoupons";

const queryClient = new QueryClient();

// Protected Route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Public Route wrapper (redirects to home if logged in)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

// Layout with Navbar
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Navbar />
      {children}
      <InstallPrompt />
    </>
  );
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <Signup />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        }
      />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/install" element={<Install />} />

      {/* Public Routes with Navbar */}
      <Route
        path="/"
        element={
          <AppLayout>
            <Home />
          </AppLayout>
        }
      />
      <Route
        path="/gym/:id"
        element={
          <AppLayout>
            <GymDetail />
          </AppLayout>
        }
      />
      <Route
        path="/plans"
        element={
          <AppLayout>
            <Plans />
          </AppLayout>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Profile />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <AppLayout>
              <History />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/scan"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ScanCheckIn />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <AdminLayout>
            <AdminDashboard />
          </AdminLayout>
        }
      />
      <Route
        path="/admin/gyms"
        element={
          <AdminLayout>
            <AdminGyms />
          </AdminLayout>
        }
      />
      <Route
        path="/admin/customers"
        element={
          <AdminLayout>
            <AdminCustomers />
          </AdminLayout>
        }
      />
      <Route
        path="/admin/payments"
        element={
          <AdminLayout>
            <AdminPayments />
          </AdminLayout>
        }
      />
      <Route
        path="/admin/plans"
        element={
          <AdminLayout>
            <AdminPlans />
          </AdminLayout>
        }
      />
      <Route
        path="/admin/coupons"
        element={
          <AdminLayout>
            <AdminCoupons />
          </AdminLayout>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
