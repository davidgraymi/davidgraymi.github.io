import JetScene from './components/JetScene'
import Overlay from './components/Overlay'
import Loader from './components/Loader'
import { useLenis } from './hooks/useLenis'

function HudFrame() {
  // Fixed cockpit-style frame on top of everything (non-interactive).
  return (
    <div className="pointer-events-none fixed inset-0 z-20">
      <div className="absolute left-6 top-6 font-mono text-[0.6rem] tracking-[0.3em] text-ice/70">
        DMG // PORTFOLIO
      </div>
      <div className="absolute right-6 top-6 font-mono text-[0.6rem] tracking-[0.3em] text-white/40">
        F-22 · RAPTOR
      </div>
      <div className="absolute bottom-6 left-6 right-6 hairline" />
    </div>
  )
}

export default function App() {
  useLenis()
  return (
    <div className="scanlines">
      <Loader />
      <JetScene />
      <HudFrame />
      <Overlay />
    </div>
  )
}
