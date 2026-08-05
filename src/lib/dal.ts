import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { decrypt, COOKIE_NAME } from "@/lib/session";

export const verifySession = cache(async () => {
  const cookie = (await cookies()).get(COOKIE_NAME)?.value;
  const session = await decrypt(cookie);

  if (!session?.authenticated) {
    redirect("/login");
  }

  return { authenticated: true as const };
});
