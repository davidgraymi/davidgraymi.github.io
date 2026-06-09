import JetScene from './components/JetScene'
import Overlay from './components/Overlay'
import Loader from './components/Loader'
import GradientArc from './components/GradientArc'
import { useLenis } from './hooks/useLenis'

function HudFrame() {
  return (
    <div className="pointer-events-none fixed inset-0 z-20">
      {/* Top-left: identity mark — Outfit display + mono accent */}
      <div className="absolute left-6 top-5 flex items-baseline gap-2">
        <span className="font-display text-[0.72rem] font-semibold tracking-wide text-white/70">
          DG
        </span>
        <span className="font-mono text-[0.46rem] tracking-[0.28em] text-teal/50">
          // PORTFOLIO
        </span>
      </div>
      {/* Top-right: subtle airframe callout — toned down */}
      <div className="absolute right-6 top-5 font-mono text-[0.46rem] tracking-[0.28em] text-white/20">
        F-22A · RAPTOR
      </div>
      {/* Top-center: minimal reticle */}
      <div className="absolute left-1/2 top-0 flex -translate-x-1/2 flex-col items-center gap-0.5 pt-3">
        <div className="h-4 w-px bg-teal/10" />
        <div className="font-mono text-[0.5rem] text-teal/15">◉</div>
      </div>
      {/* Bottom strip */}
      <div className="absolute bottom-0 left-0 right-0">
        <div className="hairline mx-6" />
        <div className="flex items-center justify-between px-6 py-2">
          <span className="font-mono text-[0.44rem] tracking-[0.28em] text-white/15">ACTIVE</span>
          <span className="font-mono text-[0.44rem] tracking-[0.5em] text-teal/15">· · · · ·</span>
          <span className="font-mono text-[0.44rem] tracking-[0.28em] text-white/15">SECURE</span>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  useLenis()
  return (
    <div className="scanlines">
      <Loader />
      <JetScene />
      <GradientArc />
      <div className="blueprint-grid" />
      <HudFrame />
      <Overlay />
    </div>
  )
}
