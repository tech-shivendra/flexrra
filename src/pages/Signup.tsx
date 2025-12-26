import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { Mail, Lock, User, Phone, MapPin, ArrowRight, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo.png';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address').max(255),
  phone: z.string().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  age: z.number().min(16, 'Must be at least 16 years old').max(100),
  gender: z.string().min(1, 'Please select a gender'),
  homeArea: z.string().min(2, 'Please enter your area/city'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type SignupStep = 'form' | 'otp' | 'success';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    age: '',
    gender: '',
    homeArea: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState<SignupStep>('form');
  const [otp, setOtp] = useState('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
    // Reset phone verification if phone number changes
    if (field === 'phone' && isPhoneVerified) {
      setIsPhoneVerified(false);
    }
  };

  const sendOTP = async () => {
    // Validate phone first
    if (!/^\d{10}$/.test(formData.phone)) {
      setErrors((prev) => ({ ...prev, phone: 'Phone number must be exactly 10 digits' }));
      return;
    }

    setIsSendingOTP(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { phone: formData.phone },
      });

      if (error) throw error;

      if (data?.success) {
        setStep('otp');
        toast.success('OTP sent to your phone number');
      } else {
        toast.error(data?.error || 'Failed to send OTP');
      }
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      toast.error(error.message || 'Failed to send OTP');
    } finally {
      setIsSendingOTP(false);
    }
  };

  const verifyOTP = async () => {
    if (otp.length !== 6) {
      toast.error('Please enter the complete 6-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: { phone: formData.phone, otp },
      });

      if (error) throw error;

      if (data?.success) {
        setIsPhoneVerified(true);
        setStep('form');
        toast.success('Phone number verified successfully!');
      } else {
        toast.error(data?.error || 'Invalid OTP');
      }
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      toast.error(error.message || 'Failed to verify OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const resendOTP = async () => {
    setOtp('');
    await sendOTP();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Check if phone is verified
    if (!isPhoneVerified) {
      toast.error('Please verify your phone number first');
      return;
    }

    const dataToValidate = {
      ...formData,
      age: formData.age ? parseInt(formData.age) : 0,
    };

    const result = signupSchema.safeParse(dataToValidate);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        if (!fieldErrors[field]) {
          fieldErrors[field] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    const { success, error } = await signup({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      age: parseInt(formData.age),
      gender: formData.gender,
      homeArea: formData.homeArea,
    });
    setIsLoading(false);

    if (success) {
      toast.success('Account created successfully! Welcome to Flexrra!');
      navigate('/');
    } else {
      toast.error(error || 'Signup failed');
    }
  };

  const renderOTPStep = () => (
    <div className="space-y-6">
      <Button
        variant="ghost"
        onClick={() => setStep('form')}
        className="mb-4 -ml-2"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to form
      </Button>

      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold text-foreground">Verify your phone</h2>
        <p className="text-muted-foreground">
          We've sent a 6-digit OTP to <span className="font-medium text-foreground">+91 {formData.phone}</span>
        </p>
      </div>

      <div className="flex justify-center">
        <InputOTP
          value={otp}
          onChange={(value) => setOtp(value)}
          maxLength={6}
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </div>

      <Button
        onClick={verifyOTP}
        variant="gradient"
        size="lg"
        className="w-full"
        disabled={isLoading || otp.length !== 6}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Verifying...
          </>
        ) : (
          'Verify OTP'
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Didn't receive the OTP?{' '}
        <button
          type="button"
          onClick={resendOTP}
          disabled={isSendingOTP}
          className="font-semibold text-primary hover:underline disabled:opacity-50"
        >
          {isSendingOTP ? 'Sending...' : 'Resend OTP'}
        </button>
      </p>
    </div>
  );

  const renderFormStep = () => (
    <>
      <div className="mb-6 text-center lg:text-left">
        <h2 className="mb-2 text-2xl font-bold text-foreground">Create your account</h2>
        <p className="text-muted-foreground">Join thousands of fitness enthusiasts</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="h-11 pl-10"
                disabled={isLoading}
              />
            </div>
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="h-11 pl-10"
                disabled={isLoading}
              />
            </div>
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          {/* Phone with OTP verification */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="phone"
                  placeholder="10 digit number"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className={`h-11 pl-10 ${isPhoneVerified ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : ''}`}
                  disabled={isLoading || isPhoneVerified}
                />
                {isPhoneVerified && (
                  <CheckCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500" />
                )}
              </div>
              {!isPhoneVerified && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={sendOTP}
                  disabled={isSendingOTP || formData.phone.length !== 10}
                  className="h-11 whitespace-nowrap"
                >
                  {isSendingOTP ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Send OTP'
                  )}
                </Button>
              )}
            </div>
            {isPhoneVerified && (
              <p className="text-xs text-green-600">Phone number verified</p>
            )}
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>

          {/* Home Area */}
          <div className="space-y-2">
            <Label htmlFor="homeArea">City / Area</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="homeArea"
                placeholder="Delhi, Mumbai..."
                value={formData.homeArea}
                onChange={(e) => handleChange('homeArea', e.target.value)}
                className="h-11 pl-10"
                disabled={isLoading}
              />
            </div>
            {errors.homeArea && <p className="text-xs text-destructive">{errors.homeArea}</p>}
          </div>

          {/* Age */}
          <div className="space-y-2">
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              type="number"
              placeholder="25"
              value={formData.age}
              onChange={(e) => handleChange('age', e.target.value)}
              className="h-11"
              min="16"
              max="100"
              disabled={isLoading}
            />
            {errors.age && <p className="text-xs text-destructive">{errors.age}</p>}
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <Label>Gender</Label>
            <Select
              value={formData.gender}
              onValueChange={(value) => handleChange('gender', value)}
              disabled={isLoading}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
            {errors.gender && <p className="text-xs text-destructive">{errors.gender}</p>}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Min 6 characters"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className="h-11 pl-10"
                disabled={isLoading}
              />
            </div>
            {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repeat password"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                className="h-11 pl-10"
                disabled={isLoading}
              />
            </div>
            {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
          </div>
        </div>

        <Button
          type="submit"
          variant="gradient"
          size="lg"
          className="mt-6 w-full"
          disabled={isLoading || !isPhoneVerified}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              Create Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>

        {!isPhoneVerified && (
          <p className="text-center text-sm text-amber-600 dark:text-amber-400">
            Please verify your phone number to create an account
          </p>
        )}
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Branding */}
      <div className="hidden w-2/5 gradient-primary lg:flex lg:flex-col lg:items-center lg:justify-center lg:p-12">
        <div className="max-w-md text-center">
          <div className="mb-8 flex justify-center">
            <img src={logo} alt="Flexrra Logo" className="h-48 w-auto object-contain" />
          </div>
          <h1 className="mb-4 text-4xl font-bold text-primary-foreground">
            Join Flexrra
          </h1>
          <p className="mb-8 text-lg text-primary-foreground/80">
            Start your fitness journey with access to premium gyms across India.
          </p>
          <div className="space-y-4 text-left">
            {[
              'Access 20+ partner gyms',
              'Pause anytime, no commitment',
              'Zero hidden fees',
              'Personal training available',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3 text-primary-foreground">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-foreground/20">
                  ✓
                </div>
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex w-full items-center justify-center bg-background p-6 lg:w-3/5 lg:p-12">
        <div className="w-full max-w-lg">
          {/* Mobile Logo */}
          <div className="mb-6 flex justify-center lg:hidden">
            <img src={logo} alt="Flexrra Logo" className="h-32 w-auto object-contain" />
          </div>

          {step === 'otp' ? renderOTPStep() : renderFormStep()}
        </div>
      </div>
    </div>
  );
};

export default Signup;
