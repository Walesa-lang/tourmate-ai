import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createAiGuidePostHandler, POST } from "@/app/api/ai-guide/route";
import { AI_GUIDE_LIMITS } from "@/utils/ai-guide/contracts";

function request(body: string, headers?: HeadersInit) {
  return new Request("http://localhost/api/ai-guide", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body,
  });
}

function validBody() {
  return JSON.stringify({ language: "en", messages: [{ role: "user", content: "Hello" }] });
}

describe("POST /api/ai-guide", () => {
  it("returns a deterministic response for a valid request", async () => {
    const response = await POST(request(validBody()));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      data: { message: expect.any(String), emergency: false },
    });
  });

  it("returns an Etosha-specific accommodation response through the server boundary", async () => {
    const body = JSON.stringify({
      language: "en",
      messages: [{ role: "user", content: "Recommend a hotel near Etosha" }],
    });
    const response = await POST(request(body));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      data: {
        message: expect.stringContaining("Etosha Safari Lodge"),
        emergency: false,
      },
    });
  });

  it("rejects malformed JSON", async () => {
    const response = await POST(request("{"));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: { code: "MALFORMED_JSON", message: "The request body must be valid JSON." },
    });
  });

  it("rejects invalid roles", async () => {
    const response = await POST(request(JSON.stringify({ language: "en", messages: [{ role: "system", content: "Hello" }] })));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "INVALID_REQUEST" } });
  });

  it("rejects empty messages", async () => {
    const response = await POST(request(JSON.stringify({ language: "en", messages: [{ role: "user", content: "   " }] })));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "INVALID_REQUEST" } });
  });

  it("rejects excessive message count", async () => {
    const messages = Array.from({ length: AI_GUIDE_LIMITS.maxMessages + 1 }, (_, index) => ({
      role: index % 2 ? "assistant" : "user",
      content: "Hello",
    }));
    const response = await POST(request(JSON.stringify({ language: "en", messages })));
    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "REQUEST_TOO_LARGE" } });
  });

  it("rejects excessive individual message length", async () => {
    const body = JSON.stringify({ language: "en", messages: [{ role: "user", content: "x".repeat(AI_GUIDE_LIMITS.maxMessageLength + 1) }] });
    const response = await POST(request(body));
    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "REQUEST_TOO_LARGE" } });
  });

  it("rejects excessive total content", async () => {
    const messages = Array.from({ length: 7 }, (_, index) => ({
      role: index % 2 ? "assistant" : "user",
      content: "x".repeat(1_800),
    }));
    const response = await POST(request(JSON.stringify({ language: "en", messages })));
    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "REQUEST_TOO_LARGE" } });
  });

  it("rejects an oversized raw request body", async () => {
    const response = await POST(request(validBody(), { "content-length": String(AI_GUIDE_LIMITS.maxRequestBodyBytes + 1) }));
    expect(response.status).toBe(413);
  });

  it("returns a controlled error when the service fails", async () => {
    const handler = createAiGuidePostHandler(async () => { throw new Error("internal detail"); });
    const response = await handler(request(validBody()));
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: { code: "SERVICE_UNAVAILABLE", message: "The AI Guide is temporarily unavailable." },
    });
  });
});
