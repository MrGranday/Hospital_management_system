"use client";

import { useEffect } from "react";

import { listPatientsForUi } from "@/features/patients/ui-actions";
import { useAppStore } from "@/store/app-store";

export function useRealPatients(enabled: boolean): void {
  const setRealPatients = useAppStore((state) => state.setRealPatients);
  const pushToast = useAppStore((state) => state.pushToast);
  const patientsVersion = useAppStore((state) => state.patientsVersion);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    listPatientsForUi()
      .then((result) => {
        if (!active) return;
        if (result.ok) {
          setRealPatients(result.patients);
        } else {
          pushToast({
            title: "Could not load patients",
            description: result.error,
            variant: "danger",
          });
        }
      })
      .catch(() => {
        if (active) {
          pushToast({
            title: "Could not load patients",
            description: "Check your connection and try again.",
            variant: "danger",
          });
        }
      });
    return () => {
      active = false;
    };
  }, [enabled, patientsVersion, setRealPatients, pushToast]);
}
