import { getAiGuideResponse } from "@/utils/ai-guide/service";
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

export function createAiGuidePostHandler(service: AiGuideService = getAiGuideResponse) {
  return async function post(request: Request) {
    const contentLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > AI_GUIDE_LIMITS.maxRequestBodyBytes) {
      return errorResponse("REQUEST_TOO_LARGE", AI_GUIDE_ERROR_MESSAGES.tooLarge, 413);
    }

    let bodyText: string;
    try {
      bodyText = await request.text();
    } catch {
      return errorResponse("MALFORMED_JSON", AI_GUIDE_ERROR_MESSAGES.malformedJson, 400);
    }

    if (new TextEncoder().encode(bodyText).byteLength > AI_GUIDE_LIMITS.maxRequestBodyBytes) {
      return errorResponse("REQUEST_TOO_LARGE", AI_GUIDE_ERROR_MESSAGES.tooLarge, 413);
    }

    let body: unknown;
    try {
      body = JSON.parse(bodyText);
    } catch {
      return errorResponse("MALFORMED_JSON", AI_GUIDE_ERROR_MESSAGES.malformedJson, 400);
    }

    const validation = validateAiGuideRequest(body);
    if (!validation.success) {
      return errorResponse(validation.code, validation.message, validation.code === "REQUEST_TOO_LARGE" ? 413 : 400);
    }

    try {
      const data = await service(validation.data);
      return Response.json({ data } satisfies AiGuideSuccessResponse);
    } catch {
      return errorResponse("SERVICE_UNAVAILABLE", AI_GUIDE_ERROR_MESSAGES.unavailable, 503);
    }
  };
}

export const POST = createAiGuidePostHandler();
