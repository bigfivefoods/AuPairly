"use client";

import { PrivyProvider as PrivyRoot } from "@privy-io/react-auth";
import type { ReactNode } from "react";

/**
 * Wraps the app with Privy when NEXT_PUBLIC_PRIVY_APP_ID is set.
 * Used for email OTP verification before registration.
 */
export function PrivyProvider({ children }: { children: ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!appId) {
    return <>{children}</>;
  }

  return (
    <PrivyRoot
      appId={appId}
      clientId={process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID}
      config={{
        loginMethods: ["email"],
        appearance: {
          theme: "light",
          accentColor: "#0f766e",
          logo: undefined,
        },
        // Marketplace — no crypto wallets required for email verify
        embeddedWallets: {
          ethereum: {
            createOnLogin: "off",
          },
        },
      }}
    >
      {children}
    </PrivyRoot>
  );
}

export function isPrivyClientConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_PRIVY_APP_ID);
}
