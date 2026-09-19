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
- Sahifa "LEGAL SYSTEM [V2.4]" uslubida: krem fon, sariq logo, jigarrang (brand) aksent.
- Navbar: `components/Header.tsx` — sariq "m" logo, MODDA wordmark, monospace badge, menyu tugmasi.

Hero rasmi — TO'LIQ TO'RTBURCHAK, sahifani to'ldiradi
- Hero bloki (`hero-rect`) butun ekran kengligini va navbar ostidagi butun balandlikni egallaydi: `min-height: calc(100svh - 4rem)`.
- Radius (g'ildirak), chekka va tashqi bo'shliq YO'Q — rasm to'g'ri to'rtburchak bo'lib sahifani to'ldirib turadi.
- Rasm fayli: `public/images/hero.jpg` (sud zali). Uni almashtirsangiz saytga avtomatik chiqadi; yoki `<Header imageSrc="..." />` prop orqali boshqa manzil bering.
- Rasm `object-fit: cover` bilan maydonni to'liq to'ldiradi: nisbat buzilmaydi, ortiqcha qismi qirqiladi.
- Matn o'qilishi uchun chap tomondan qora gradient qatlam qo'yilgan.
- Kod: `components/Header.tsx` va `styles/globals.css` (`.hero-rect`, `.hero-image`).

Bloklar
- "[02] MAVZULASHTIRILGAN BLOKLAR" bo'limi `data/questions.json` dagi kategoriyalardan avtomatik chiziladi; kartani bossangiz test boshlanadi.
