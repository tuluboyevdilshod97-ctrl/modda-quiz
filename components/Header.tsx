/**
 * Sayt tepasi: navbar + to'liq to'rtburchak hero.
 *
 * HERO — foydalanuvchi talabiga muvofiq:
 *  - rasm TO'RTBURCHAK shaklida (radius/checca yo'q),
 *  - sahifani to'liq to'ldirib turadi (butun kenglik + navbar ostidagi butun ekran balandligi),
 *  - object-fit: cover tufayli har qanday ekranda nisbat buzilmaydi.
 * Rasmni almashtirish uchun public/images/hero.jpg faylini almashtiring
 * yoki `imageSrc` prop orqali boshqa manzil bering.
 */
type Props = {
  imageSrc?: string
}

export default function Header({ imageSrc = '/images/hero.jpg' }: Props) {
  return (
    <>
      {/* ===== Navbar ===== */}
      <nav className="sticky top-0 z-40 h-16 w-full border-b border-line bg-cream">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-logo text-xl font-black text-ink shadow-sm">
              m
            </div>
            <span className="text-xl font-black tracking-tight">MODDA</span>
            <span className="ml-2 hidden rounded-md border border-line bg-white px-2 py-1 font-mono text-[10px] tracking-widest text-gray-500 sm:inline-block">
              LEGAL SYSTEM [V2.4]
            </span>
          </div>
          <button
            aria-label="Menyu"
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-lg border border-line bg-white"
          >
            <span className="h-0.5 w-5 bg-ink" />
            <span className="h-0.5 w-5 bg-ink" />
            <span className="h-0.5 w-5 bg-ink" />
          </button>
        </div>
      </nav>

      {/* ===== Hero: to'liq to'rtburchak, sahifani to'ldiradi ===== */}
      <section className="hero-rect relative w-full overflow-hidden bg-ink">
        <img
          src={imageSrc}
          alt="Sud majlislar zali"
          className="hero-image absolute inset-0 h-full w-full"
        />
        {/* matn o'qilishi uchun chap tomondan qoraytiruvchi qatlam */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-black/10"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent"
        />

        <div className="relative z-10 mx-auto flex h-full min-h-[inherit] max-w-6xl flex-col justify-center px-6 py-16 sm:px-10">
          <h1 className="max-w-3xl text-5xl font-black uppercase leading-[0.95] tracking-tight text-white sm:text-7xl">
            Huquq
            <br />
            fanidan
            <br />
            <span className="text-gold">Tayyorgarlik.</span>
          </h1>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-white/90 sm:text-base">
            Yangi tahrirdagi Konstitutsiya (2023), yangi Mehnat kodeksi, Fuqarolik, Oila va
            Jinoyat qonunchiligi bo&apos;yicha tuzilgan eng so&apos;nggi test savollari.
          </p>
        </div>
      </section>
    </>
  )
}
