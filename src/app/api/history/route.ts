import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/history — fetch last 5 tracks for current user
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const history = await prisma.playHistory.findMany({
    where: { userId: session.user.id },
    orderBy: { playedAt: "desc" },
    take: 5,
  });

  return NextResponse.json(history);
}

// POST /api/history — record a new played track (maintains FIFO max 5)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as {
    trackId: string;
    trackName: string;
    artistName: string;
    albumName: string;
    albumArt: string;
    duration: number;
  };

  const userId = session.user.id;

  // Upsert: if same track played again recently, update timestamp instead of duplicate
  const existing = await prisma.playHistory.findFirst({
    where: { userId, trackId: body.trackId },
  });

  if (existing) {
    await prisma.playHistory.update({
      where: { id: existing.id },
      data: { playedAt: new Date() },
    });
  } else {
    await prisma.playHistory.create({
      data: { userId, ...body },
    });

    // Trim to max 5: delete oldest beyond limit
    const all = await prisma.playHistory.findMany({
      where: { userId },
      orderBy: { playedAt: "desc" },
      select: { id: true },
    });

    if (all.length > 5) {
      const toDelete = all.slice(5).map((r) => r.id);
      await prisma.playHistory.deleteMany({ where: { id: { in: toDelete } } });
    }
  }

  return NextResponse.json({ ok: true });
}
