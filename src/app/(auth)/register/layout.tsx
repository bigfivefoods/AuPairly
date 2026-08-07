"use client";

import type { ReactNode } from "react";
import { PrivyProvider } from "@/components/privy-provider";

/** Privy (email OTP) only mounts on the register flow — not the whole app. */
export default function RegisterLayout({ children }: { children: ReactNode }) {
  return <PrivyProvider>{children}</PrivyProvider>;
}
