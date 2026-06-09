import { useEffect } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import gsap from 'gsap'

gsap.registerPlugin(ScrollTrigger)

/**
 * GradientArc — scroll-driven ambient background glow.
 *
 * The canvas bg is already handled by Three.js (setClearColor).
 * This layer sits above the canvas and below the grid/content,
 * providing a radial glow that shifts from teal (hero / metal)
 * to violet (projects–contact / model) as the user scrolls.
 *
 * Implementation: two CSS custom properties on :root are tweened
 * by GSAP scrub. The .gradient-arc div renders them as radial
 * gradients defined in index.css.
 *
 * Values are chosen to be subtle — the glow is atmosphere, not paint.
 * Max teal alpha: 0.09 (felt at hero)
 * Max violet alpha: 0.07 (felt at contact)
 */

// Total page sections — used to compute scroll milestones.
// These match the data-section indices in Overlay.jsx.
const STOPS = [
  // [scrollProgress 0-1, tealAlpha, violetAlpha]
  [0.00, 0.09, 0.00],  // Hero: strong teal top glow, no violet
  [0.30, 0.05, 0.02],  // Experience: teal fades, violet hints
  [0.60, 0.02, 0.06],  // Projects: mostly violet
  [1.00, 0.00, 0.07],  // Contact: full violet, teal gone
]

function lerp(a, b, t) {
  return a + (b - a) * t
}

function getValues(progress) {
  // Find which two stops we're between
  let i = 0
  while (i < STOPS.length - 2 && progress > STOPS[i + 1][0]) i++
  const [p0, t0, v0] = STOPS[i]
  const [p1, t1, v1] = STOPS[i + 1]
  const frac = p1 === p0 ? 0 : (progress - p0) / (p1 - p0)
  return {
    teal: lerp(t0, t1, frac),
    violet: lerp(v0, v1, frac),
  }
}

export default function GradientArc() {
  useEffect(() => {
    const root = document.documentElement
    const proxy = { progress: 0 }

    // Apply initial values immediately
    const apply = () => {
      const { teal, violet } = getValues(proxy.progress)
      root.style.setProperty('--glow-teal-alpha', teal.toFixed(4))
      root.style.setProperty('--glow-violet-alpha', violet.toFixed(4))
    }
    apply()

    // Also update the Three.js canvas clear color by finding the canvas
    // and using a data attribute the JetScene hook can read.
    // (Actual canvas bg is handled separately in JetScene via the arc data.)

    const trigger = ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate(self) {
        proxy.progress = self.progress
        apply()
      },
    })

    return () => trigger.kill()
  }, [])

  return <div className="gradient-arc" aria-hidden="true" />
}
