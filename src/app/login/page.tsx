'use client';

import {FormEvent, useState} from 'react';
import {useRouter} from 'next/navigation';
import {isApiError, login} from '@/api';
import {Button} from '@/components/ui/Button';
import {Input} from '@/components/ui/Input';
import {writeSessionCookie} from '@/lib/session';

const demos = [
  {role: 'Super admin', email: 'admin@halacoach.local', password: 'Admin123!'},
  {role: 'Reviewer', email: 'reviewer@halacoach.local', password: 'Review123!'},
  {role: 'Support', email: 'support@halacoach.local', password: 'Support123!'},
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@halacoach.local');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const {user} = await login(email, password);
      writeSessionCookie(user);
      router.replace('/');
      router.refresh();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Could not sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-sm">
        <p className="text-2xl font-bold text-primary">HalaCoach</p>
        <h1 className="mt-2 text-xl font-semibold text-foreground">Sign in to admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Mock accounts for M1. Wrong passwords are rejected.
        </p>

        <form className="mt-8 space-y-4" onSubmit={e => void onSubmit(e)}>
          <Input
            label="Email"
            name="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            error={error ?? undefined}
            required
          />
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <div className="mt-8 rounded-2xl bg-muted/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Demo accounts
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {demos.map(demo => (
              <li key={demo.email}>
                <button
                  type="button"
                  className="w-full rounded-xl px-2 py-1.5 text-start hover:bg-card"
                  onClick={() => {
                    setEmail(demo.email);
                    setPassword(demo.password);
                    setError(null);
                  }}>
                  <span className="font-medium text-foreground">{demo.role}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {demo.email} · {demo.password}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
