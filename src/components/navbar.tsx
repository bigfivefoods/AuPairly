import { auth, signOut } from "@/lib/auth";
import { SiteNavbar } from "@/components/site-navbar";
import { FooterI18n } from "@/components/chrome-i18n";

export async function Navbar() {
  const session = await auth();
  const user = session?.user
    ? {
        name: session.user.name || "User",
        image: session.user.image,
        role: session.user.role,
      }
    : null;

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return <SiteNavbar user={user} signOutAction={signOutAction} />;
}

export function Footer() {
  return <FooterI18n />;
}
