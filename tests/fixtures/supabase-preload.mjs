// Loaded ONLY by the Playwright server command, never by application entrypoints.
// All Supabase HTTP traffic in this process is intercepted, including writes.
import { user, token, profile, saved } from './traveller.mjs';
const realFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const request = new Request(input, init);
  const url = new URL(request.url);
  if (!url.hostname.endsWith('.supabase.co')) return realFetch(input, init);
  if (request.headers.get('authorization') !== `Bearer ${token}`) return Response.json({ message: 'Visual fixture requires its synthetic account' }, { status: 401 });
  if (request.method !== 'GET') return Response.json({ message: 'Server fixture is read-only' }, { status: 403 });
  if (url.pathname === '/auth/v1/user') return Response.json(user);
  if (url.pathname === '/rest/v1/profiles') return Response.json(profile);
  if (url.pathname === '/rest/v1/favourites') return Response.json(saved);
  if (url.pathname === '/rest/v1/saved_trips') return Response.json([]);
  return Response.json({ message: 'Not provided by visual fixture' }, { status: 404 });
};
