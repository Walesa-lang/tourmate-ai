import Link from "next/link";
import { requireAdmin } from "@/utils/supabase/admin";
import { AdminHeader } from "../admin-header";

export default async function AssistantOperations() {
  const { supabase, user } = await requireAdmin();
  const { data, error } = await supabase.rpc("assistant_usage_summary", {});
  return <div className="site-shell admin-page"><AdminHeader email={user.email} /><main className="admin-main"><div className="container admin-content">
    <Link href="/admin">Back to partner operations</Link><h1>Assistant pilot usage</h1>
    <p>Last 14 days. Provider costs are estimates in USD, not invoices. Unknown costs are not treated as zero. No conversation text is collected.</p>
    {error ? <p role="alert">Usage reporting is unavailable. Check that the reviewed pilot migration is installed.</p> : !data?.length ? <p>No recorded pilot requests.</p> : data.map((row) => <section className="admin-application-card" key={`${row.provider}-${row.state}`}>
      <h2>{row.provider}: {row.state}</h2><p>{row.requests} requests · Average latency {row.average_latency_ms} ms</p>
      <p>Estimated provider cost: {row.estimated_cost_usd === null ? "Unknown" : `$${Number(row.estimated_cost_usd).toFixed(6)}`} · {row.unknown_cost_requests} requests with unknown cost</p>
    </section>)}
  </div></main></div>;
}
