import { NextRequest, NextResponse } from "next/server";
import { fetchUnifiedSearch } from "@/lib/music-service";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";
  const results = await fetchUnifiedSearch(q);
  return NextResponse.json(results);
}
