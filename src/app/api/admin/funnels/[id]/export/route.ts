import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getFunnelById, getFunnelSubmissions } from "@/lib/admin-queries";
import { answerColumns, answerCells } from "@/lib/funnel-fields";

type Answer = { questionId: string; prompt: string; answer: string };

/** Quote a CSV field (RFC 4180): wrap in quotes, double internal quotes. */
function csv(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

/**
 * Download a funnel's submissions as CSV. Admin-only (the proxy excludes /api,
 * so auth is enforced here). Honors an optional `?outcome=` filter.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const funnel = await getFunnelById(id);
  if (!funnel) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const sp = request.nextUrl.searchParams;
  const outcome = sp.get("outcome");
  const q = sp.get("q");
  const a = sp.get("a");
  let rows = await getFunnelSubmissions(id);
  if (outcome) rows = rows.filter((r) => r.outcome === outcome);
  if (q) {
    rows = rows.filter((r) => {
      const answers = (Array.isArray(r.answers) ? r.answers : []) as Answer[];
      return answers.some(
        (x) => x.questionId === q && (!a || x.answer === a),
      );
    });
  }

  // One column per custom question (field name, else the question text), plus
  // "Outras respostas" for answers to deleted questions — nothing is dropped.
  const columns = answerColumns(funnel.questions);
  const header = [
    "Nome",
    "Cargo",
    "WhatsApp",
    "E-mail",
    ...columns.headers,
    "Resultado",
    "Reuniao",
    "Status WhatsApp",
    "Recebido em",
  ];

  const lines = rows.map((r) => {
    const answers = (Array.isArray(r.answers) ? r.answers : []) as Answer[];
    return [
      r.name,
      r.role ?? "",
      r.phone ?? "",
      r.email ?? "",
      ...answerCells(columns, answers),
      r.outcome,
      r.meetingStartAt ? r.meetingStartAt.toISOString() : "",
      r.whatsappStatus,
      r.createdAt.toISOString(),
    ]
      .map((field) => csv(String(field)))
      .join(",");
  });

  // UTF-8 BOM so Excel renders accents correctly.
  const body = "﻿" + [header.map(csv).join(","), ...lines].join("\r\n");

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="envios-${funnel.slug}.csv"`,
    },
  });
}
