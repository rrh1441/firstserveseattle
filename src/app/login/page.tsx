// src/app/login/page.tsx
import LoginFormClient from "./LoginFormClient";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;                        // unwrap Promise
  const raw =
    typeof sp.redirect_to === "string" ? sp.redirect_to : null;

  const redirectTo =
    raw && raw.startsWith("/") && !raw.startsWith("//") && !raw.includes(":")
      ? raw
      : "/members";

  return <LoginFormClient redirectTo={redirectTo} />;
}
