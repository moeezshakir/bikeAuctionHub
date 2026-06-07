"use client";

import { createContext, useContext } from "react";

export const UserAppContext = createContext(null);

export function useUserApp() {
  const context = useContext(UserAppContext);
  if (!context) {
    throw new Error("useUserApp must be used inside UserAppLayout");
  }
  return context;
}
