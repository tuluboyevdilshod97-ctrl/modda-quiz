import { useState } from 'react'
import Quiz from '../components/Quiz'
import Header from '../components/Header'
import data from '../data/questions.json'

/* Kichik inline ikonkalar (SVG) */
const Icon = {
  clock: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  book: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z" />
      <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />
    </svg>
  ),
  history: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  medal: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="9" r="5" />
      <path d="M9 13.5 7 22l5-3 5 3-2-8.5" />
    </svg>
  ),
  scales: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v18" />
      <path d="M8 21h8" />
      <path d="M4 7h16" />
      <path d="M6 7l-3 6a3.5 3.5 0 0 0 6 0L6 7Z" />
      <path d="M18 7l-3 6a3.5 3.5 0 0 0 6 0l-3-6Z" />
    </svg>
  ),
  bank: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9l9-6 9 6" />
      <path d="M4 9h16" />
      <path d="M6 9v9M10 9v9M14 9v9M18 9v9" />
      <path d="M3 21h18" />
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-7" />
      <path d="M22 20H2" />
    </svg>
  )
}

export default function Home() {
  const [categoryKey, setCategoryKey] = useState<string | null>(null)
  const categories: any = (data as any).categories
  const keys = Object.keys(categories)

  if (categoryKey) {
    return (
      <Quiz
        categoryKey={categoryKey}
        data={categories[categoryKey]}
        onExit={() => setCategoryKey(null)}
      />
    )
  }

  return (
    <>
      <Header />

      {/* ===== CTA tugmalari ===== */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button
            onClick={() => document.getElementById('bloklar')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex items-center gap-2 rounded-xl bg-brand px-6 py-3.5 text-sm font-bold tracking-wide text-white shadow-md transition hover:brightness-110"
          >
            {Icon.clock}
            TESTNI BOSHLASH
          </button>
          <button className="flex items-center gap-2 rounded-xl border border-line bg-white px-6 py-3.5 text-sm font-bold tracking-wide text-ink transition hover:bg-cream">
            {Icon.book}
            MANBALAR
          </button>
          <button className="flex items-center gap-2 rounded-xl border border-line bg-white px-6 py-3.5 text-sm font-bold tracking-wide text-ink transition hover:bg-cream">
            {Icon.history}
            XRONOLOGIYA
          </button>
          <button className="flex items-center gap-2 rounded-xl border border-line bg-white px-6 py-3.5 text-sm font-bold tracking-wide text-ink transition hover:bg-cream">
            {Icon.medal}
            MILLIY SERTIFIKAT
          </button>
        </div>

        {/* ===== [02] Mavzulashtirilgan bloklar ===== */}
        <section id="bloklar" className="pb-24 pt-14">
          <div className="mb-6 font-mono text-xs tracking-[0.2em] text-gray-500">
            [02] MAVZULASHTIRILGAN BLOKLAR
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {keys.map((k, i) => (
              <button
                key={k}
                onClick={() => setCategoryKey(k)}
                className="rounded-xl border border-line bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-[#EFE7D6] px-3 py-1 text-[11px] font-bold tracking-wide text-[#6B5320]">
                    {categories[k].questions.length} SAVOL
                  </span>
                  <span className="font-mono text-[10px] tracking-widest text-gray-400">
                    BLOK 0{i + 1}
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-2.5">
                  <span className="text-brand">{i % 2 === 0 ? Icon.scales : Icon.bank}</span>
                  <h3 className="text-lg font-extrabold tracking-tight">{categories[k].title}</h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{categories[k].desc}</p>
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* ===== O'ng tomonda suzuvchi tugma ===== */}
      <button
        aria-label="Statistika"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed right-0 top-1/2 z-40 -translate-y-1/2 rounded-l-xl bg-brand p-3 text-white shadow-lg transition hover:brightness-110"
      >
        {Icon.chart}
      </button>
    </>
  )
}
