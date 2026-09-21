import "server-only";
import { createClient } from "@/utils/supabase/server";
import { permittedContext, type TravelProfile } from "@/utils/profile";
import { demoProvider } from "./service";
import type { AiGuideRequest } from "./contracts";
import type { AssistantInput } from "./conversation";

export async function respondWithContext(input: AiGuideRequest, request: Request) {
  const context: AssistantInput = { ...input };
  if (request.headers.has("cookie")) {
    try {
      const db = await createClient();
      const { data: { user } } = await db.auth.getUser();
      if (user) {
        context.userId = user.id;
        const { data, error } = await db.from("profiles").select("travel_profile").eq("id", user.id).single();
        if (!error && data) context.permittedProfile = permittedContext(data.travel_profile as TravelProfile);
      }
    } catch {
      // Fail closed on personalisation; the public demo remains available.
    }
  }
  return demoProvider.respond(context);
}
