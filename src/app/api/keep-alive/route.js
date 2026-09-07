import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

function isAuthorized(request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;

  const authorization = request.headers.get("authorization");
  if (authorization === `Bearer ${cronSecret}`) return true;

  // Vercel Cron Jobs envia este header automaticamente.
  if (request.headers.get("x-vercel-cron") === "1") return true;

  return false;
}

async function touchSupabase() {
  const supabase = createSupabaseAdmin();
  const touchedAt = new Date().toISOString();

  const { error, count } = await supabase
    .from("waitlist")
    .select("id", { count: "exact", head: true });

  if (error) {
    throw new Error(error.message || "Falha ao consultar waitlist.");
  }

  return { touchedAt, count: count ?? 0 };
}

async function handleKeepAlive(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await touchSupabase();
    return NextResponse.json({
      ok: true,
      source: request.headers.get("x-vercel-cron") === "1" ? "vercel-cron" : "manual-or-github",
      ...result
    });
  } catch (error) {
    const message =
      error?.message === "Missing Supabase admin environment variables."
        ? "Supabase admin não configurado."
        : "Não foi possível tocar no Supabase.";

    console.error("Keep-alive failed:", error);
    return NextResponse.json({ message, ok: false }, { status: 500 });
  }
}

export async function GET(request) {
  return handleKeepAlive(request);
}

export async function POST(request) {
  return handleKeepAlive(request);
}
