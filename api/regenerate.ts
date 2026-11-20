import { runRegenerate } from "../lib/campaign.js";

export async function POST(request: Request): Promise<Response> {
  const input = await request.json().catch(() => ({}));
  const result = await runRegenerate(input);
  return Response.json(result.body, { status: result.status });
}
