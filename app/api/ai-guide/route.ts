import { getAiGuideResponse } from "@/utils/ai-guide/service";
import { respondWithContext } from "@/utils/ai-guide/gateway";
import { boundedJson, RequestError } from "@/utils/http";
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
    const contentLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > AI_GUIDE_LIMITS.maxRequestBodyBytes) {
      return errorResponse("REQUEST_TOO_LARGE", AI_GUIDE_ERROR_MESSAGES.tooLarge, 413);
    }

    let body: unknown;
    try {
      body = await boundedJson(request, AI_GUIDE_LIMITS.maxRequestBodyBytes);
    } catch (error) {
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
    } catch {
      return errorResponse("SERVICE_UNAVAILABLE", AI_GUIDE_ERROR_MESSAGES.unavailable, 503);
    }
  }
  return async (request: Request) => {
    const start = Date.now();
    const session = anonymousKey(request);
    const response = allowRequest(session) ? await post(request) : errorResponse("SERVICE_UNAVAILABLE", "Please wait a minute before trying again.", 429);
    response.headers.set("Cache-Control", "no-store");
    if (response.status === 429) response.headers.set("Retry-After", "60");
    const result = response.ok ? await response.clone().json() as AiGuideSuccessResponse : undefined;
    recordUsage(usageEvent(response.status, start, session, result?.data.grounding === "illustrative_catalogue" ? "catalogue" : "demo"));
    return response;
  };
}

export const POST = createAiGuidePostHandler();
