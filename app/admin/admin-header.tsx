import Link from "next/link";
import { signOutAdmin } from "./actions";

export function AdminHeader({ email }: { email: string | undefined }) {
  return <header className="admin-header"><div className="container admin-nav"><Link className="brand" href="/admin">TourMate AI <span>Admin</span></Link><div className="admin-account"><span>{email}</span><form action={signOutAdmin}><button className="admin-logout" type="submit">Sign out</button></form></div></div></header>;
}
