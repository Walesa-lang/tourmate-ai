"use client";

export default function AdminError({ reset }: { reset: () => void }) {
  return <div className="site-shell admin-page"><main className="admin-main"><section className="container admin-error" role="alert"><p>Admin area</p><h1>We could not load the applications</h1><span>Please try again. No application data was changed.</span><button className="button" type="button" onClick={reset}>Try again</button></section></main></div>;
}
