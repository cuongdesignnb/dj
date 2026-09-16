'use client';

import { useActionState, useState } from 'react';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { signIn } from '@/app/admin/actions';
import type { SignInState } from '@/app/admin/actions';
import { inputClass } from '../form/FieldInput';
import { buttonClass } from '../ui/Dialog';

export default function LoginForm({ demo }: { demo: { email: string; password: string } | null }) {
  const [state, action, pending] = useActionState<SignInState, FormData>(signIn, {});
  const [show, setShow] = useState(false);

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.error && (
        <p role="alert" id="login-error" className="rounded-[8px] border border-rave-red/40 bg-rave-red/[0.08] px-3 py-2 text-sm text-[#FF8A9C]">
          {state.error}
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
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? 'login-error' : undefined}
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
            aria-invalid={state.error ? true : undefined}
            aria-describedby={state.error ? 'login-error' : undefined}
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
      {demo && (
        <div className="rounded-[8px] border border-admin-warning/35 bg-admin-warning/[0.06] px-3 py-2.5 text-xs text-admin-warning">
          <p className="font-semibold">Demo mode</p>
          <p className="mt-1 text-white/75">
            Sign in with <span className="font-mono text-white">{demo.email}</span> / <span className="font-mono text-white">{demo.password}</span>.
            Demo data only; nothing here changes the public site.
          </p>
        </div>
      )}
    </form>
  );
}
