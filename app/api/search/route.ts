import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { maskName } from "@/lib/mask";

export type SearchResult = {
  type: "house" | "directory";
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

export async function GET(req: NextRequest) {
  const session = await requireUser();
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ results: [] });

  const canSeeFullNames = session.user.role === "ADMIN" || session.user.role === "BENDAHARA";

  const [houses, members] = await Promise.all([
    prisma.house.findMany({
      where: {
        OR: [
          { blockNumber: { contains: q, mode: "insensitive" } },
          { residentName: { contains: q, mode: "insensitive" } },
          { residents: { some: { name: { contains: q, mode: "insensitive" } } } },
        ],
      },
      include: { residents: { select: { name: true } } },
      take: 8,
    }),
    prisma.directoryMember.findMany({
      where: { fullName: { contains: q, mode: "insensitive" } },
      take: 5,
    }),
  ]);

  const houseResults: SearchResult[] = houses.map((house) => {
    const isOwner = house.id === session.user.houseId;
    const canView = canSeeFullNames || isOwner;
    const names = house.residents.map((r) => r.name).join(", ") || house.residentName || "";
    return {
      type: "house",
      id: house.id,
      title: house.blockNumber,
      subtitle: names ? (canView ? names : maskName(names)) : "Belum ada nama warga tercatat",
      href: canView ? `/cash/dues/house/${house.id}` : "/map",
    };
  });

  const memberResults: SearchResult[] = members.map((m) => ({
    type: "directory",
    id: m.id,
    title: m.fullName,
    subtitle: m.position,
    href: "/directory",
  }));

  return NextResponse.json({ results: [...houseResults, ...memberResults] });
}
