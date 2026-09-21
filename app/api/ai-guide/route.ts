import { getAiGuideResponse } from "@/utils/ai-guide/service";
import { respondWithContext } from "@/utils/ai-guide/gateway";
import { boundedJson, checkOrigin, RequestError } from "@/utils/http";
import { randomUUID } from "node:crypto";
import { withPilotUsage } from "@/utils/ai-guide/pilot-store";
import { GatewayFailure, withDeadline } from "@/utils/ai-guide/provider";
import { gatewayConfig } from "@/utils/ai-guide/config";
import { allowRequest, anonymousKey, recordUsage, usageEvent } from "@/utils/ai-guide/operations";
import {
  AI_GUIDE_ERROR_MESSAGES,
  AI_GUIDE_LIMITS,
  type AiGuideErrorCode,
  type AiGuideErrorResponse,
  type AiGuideSuccessResponse,
  validateAiGuideRequest,
} from "@/utils/ai-guide/contracts";

export const runtime = "nodejs";

function errorResponse(code: AiGuideErrorCode, message: string, status: number) {
  return Response.json({ error: { code, message } } satisfies AiGuideErrorResponse, { status });
}

type AiGuideService = typeof getAiGuideResponse;

export function createAiGuidePostHandler(service?: AiGuideService) {
  async function post(request: Request) {
    try { checkOrigin(request); } catch { return errorResponse("INVALID_REQUEST", "Request not allowed.", 403); }
    const contentLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > AI_GUIDE_LIMITS.maxRequestBodyBytes) {
      return errorResponse("REQUEST_TOO_LARGE", AI_GUIDE_ERROR_MESSAGES.tooLarge, 413);
    }

    let body: unknown;
    try {
      body = await withDeadline((signal) => boundedJson(request, AI_GUIDE_LIMITS.maxRequestBodyBytes, signal), gatewayConfig().timeoutMs, request.signal);
    } catch (error) {
      if (error instanceof GatewayFailure) {
        const response = errorResponse("SERVICE_UNAVAILABLE", AI_GUIDE_ERROR_MESSAGES.unavailable, 503);
        response.headers.set("X-Assistant-Failure", error.kind);
        return response;
      }
      if (error instanceof RequestError && error.status === 413) return errorResponse("REQUEST_TOO_LARGE", AI_GUIDE_ERROR_MESSAGES.tooLarge, 413);
      return errorResponse("MALFORMED_JSON", AI_GUIDE_ERROR_MESSAGES.malformedJson, 400);
    }

    const validation = validateAiGuideRequest(body);
    if (!validation.success) {
      return errorResponse(validation.code, validation.message, validation.code === "REQUEST_TOO_LARGE" ? 413 : 400);
    }

    try {
      const data = await (service ? service(validation.data) : respondWithContext(validation.data, request));
      return Response.json({ data } satisfies AiGuideSuccessResponse);
    } catch (error) {
      if (error instanceof RequestError) return errorResponse("SERVICE_UNAVAILABLE", error.message, error.status);
      if (error instanceof GatewayFailure) {
        const response = errorResponse("SERVICE_UNAVAILABLE", AI_GUIDE_ERROR_MESSAGES.unavailable, 503);
        response.headers.set("X-Assistant-Failure", error.kind);
        return response;
      }
      return errorResponse("SERVICE_UNAVAILABLE", AI_GUIDE_ERROR_MESSAGES.unavailable, 503);
    }
  }
  return async (request: Request) => {
    const start = Date.now();
    const suppliedId = request.headers.get("x-request-id");
    const requestId = suppliedId && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(suppliedId) ? suppliedId : randomUUID();
    const session = anonymousKey(request);
    let response: Response;
    try {
      // Reject cross-origin requests before any durable quota mutation.
      checkOrigin(request);
      response = allowRequest(session) ? await withPilotUsage(request, requestId, () => post(request)) : errorResponse("SERVICE_UNAVAILABLE", "Please wait a minute before trying again.", 429);
    } catch (error) {
      response = errorResponse("SERVICE_UNAVAILABLE", error instanceof RequestError ? error.message : AI_GUIDE_ERROR_MESSAGES.unavailable, error instanceof RequestError ? error.status : 503);
    }
    response.headers.delete("X-Assistant-Failure");
    response.headers.set("X-Request-Id", requestId);
    response.headers.set("Cache-Control", "no-store");
    if (response.status === 429) response.headers.set("Retry-After", "60");
    const result = response.ok ? await response.clone().json() as AiGuideSuccessResponse : undefined;
    const event = usageEvent(response.status, start, session, result?.data.grounding === "illustrative_catalogue" ? "catalogue" : "demo");
    recordUsage({ ...event, request_id: requestId, retrieval_count: result?.data.usage?.retrievalCount ?? 0, state: response.ok && result?.data.mode === "demonstration" ? "fallback" : event.state });
    return response;
  };
}

export const POST = createAiGuidePostHandler();
