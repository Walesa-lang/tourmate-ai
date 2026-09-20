import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { SiteNavigation } from "../components/site-navigation";
import { DashboardContent } from "./dashboard-content";

export const metadata: Metadata = {
  title: "Profile & saved places | TourMate AI",
  description: "View your TourMate AI profile, saved places, and previously saved trip notes.",
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

  const { data: savedTrips, error: savedTripsError } = await supabase
    .from("saved_trips")
    .select("id, title, destination, start_date, end_date, travellers, budget, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (savedTripsError) {
    throw new Error("Unable to load the authenticated user's saved trips.");
  }

  const { data: favourites, error: favouritesError } = await supabase
    .from("favourites")
    .select("id, item_type, item_id, item_snapshot, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (favouritesError) {
    throw new Error("Unable to load the authenticated user's favourites.");
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
        savedTrips={savedTrips}
        favourites={favourites}
      />
    </div>
  );
}
