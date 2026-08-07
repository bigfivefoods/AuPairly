import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SiteNavbar } from "@/components/site-navbar";
import { FooterI18n } from "@/components/chrome-i18n";

export async function Navbar() {
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

  return <SiteNavbar user={user} signOutAction={signOutAction} />;
}

export function Footer() {
  return <FooterI18n />;
}
