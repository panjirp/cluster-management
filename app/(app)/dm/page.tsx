import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { DmInbox } from "@/components/dm/dm-inbox";

export const metadata: Metadata = { title: "Pesan Antar Warga" };

export default async function DmPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return <DmInbox currentUserId={session.user.id} />;
}
