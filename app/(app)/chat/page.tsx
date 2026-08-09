import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import GroupChat from "@/components/chat/group-chat";

export const metadata: Metadata = { title: "Chat Warga" };

export default async function ChatPage() {
  await requireUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Chat Warga</h1>
        <p className="text-sm text-muted-foreground">
          Percakapan satu grup untuk seluruh warga Barcelona Cove
        </p>
      </div>
      <GroupChat />
    </div>
  );
}
