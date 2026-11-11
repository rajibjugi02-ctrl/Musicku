import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getFallbackUserByEmail, saveFallbackUser } from "@/lib/user-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const { name, email, password } = body as {
      name?: string;
      email?: string;
      password?: string;
    };

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const finalName = name?.trim() || normalizedEmail.split("@")[0] || "Musicku User";

    // 1. Check if user already exists in PostgreSQL Prisma
    let existingInDb = null;
    try {
      existingInDb = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
    } catch (dbErr) {
      console.warn("[Register] Prisma duplicate check warning (checking fallback store):", dbErr);
    }

    // 2. Check if user already exists in Fail-Safe User Store
    const existingInFallback = await getFallbackUserByEmail(normalizedEmail);

    if (existingInDb || existingInFallback) {
      return NextResponse.json(
        { error: "This email is already registered. Please sign in instead." },
        { status: 409 }
      );
    }

    // 3. Hash password securely using pure-JS bcryptjs
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Fail-Safe Dual Storage: First try Prisma PostgreSQL
    let createdUser: { id: string; email: string; name: string | null; image?: string | null } | null = null;

    try {
      createdUser = await prisma.user.create({
        data: {
          name: finalName,
          email: normalizedEmail,
          password: hashedPassword,
        },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
        },
      });
    } catch (prismaErr) {
      console.warn("[Register] Prisma store encountered an error, activating Fail-Safe User Store:", prismaErr);
    }

    // 5. If Prisma was unavailable or failed, store in Fail-Safe User Store
    if (!createdUser) {
      const fallbackRecord = await saveFallbackUser({
        name: finalName,
        email: normalizedEmail,
        password: hashedPassword,
      });

      createdUser = {
        id: fallbackRecord.id,
        email: fallbackRecord.email,
        name: fallbackRecord.name,
        image: fallbackRecord.image,
      };
    } else {
      // Redundancy: keep local store synced as well
      await saveFallbackUser({
        id: createdUser.id,
        name: createdUser.name || finalName,
        email: createdUser.email,
        password: hashedPassword,
        image: createdUser.image,
      }).catch(() => { });
    }

    return NextResponse.json(
      {
        ok: true,
        user: {
          id: createdUser.id,
          email: createdUser.email,
          name: createdUser.name,
        },
        message: "Account created successfully",
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("[Register] Unexpected error:", err);
    const message = err instanceof Error ? err.message : "Registration failed. Please try again.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
