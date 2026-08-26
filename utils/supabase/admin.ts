import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "./server";

export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user && (!authError || authError.name === "AuthSessionMissingError")) redirect("/sign-in?redirectTo=%2Fadmin");
  if (authError || !user) throw new Error("Unable to verify the authenticated user.");

  const { data: membership, error: membershipError } = await supabase
    .from("admin_users")
    .select("user_id, role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (membershipError) throw new Error("Unable to verify administrator access.");
  if (!membership) redirect("/");
  return { supabase, user };
}
