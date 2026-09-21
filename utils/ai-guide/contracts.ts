import { languages, type Language } from "@/app/i18n/translations";

export const AI_GUIDE_LIMITS = {
  maxMessages: 20,
  maxMessageLength: 2_000,
  maxTotalContentLength: 12_000,
  maxRequestBodyBytes: 24 * 1024,
} as const;

export const AI_GUIDE_ERROR_MESSAGES = {
  malformedJson: "The request body must be valid JSON.",
  invalidRequest: "The AI Guide request is invalid.",
  tooLarge: "The AI Guide request is too large.",
  unavailable: "The AI Guide is temporarily unavailable.",
} as const;

export type AiGuideMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AiGuideRequest = {
  language: Language;
  messages: AiGuideMessage[];
};

export type AiGuideServiceResponse = {
  message: string;
  emergency: boolean;
  clarification?: "area" | "duration";
  grounding?: "demo" | "illustrative_catalogue" | "approved_records" | "unavailable";
  mode?: "demonstration" | "database" | "live_provider" | "unavailable";
  sources?: import("./retrieval").Source[];
  notice?: string;
  recommendations?: import("./catalogue").Recommendation[];
  itinerary?: { area: string; days: number; pace: string; items: import("./catalogue").Recommendation[] };
  usage?: { provider: string; model: string; retrievalCount?: number };
};

export type AiGuideSuccessResponse = {
  data: AiGuideServiceResponse;
};

export type AiGuideErrorCode =
  | "MALFORMED_JSON"
  | "INVALID_REQUEST"
  | "REQUEST_TOO_LARGE"
  | "SERVICE_UNAVAILABLE";

export type AiGuideErrorResponse = {
  error: {
    code: AiGuideErrorCode;
    message: string;
  };
};

export type ValidationResult =
  | { success: true; data: AiGuideRequest }
  | { success: false; code: "INVALID_REQUEST" | "REQUEST_TOO_LARGE"; message: string };

const supportedRoles = new Set(["user", "assistant"]);

export function validateAiGuideRequest(value: unknown): ValidationResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return invalidRequest();
  }

  const candidate = value as Record<string, unknown>;
  if (!languages.includes(candidate.language as Language) || !Array.isArray(candidate.messages)) {
    return invalidRequest();
  }

  if (candidate.messages.length === 0 || candidate.messages.length > AI_GUIDE_LIMITS.maxMessages) {
    return candidate.messages.length > AI_GUIDE_LIMITS.maxMessages ? tooLarge() : invalidRequest();
  }

  let totalContentLength = 0;
  const messages: AiGuideMessage[] = [];

  for (const value of candidate.messages) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return invalidRequest();
    const message = value as Record<string, unknown>;
    if (!supportedRoles.has(String(message.role)) || typeof message.content !== "string") {
      return invalidRequest();
    }

    const content = message.content.trim();
    if (!content) return invalidRequest();
    if (content.length > AI_GUIDE_LIMITS.maxMessageLength) return tooLarge();

    totalContentLength += content.length;
    if (totalContentLength > AI_GUIDE_LIMITS.maxTotalContentLength) return tooLarge();
    messages.push({ role: message.role as AiGuideMessage["role"], content });
  }

  if (messages.at(-1)?.role !== "user") return invalidRequest();

  return {
    success: true,
    data: { language: candidate.language as Language, messages },
  };
}

function invalidRequest(): ValidationResult {
  return { success: false, code: "INVALID_REQUEST", message: AI_GUIDE_ERROR_MESSAGES.invalidRequest };
}

function tooLarge(): ValidationResult {
  return { success: false, code: "REQUEST_TOO_LARGE", message: AI_GUIDE_ERROR_MESSAGES.tooLarge };
}
