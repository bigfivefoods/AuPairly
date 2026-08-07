import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppChromeClient } from "@/components/app-chrome-client";

/**
 * Server wrapper: loads session, then client chrome picks app shell vs marketing nav.
 */
export async function AppChrome({ children }: { children: React.ReactNode }) {
  const session = await auth();

  let user: { name: string; image?: string | null; role: string } | null = null;
  if (session?.user) {
    const db = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true, name: true },
    });
    user = {
      name: db?.name || session.user.name || "User",
      image: db?.image ?? session.user.image ?? null,
      role: session.user.role,
    };
  }

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <AppChromeClient user={user} signOutAction={signOutAction}>
      {children}
    </AppChromeClient>
  );
}
