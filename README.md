# MODDA — Starter

This repository contains a starter Next.js app for the MODDA quiz project.

Stack:
- Next.js
- Tailwind CSS
- Framer Motion (for animations)
- Supabase (DB + Auth) — import script included

Quickstart
1. Clone repo
2. npm install
3. Create `.env.local` with:

```
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=some_long_secret
```

4. Run dev server:

```
npm run dev
```

Supabase import
- Use `schema.sql` to create tables in Supabase SQL editor.
- Use `import-to-supabase.js` script with `SUPABASE_URL` and `SUPABASE_KEY` env vars to import `data/questions.json`.

Design notes
- Color palette: vivid (purple + blue) as requested.
- No logo provided — placeholder used.

