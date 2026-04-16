import { redirect } from "next/navigation";

import { getSession } from "~/server/better-auth/server";
import DashboardContent from "./_components/dashboard-content";

export default async function Home() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return <DashboardContent />;
}
