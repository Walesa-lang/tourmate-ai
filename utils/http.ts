export class RequestError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function boundedJson(request: Request, limit = 16_384): Promise<unknown> {
  if (Number(request.headers.get("content-length")) > limit) throw new RequestError(413, "Request is too large.");
  const reader = request.body?.getReader();
  if (!reader) throw new RequestError(400, "Enter a valid request.");
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > limit) { await reader.cancel(); throw new RequestError(413, "Request is too large."); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try { return JSON.parse(new TextDecoder().decode(bytes)); }
  catch { throw new RequestError(400, "Enter valid JSON."); }
}

export function checkOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) throw new RequestError(403, "Request not allowed.");
}

export function safeFailure(error: unknown) {
  return Response.json({ error: error instanceof RequestError ? error.message : "Unable to complete this request. Please retry." }, { status: error instanceof RequestError ? error.status : 503, headers: { "Cache-Control": "no-store" } });
}
