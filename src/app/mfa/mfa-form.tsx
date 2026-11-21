"use client";

import Image from "next/image";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseQrCodeSvg } from "@/lib/auth/mfa";
import { signOutAction } from "@/server/auth/actions";
import {
  startMfaEnrolmentAction,
  verifyMfaAction,
  type MfaEnrolmentState,
} from "@/server/auth/mfa-actions";

function QrCode({ value }: { value: string }) {
  const inlineSvg = parseQrCodeSvg(value);

  return (
    <div className="mx-auto flex h-64 w-64 items-center justify-center rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      {inlineSvg ? (
        <div
          className="h-full w-full [&_svg]:h-full [&_svg]:w-full"
          dangerouslySetInnerHTML={{ __html: inlineSvg }}
          aria-label="Authenticator QR code"
          role="img"
        />
      ) : (
        <Image
          src={value.trim()}
          alt="Authenticator QR code"
          width={220}
          height={220}
          unoptimized
          className="h-full w-full object-contain"
        />
      )}
    </div>
  );
}

function VerifyForm({ factorId }: { factorId: string }) {
  const [state, formAction, pending] = useActionState(verifyMfaAction, undefined);

  return (
    <form action={formAction} className="mt-6 space-y-4" noValidate>
      <input type="hidden" name="factorId" value={factorId} />
      <div className="space-y-2">
        <Label htmlFor="code">Authenticator code</Label>
        <Input
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          required
          autoFocus
          placeholder="123456"
          className="text-center font-mono text-lg tracking-widest"
        />
      </div>

      {state?.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Verifying..." : "Verify and continue"}
      </Button>
    </form>
  );
}

export default function MfaForm({ factorId }: { factorId: string | null }) {
  const [state, formAction, pending] = useActionState(startMfaEnrolmentAction, undefined);
  const enrolment: MfaEnrolmentState = state;

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <h1 className="text-xl font-semibold tracking-tight">
          {factorId ? "Two-factor authentication" : "Set up two-factor authentication"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {factorId
            ? "Enter the 6-digit code from your authenticator app to continue."
            : "Your role requires a second factor. Scan the QR code with an authenticator app, then enter the 6-digit code."}
        </p>

        {factorId ? (
          <VerifyForm factorId={factorId} />
        ) : enrolment && "factorId" in enrolment ? (
          <div className="mt-6 space-y-4">
            <QrCode value={enrolment.qrCode} />
            <div className="rounded-md border border-border bg-card p-3 text-center">
              <p className="text-xs text-muted-foreground">Manual setup key</p>
              <p className="mt-1 break-all select-all font-mono text-sm tracking-wider">{enrolment.secret}</p>
            </div>
            <VerifyForm factorId={enrolment.factorId} />
          </div>
        ) : (
          <form action={formAction} className="mt-6 space-y-4">
            {enrolment?.error ? (
              <p role="alert" className="text-sm text-destructive">
                {enrolment.error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Preparing..." : "Start setup"}
            </Button>
          </form>
        )}

        <form action={signOutAction} className="mt-6">
          <Button type="submit" variant="ghost" className="w-full">
            Sign out
          </Button>
        </form>
      </div>
    </main>
  );
}
