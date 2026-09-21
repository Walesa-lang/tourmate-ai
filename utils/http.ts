export class RequestError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function boundedJson(request: Request, limit = 16_384, signal = request.signal): Promise<unknown> {
  if (Number(request.headers.get("content-length")) > limit) throw new RequestError(413, "Request is too large.");
  const reader = request.body?.getReader();
  if (!reader) throw new RequestError(400, "Enter a valid request.");
  let size = 0;
  const chunks: Uint8Array[] = [];
  const cancel = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener("abort", cancel, { once: true });
  try {
  while (true) {
    if (signal.aborted) throw new RequestError(408, "Request cancelled.");
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > limit) { await reader.cancel(); throw new RequestError(413, "Request is too large."); }
    chunks.push(value);
  }
  if (signal.aborted) throw new RequestError(408, "Request cancelled.");
  } finally { signal.removeEventListener("abort", cancel); reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try { return JSON.parse(new TextDecoder().decode(bytes)); }
  catch { throw new RequestError(400, "Enter valid JSON."); }
}

export function checkOrigin(request: Request) {
  const origin = request.headers.get("origin");
  // Next may normalize request.url to its internal listening hostname. Host is
  // the browser's actual destination and cannot be set by cross-origin JS.
  // Do not trust a client-supplied X-Forwarded-Host as an authorization input.
  const url = new URL(request.url);
  const host = request.headers.get("host") ?? url.host;
  if (origin && origin !== `${url.protocol}//${host}`) throw new RequestError(403, "Request not allowed.");
}

export function safeFailure(error: unknown) {
  return Response.json({ error: error instanceof RequestError ? error.message : "Unable to complete this request. Please retry." }, { status: error instanceof RequestError ? error.status : 503, headers: { "Cache-Control": "no-store" } });
}
