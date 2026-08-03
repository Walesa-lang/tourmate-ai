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
  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user && (!error || error.name === "AuthSessionMissingError")) {
    redirect("/sign-in?redirectTo=%2Fdashboard");
  }

  if (error || !user) {
    throw new Error("Unable to verify the authenticated user.");
  }

  const fullName = typeof user.user_metadata.full_name === "string"
    ? user.user_metadata.full_name.trim()
    : "";
  const email = user.email ?? "Email unavailable";
  const greetingName = fullName ? fullName.split(/\s+/)[0] : email;

  return (
    <div className="site-shell dashboard-page">
      <SiteNavigation headerClassName="dashboard-header" />
      <DashboardContent fullName={fullName} email={email} greetingName={greetingName} />
    </div>
  );
}
