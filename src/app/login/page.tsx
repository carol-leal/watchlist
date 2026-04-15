import LoginComponent from "../_components/login";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "~/server/better-auth/server";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/");
  return (
    <main className="flex items-center justify-center md:h-screen">
      <Suspense>
        <LoginComponent />
      </Suspense>
    </main>
  );
}
