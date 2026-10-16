"use client";

import { useEffect, useState } from "react";

let cachedPromise = null;

function fetchPatientProfile() {
  if (!cachedPromise) {
    cachedPromise = fetch("/api/patients/me")
      .then((response) => response.json())
      .then((data) => ({
        fullName: data.patient?.full_name || data.profile?.full_name || "",
        patient: data.patient || null,
        profile: data.profile || null
      }))
      .catch(() => ({ fullName: "", patient: null, profile: null }));
  }

  return cachedPromise;
}

export function resetPatientProfileCache() {
  cachedPromise = null;
}

export function usePatientProfile() {
  const [state, setState] = useState({ fullName: "", patient: null, profile: null, loading: true });

  useEffect(() => {
    fetchPatientProfile().then((data) => {
      setState({ ...data, loading: false });
    });
  }, []);

  const firstName = state.fullName.split(/\s+/)[0] || "";

  return { ...state, firstName };
}
