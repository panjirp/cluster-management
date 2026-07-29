import { prisma } from "@/lib/prisma";

export async function notifyUser(userId: string, title: string, body: string, url?: string) {
  await prisma.notification.create({ data: { userId, title, body, url } });
}

export async function notifyAdmins(title: string, body: string, url?: string) {
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
  if (admins.length === 0) return;
  await prisma.notification.createMany({
    data: admins.map((a) => ({ userId: a.id, title, body, url })),
  });
}
