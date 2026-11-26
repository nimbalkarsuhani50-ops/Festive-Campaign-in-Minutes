import { handleHistory } from "../lib/history.js";

export async function GET(request: Request): Promise<Response> {
  const u = new URL(request.url);
  const r = await handleHistory("GET", { id: u.searchParams.get("id"), limit: u.searchParams.get("limit") });
  return Response.json(r.body, { status: r.status });
}

export async function POST(request: Request): Promise<Response> {
  const body = await request.json().catch(() => null);
  const r = await handleHistory("POST", {}, body);
  return Response.json(r.body, { status: r.status });
}
