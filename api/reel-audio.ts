import { handleAudio } from "../lib/audio.js";

export async function GET(request: Request): Promise<Response> {
  const u = new URL(request.url);
  const r: any = await handleAudio("GET", { id: u.searchParams.get("id") });
  if (r.binary) {
    return new Response(new Uint8Array(r.binary.data), {
      status: 200,
      headers: { "Content-Type": r.binary.mime, "Cache-Control": "public, max-age=31536000, immutable" },
    });
  }
  return Response.json(r.body, { status: r.status });
}

export async function POST(request: Request): Promise<Response> {
  const body = await request.json().catch(() => null);
  const r = await handleAudio("POST", {}, body);
  return Response.json(r.body, { status: r.status });
}
