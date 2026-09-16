'use client';

import { useState } from 'react';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { inputClass } from '../form/FieldInput';
import { buttonClass } from '../ui/Dialog';

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [show, setShow] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/v1/auth/login', { method: 'POST', headers: { accept: 'application/json' }, body: JSON.stringify({ email: String(form.get('email') ?? ''), password: String(form.get('password') ?? ''), remember: form.get('remember') === 'on' }) });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const message = payload?.error?.message ?? payload?.message ?? 'Sign-in failed.';
        setError(String(message));
        return;
      }
      window.location.assign('/admin');
    } catch {
      setError('The authentication service could not be reached.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {error && (
        <p role="alert" id="login-error" className="rounded-[8px] border border-rave-red/40 bg-rave-red/[0.08] px-3 py-2 text-sm text-[#FF8A9C]">
          {error}
        </p>
      )}
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-white/90">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'login-error' : undefined}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-white/90">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={show ? 'text' : 'password'}
            autoComplete="current-password"
            required
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'login-error' : undefined}
            className={`${inputClass} pr-11`}
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? 'Hide password' : 'Show password'}
            aria-pressed={show}
            className="absolute right-1 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-[6px] text-admin-muted hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red"
          >
            {show ? <EyeOff aria-hidden className="h-4 w-4" /> : <Eye aria-hidden className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-admin-muted">
        <input type="checkbox" name="remember" className="h-4 w-4 accent-[#FF173D]" /> Keep me signed in on this device
      </label>
      <button type="submit" disabled={pending} aria-busy={pending || undefined} className={`${buttonClass.primary} w-full`}>
        <LogIn aria-hidden className="h-4 w-4" />
        {pending ? 'Signing in…' : 'Sign In'}
      </button>
      <p className="text-center text-xs text-admin-muted">Forgot your password? Ask an administrator to reset it.</p>
    </form>
  );
}
