import { useEffect } from 'react'
import { motion, useAnimation } from 'framer-motion'

type Props = {
  palette?: 'green' | 'vivid'
}

export default function Header({ palette = 'green' }: Props) {
  const controls = useAnimation()
  useEffect(() => {
    controls.start((i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.12, duration: 0.45, ease: 'easeOut' }
    }))
  }, [controls])

  const palettes: any = {
    vivid: {
      bg: 'bg-gradient-to-br from-accent1 to-accent2',
      watermark: 'opacity-10 fill-white'
    },
    green: {
      bg: 'bg-gradient-to-br from-[#123328] to-[#1E5B44]',
      watermark: 'opacity-10 fill-white'
    }
  }

  const p = palettes[palette]

  return (
    <header className={`relative overflow-hidden ${p.bg} text-white rounded-b-3xl`}>
      <svg
        className="absolute right-[-4rem] top-[-3rem] w-48 h-48 transform rotate-[12deg] pointer-events-none"
        viewBox="0 0 100 100"
        aria-hidden
      >
        <g stroke="none" className={p.watermark}>
          <path d="M16 22 C25 16 34 16 43 22 L43 42 C34 36 25 36 16 42 Z" />
          <circle cx="72" cy="28" r="18" />
        </g>
      </svg>

      <div className="max-w-4xl mx-auto px-6 py-8 sm:py-10 lg:py-14 relative z-10">
        <div className="flex items-center justify-between gap-4">
          <motion.div custom={0} initial={{ opacity: 0, y: 8 }} animate={controls} className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/12 flex items-center justify-center text-2xl font-extrabold ring-1 ring-white/10">
              M
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-white/80">Xush kelibsiz</div>
              <div className="text-xl sm:text-2xl font-bold leading-tight">MODDA — huquq fanidan testlar</div>
              <div className="text-sm text-white/80 mt-0.5">Tez va ishonchli testlar, natijalarni tahlil qilish</div>
            </div>
          </motion.div>

          <motion.div custom={1} initial={{ opacity: 0, y: 8 }} animate={controls} className="hidden sm:flex gap-3">
            <div className="bg-white/10 border border-white/8 rounded-xl px-4 py-2 flex flex-col items-center min-w-[84px]">
              <div className="text-sm font-bold">0</div>
              <div className="text-xs text-white/70">Ball</div>
            </div>
            <div className="bg-white/10 border border-white/8 rounded-xl px-4 py-2 flex flex-col items-center min-w-[84px]">
              <div className="text-sm font-bold">—</div>
              <div className="text-xs text-white/70">KUN</div>
            </div>
          </motion.div>
        </div>

        <motion.div custom={2} initial={{ opacity: 0, y: 8 }} animate={controls} className="mt-6">
          <div className="bg-white/8 backdrop-blur-sm border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold">Kunlik maqsad</div>
              <div className="text-xs text-white/80 mt-1">0 / 20 savol — davom eting</div>
            </div>
            <div className="w-48">
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-white" style={{ width: '0%' }} />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="pointer-events-none">
        <svg className="w-full block" viewBox="0 0 1440 80" preserveAspectRatio="none">
          <path d="M0 30 C360 100 1080 -40 1440 30 L1440 80 L0 80 Z" className="fill-white/6"></path>
        </svg>
      </div>
    </header>
  )
}
