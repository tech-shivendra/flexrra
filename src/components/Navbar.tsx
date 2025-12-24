import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Home, CreditCard, User, History, Menu, X, LogOut, QrCode } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
    setIsMenuOpen(false);
  };

  const navLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/scan', label: 'Check In', icon: QrCode },
    { to: '/plans', label: 'Plans', icon: CreditCard },
    { to: '/profile', label: 'Profile', icon: User },
    { to: '/history', label: 'History', icon: History },
  ];

  const isActive = (path: string) => location.pathname === path;

  if (!user) return null;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Flexxra" className="h-10 w-auto" />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                isActive(to)
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-foreground">{user.name}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        <button
          className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground hover:bg-accent md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {isMenuOpen && (
        <div className="absolute left-0 right-0 top-16 border-b border-border bg-card p-4 shadow-lg md:hidden animate-fade-in">
          <div className="flex flex-col gap-2">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                  isActive(to)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent'
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            ))}
            <hr className="my-2 border-border" />
            <div className="flex items-center justify-between px-4 py-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-foreground">{user.name}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
