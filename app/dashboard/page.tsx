import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { SiteNavigation } from "../components/site-navigation";
import { DashboardContent } from "./dashboard-content";

export const metadata: Metadata = {
  title: "Dashboard | TourMate AI",
  description: "Manage your TourMate AI trips, favourites, profile, and plan.",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user && (!authError || authError.name === "AuthSessionMissingError")) {
    redirect("/sign-in?redirectTo=%2Fdashboard");
  }

  if (authError || !user) {
    throw new Error("Unable to verify the authenticated user.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, plan")
    .eq("id", user.id)
    .single();

  if (profileError) {
    throw new Error("Unable to load the authenticated user's profile.");
  }

  const fullName = profile.full_name?.trim() ?? "";
  const email = user.email ?? "Email unavailable";
  const greetingName = fullName ? fullName.split(/\s+/)[0] : email;

  return (
    <div className="site-shell dashboard-page">
      <SiteNavigation headerClassName="dashboard-header" />
      <DashboardContent
        fullName={fullName}
        email={email}
        greetingName={greetingName}
        plan={profile.plan}
      />
    </div>
  );
}
