"use client";

import { useActionState } from "react";
import { LockKeyhole, Stethoscope } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInAction } from "@/server/auth/actions";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(signInAction, undefined);

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Stethoscope className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight">MediCore</p>
            <p className="text-xs text-muted-foreground">Hospital Management System</p>
          </div>
        </div>

        <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Use the hospital code and username issued by your administrator.
        </p>

        <form action={formAction} className="mt-6 space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="hospitalCode">Hospital code</Label>
            <Input
              id="hospitalCode"
              name="hospitalCode"
              autoComplete="organization"
              autoCapitalize="none"
              spellCheck={false}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>

          {state?.error ? (
            <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
              <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {state.error}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-xs text-muted-foreground">
          Accounts are created by your hospital administrator. There is no self-service
          registration or password reset.
        </p>
      </div>
    </main>
  );
}
