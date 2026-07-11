import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      message: "Route ini belum diimplementasikan.",
    },
    { status: 501 }
  );
}
