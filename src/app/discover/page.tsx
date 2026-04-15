import { redirect } from "next/navigation";
import { getSession } from "~/server/better-auth/server";
import { HydrateClient } from "~/trpc/server";
import DiscoverContent from "./_components/discover-content";

export const metadata = {
  title: "Discover | WatchLists",
};

export default async function DiscoverPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <HydrateClient>
      <DiscoverContent />
    </HydrateClient>
  );
}
