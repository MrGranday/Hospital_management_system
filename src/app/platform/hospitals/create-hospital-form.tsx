"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createHospitalAction } from "./actions";

export default function CreateHospitalForm() {
  const [state, formAction, pending] = useActionState(createHospitalAction, undefined);

  if (state && "created" in state) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Hospital created</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Hand these credentials to the hospital administrator in person or by phone. The
          temporary password is shown once and must be changed at first sign-in.
        </p>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-muted-foreground">Hospital code</dt>
            <dd className="font-mono">{state.created.code}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Username</dt>
            <dd className="font-mono">{state.created.username}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Temporary password</dt>
            <dd className="font-mono">{state.created.tempPassword}</dd>
          </div>
        </dl>
        <Button className="mt-4" variant="outline" onClick={() => window.location.reload()}>
          Create another hospital
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="rounded-lg border border-border bg-card p-4">
      <h2 className="text-sm font-semibold">Create hospital</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="code">Hospital code</Label>
          <Input id="code" name="code" placeholder="alnoor" autoCapitalize="none" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Hospital name</Label>
          <Input id="name" name="name" placeholder="Al Noor Hospital" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Country code</Label>
          <Input id="country" name="country" placeholder="EG" maxLength={2} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Input id="timezone" name="timezone" placeholder="Africa/Cairo" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Currency code</Label>
          <Input id="currency" name="currency" placeholder="EGP" maxLength={3} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="adminFullName">Administrator name</Label>
          <Input id="adminFullName" name="adminFullName" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="adminUsername">Administrator username</Label>
          <Input
            id="adminUsername"
            name="adminUsername"
            autoCapitalize="none"
            required
          />
        </div>
      </div>

      {state && "error" in state ? (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" className="mt-4" disabled={pending}>
        {pending ? "Creating..." : "Create hospital"}
      </Button>
    </form>
  );
}
