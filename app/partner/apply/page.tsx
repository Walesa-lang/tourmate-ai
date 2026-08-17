import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { SiteNavigation } from "@/app/components/site-navigation";
import { PartnerApplicationForm } from "./partner-application-form";

export const metadata: Metadata = { title: "Partner Application | TourMate AI", description: "Apply to list your travel business with TourMate AI." };

export default async function PartnerApplyPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user && (!authError || authError.name === "AuthSessionMissingError")) redirect("/sign-in?redirectTo=%2Fpartner%2Fapply");
  if (authError || !user) throw new Error("Unable to verify the authenticated user.");

  const { data: business, error } = await supabase.from("businesses").select("*").eq("owner_id", user.id).maybeSingle();
  if (error) throw new Error("Unable to load your partner application.");
  const { edit } = await searchParams;
  if (business && (business.status !== "pending" || edit !== "1")) redirect("/partner/dashboard");

  return <div className="site-shell partner-page"><SiteNavigation headerClassName="dashboard-header" /><main className="partner-main"><section className="partner-hero"><div className="container"><p className="partner-eyebrow">Partner with TourMate AI</p><h1>{business ? "Edit your application" : "Grow your business with travellers"}</h1><p>{business ? "Keep your pending application accurate and up to date." : "Tell us about your business. Our team will review your application before it can become a TourMate AI partner."}</p></div></section><div className="container partner-form-wrap"><PartnerApplicationForm ownerId={user.id} initialBusiness={business} /></div></main></div>;
}
