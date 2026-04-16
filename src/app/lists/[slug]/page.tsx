import { redirect } from "next/navigation";
import { getSession } from "~/server/better-auth/server";
import { HydrateClient } from "~/trpc/server";
import ListContent from "./_components/list-content";

export const metadata = {
  title: "List | WatchLists",
};

export default async function ListPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { slug } = await params;

  return (
    <HydrateClient>
      <ListContent slug={slug} />
    </HydrateClient>
  );
}
