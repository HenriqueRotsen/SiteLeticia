import { NextResponse } from "next/server";
import { requireNutritionist } from "@/lib/auth";
import { getGoogleAuthUrl } from "@/lib/google/calendar";

export async function GET(request) {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  if (!process.env.GOOGLE_CLIENT_ID) {
    return NextResponse.json({ message: "Google Calendar não configurado." }, { status: 503 });
  }

  const state = auth.ctx.user.id;
  const url = getGoogleAuthUrl(state);
  return NextResponse.redirect(url);
}
