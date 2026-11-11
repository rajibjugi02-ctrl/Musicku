import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const artists = await prisma.likedArtist.findMany({
    where: { userId: session.user.id },
    orderBy: { likedAt: "desc" },
  });

  return NextResponse.json(artists);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    artistId: string;
    artistName: string;
    artistImage: string;
    genres: string[];
    followers: number;
  };

  const liked = await prisma.likedArtist.upsert({
    where: { userId_artistId: { userId: session.user.id, artistId: body.artistId } },
    create: { userId: session.user.id, ...body },
    update: { likedAt: new Date() },
  });

  return NextResponse.json(liked);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { artistId } = await req.json() as { artistId: string };

  await prisma.likedArtist.deleteMany({
    where: { userId: session.user.id, artistId },
  });

  return NextResponse.json({ ok: true });
}

