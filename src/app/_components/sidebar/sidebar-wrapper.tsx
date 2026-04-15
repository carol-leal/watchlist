import { getSession } from "~/server/better-auth/server";
import { api } from "~/trpc/server";
import Sidebar from "./sidebar";

export default async function SidebarWrapper() {
  const session = await getSession();
  if (!session?.user) return null;

  const playlists = await api.playlist.getUserPlaylists();

  return (
    <Sidebar
      user={{
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      }}
      lists={playlists}
    />
  );
}
