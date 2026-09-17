import { useState, type FormEvent } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export function ManagerLogin() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/manager/dashboard" replace />;
  }

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!email.trim()) {
      errs.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Enter a valid email address.';
    }
    if (!password) {
      errs.password = 'Password is required.';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    setErrors({});

    try {
      await login({ email: email.trim(), password });
      navigate('/manager/dashboard', { replace: true });
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : 'Login failed.' });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-25 flex">
      {/* Left panel — branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] bg-neutral-800 flex-col justify-between p-10">
        <div>
          <Link to="/" className="inline-flex items-center gap-2 text-neutral-400 hover:text-white text-sm transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to roles
          </Link>
          <div className="mt-16">
            <div className="mb-6">
              <span className="text-xs uppercase tracking-widest font-semibold text-neutral-400">
                Restaurant MS
              </span>
            </div>
            <h2 className="text-2xl font-semibold text-white leading-snug">
              Restaurant Management<br />& Business Intelligence
            </h2>
            <p className="mt-3 text-sm text-neutral-400 leading-relaxed max-w-sm">
              Monitor performance, analyze sales trends, understand customer behavior, and make data-driven decisions for your restaurant.
            </p>
          </div>
        </div>
        <p className="text-xs text-neutral-500">
          &copy; {new Date().getFullYear()} Restaurant Management System
        </p>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile back link */}
          <Link to="/" className="lg:hidden inline-flex items-center gap-1.5 text-neutral-400 hover:text-neutral-600 text-sm mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to roles
          </Link>

          <div className="mb-8">
            <h1 className="text-xl font-semibold text-neutral-800">Welcome back</h1>
            <p className="mt-1 text-sm text-neutral-400">
              Sign in to your manager account
            </p>
          </div>

          {errors.general && (
            <div className="mb-5 rounded-lg border border-error/20 bg-error-light px-4 py-3 text-sm text-error" role="alert">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              label="Email"
              type="email"
              placeholder="manager@restaurant.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              autoComplete="current-password"
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-neutral-300 text-accent accent-accent"
                />
                <span className="text-sm text-neutral-500">Remember me</span>
              </label>
              <button type="button" className="text-sm text-neutral-400 hover:text-accent transition-colors">
                Forgot password?
              </button>
            </div>

            <Button type="submit" isLoading={isLoading} className="w-full">
              Sign In
            </Button>
          </form>

          <div className="mt-6 rounded-lg bg-neutral-50 border border-neutral-100 px-4 py-3">
            <p className="text-xs text-neutral-400 mb-1">Demo credentials</p>
            <p className="text-xs text-neutral-500 font-mono">manager@restaurant.com</p>
            <p className="text-xs text-neutral-500 font-mono">manager123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
