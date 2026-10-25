# StayMpumalanga — Next.js + Supabase

A production-oriented V1 foundation for a student accommodation marketplace.

## Stack
- Next.js App Router + TypeScript
- Supabase Auth + PostgreSQL + Row Level Security
- Leaflet + OpenStreetMap for maps
- Responsive CSS UI

## Run
1. Copy `.env.example` to `.env.local`.
2. Create a Supabase project.
3. Put the Project URL and Publishable Key in `.env.local`.
4. Run `supabase/schema.sql` in Supabase SQL Editor.
5. `npm install`
6. `npm run dev`

## Important
The UI currently contains a small mock catalogue so the app can be explored before the database is populated. The schema is ready for real listings, profiles, applications, favourites and reviews.

For production, replace the mock catalogue queries with Supabase server queries and review every RLS policy. Never put a Supabase secret/service-role key in browser code.

OpenStreetMap's standard tile service is suitable for development/light use but its tile usage policy must be followed; move to a suitable hosted tile provider before heavy production traffic.
