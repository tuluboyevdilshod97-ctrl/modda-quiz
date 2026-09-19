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

Hero rasmi (to'liq to'rtburchak)
- Bosh sahifa tepasidagi hero bloki ekran bo'ylab butun kenglik va balandlikni (`min-height: 100svh`) egallaydi — chekkasi, g'ildiragi yo'q, to'rtburchak shaklida.
- Rasm fayli: `public/images/hero.jpg` (1672×941). Uni almashtirsangiz saytga avtomatik chiqadi.
- Rasm `object-fit: cover` bilan hero maydonini to'liq to'ldiradi: nisbat buzilmaydi, ortiqcha qismi qirqiladi.
- Matn o'qilishi uchun rasm ustiga yashil gradient qatlam (`from-[#0E2B21]/95 → to-[#1E5B44]/70`) qo'yilgan.
- Kod: `components/Header.tsx` (`imageSrc` prop orqali boshqa rasm berish mumkin) va `styles/globals.css` (`.hero`, `.hero-image`).

