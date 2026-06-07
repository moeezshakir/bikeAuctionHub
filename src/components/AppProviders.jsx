"use client";

import { MessageBoxProvider } from "@/components/ridehub/AppMessageBox";

export function AppProviders({ children }) {
  return <MessageBoxProvider>{children}</MessageBoxProvider>;
}
