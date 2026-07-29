import { prisma } from "@/lib/prisma";

export async function logActivity(actorName: string, action: string, description: string) {
  await prisma.activityLog.create({ data: { actorName, action, description } });
}
