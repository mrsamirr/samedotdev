import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma, PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

type HistoryEntry = { prompt: string; at: string };
function isHistoryArray(v: unknown): v is HistoryEntry[] {
  return (
    Array.isArray(v) &&
    v.every(
      (e) => e && typeof e.prompt === "string" && typeof e.at === "string"
    )
  );
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const url = new URL(request.url);
    const segments = url.pathname.split("/");
    const id = segments[segments.length - 1];

    if (!id) {
      return NextResponse.json({ error: "Missing design ID" }, { status: 400 });
    }

    const design = await prisma.design.findFirst({
      where: { id, userId },
      include: { versions: true },
    });
    if (!design)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ design });
  } catch (error) {
    console.error("GET /api/designs/[id] error", error);
    return NextResponse.json(
      { error: "Failed to fetch design" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const url = new URL(request.url);
    const segments = url.pathname.split("/");
    const id = segments[segments.length - 1];

    if (!id) {
      return NextResponse.json({ error: "Missing design ID" }, { status: 400 });
    }

    const body = await request.json();

    // For partial updates (like position/size), we don't require html
    // Only validate html if it's being updated
    if (body.html !== undefined && !body.html) {
      return NextResponse.json(
        { error: "HTML cannot be empty when provided" },
        { status: 400 }
      );
    }

    const existing = await prisma.design.findFirst({ where: { id, userId } });
    if (!existing) {
      return NextResponse.json({ error: "Design not found" }, { status: 404 });
    }

    // Fix: Properly handle promptHistory type
    const existingHistory: Prisma.JsonValue = existing.promptHistory;
    const history: HistoryEntry[] = isHistoryArray(existingHistory)
      ? existingHistory
      : [];

    const newHistory: HistoryEntry[] = body.prompt
      ? [...history, { prompt: body.prompt, at: new Date().toISOString() }]
      : history;

    const nextVersion = (existing.version || 1) + 1;

    // Prepare update data - only include fields that are being updated
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    // Only update fields that are provided
    if (body.html !== undefined) updateData.html = body.html;
    if (body.css !== undefined) updateData.css = body.css;
    if (body.elements !== undefined) updateData.elements = body.elements as Prisma.InputJsonValue;
    if (body.prompt !== undefined) updateData.prompt = body.prompt;
    if (body.position !== undefined) updateData.position = body.position as Prisma.InputJsonValue;
    if (body.size !== undefined) updateData.size = body.size as Prisma.InputJsonValue;

    // Only create version history and update version if content is being changed
    const isContentUpdate = body.html !== undefined || body.css !== undefined || body.elements !== undefined || body.prompt !== undefined;

    let updated;
    if (isContentUpdate) {
      // Update design with version history for content changes
      updated = await prisma.$transaction(async (tx: Omit<PrismaClient, "$extends" | "$transaction" | "$disconnect" | "$connect" | "$on" | "$use">) => {
        // Create version history entry
        await tx.designVersion.create({
          data: {
            designId: id,
            version: nextVersion,
            designJson: {
              html: body.html || existing.html,
              css: body.css || existing.css,
              elements: body.elements || existing.elements,
            } as Prisma.InputJsonValue,
          },
        });

        // Update main design with version increment and history
        return await tx.design.update({
          where: { id },
          data: {
            ...updateData,
            promptHistory: newHistory as Prisma.InputJsonValue,
            version: nextVersion,
          },
          include: { versions: true },
        });
      });
    } else {
      // Simple update for position/size changes without version history
      updated = await prisma.design.update({
        where: { id },
        data: updateData,
        include: { versions: true },
      });
    }

    return NextResponse.json({ design: updated });
  } catch (error) {
    console.error("PUT /api/designs/[id] error:", error);

    // More specific error handling
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        return NextResponse.json(
          { error: "Design update conflict" },
          { status: 409 }
        );
      }
      if (error.message.includes("Record not found")) {
        return NextResponse.json(
          { error: "Design not found" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      {
        error: "Failed to update design",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const url = new URL(request.url);
    const segments = url.pathname.split("/");
    const id = segments[segments.length - 1];

    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const result = await prisma.design.deleteMany({ where: { id, userId } });
    if (result.count === 0)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/designs/[id] error", error);
    return NextResponse.json(
      { error: "Failed to delete design" },
      { status: 500 }
    );
  }
}
