import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function getSession() {
  return auth();
}

/**
 * Authenticated user for server pages.
 * Loads `image` (and name) from the database so profile photos show
 * instead of initials after upload — even if the JWT session is stale.
 */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { image: true, name: true },
  });

  return {
    ...session.user,
    name: dbUser?.name || session.user.name,
    image: dbUser?.image ?? session.user.image ?? null,
  };
}
