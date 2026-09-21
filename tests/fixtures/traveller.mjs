// Synthetic visual-test identity. Never accepted by a real Supabase service.
export const user = { id: '00000000-0000-4000-8000-000000000099', email: 'traveller@example.test', aud: 'authenticated', role: 'authenticated', user_metadata: { full_name: 'Alexandria-Namibiana Verylongtravellername' }, app_metadata: { provider: 'email' }, created_at: '2026-01-01T00:00:00Z' };
const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
export const token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: user.id, aud: 'authenticated', role: 'authenticated', exp: 4102444800 })}.visual-fixture-not-a-signature`;
export const session = { access_token: token, refresh_token: 'visual-fixture-not-a-refresh-token', token_type: 'bearer', expires_in: 3600, expires_at: 4102444800, user };
export const saved = [
  { id: 'fixture-stay', item_type: 'hotel', item_id: 'windhoek-garden-hotel', item_snapshot: { name: 'Windhoek Garden Hotel', location: 'Windhoek', category: 'Hotel', reason: 'Selected from an Assistant catalogue recommendation.' }, created_at: '2026-09-20T12:00:00Z' },
  { id: 'fixture-activity', item_type: 'attraction', item_id: 'etosha-wildlife-safari', item_snapshot: { name: 'Etosha Wildlife Safari', location: 'Etosha National Park', category: 'Wildlife and Safaris', day: 2, reason: 'Selected from an Assistant itinerary proposal.' }, created_at: '2026-09-20T12:00:00Z' },
];
export const profile = { full_name: user.user_metadata.full_name, plan: 'free', travel_profile: { completed: ['account', 'trip'], trip: { area: 'Windhoek' }, food: { allergies: 'PRIVATE-FOOD-FIXTURE' } } };
