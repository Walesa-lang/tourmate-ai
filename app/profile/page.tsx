import { SiteNavigation } from "@/app/components/site-navigation";
import { ProfileBuilder } from "./profile-builder";

export const metadata = { title: "Your travel profile | TourMate AI" };
export default function ProfilePage() {
  return <div className="site-shell dashboard-page"><SiteNavigation headerClassName="dashboard-header" /><main className="container profile-main"><h1>Your travel profile</h1><p>Share only what helps your trip. Optional answers can be skipped, edited or deleted.</p><ProfileBuilder /></main></div>;
}
