import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// Top-down hero: camera looks straight DOWN from +Y. up = (1, 0, 0) puts the
// nose toward the top of the page (verified: world +X maps to screen-up). The
// aircraft's topside is made to face +Y by a roll applied in JetScene.
const TOPDOWN_UP = new Vector3(0, 0, 1)
const DEFAULT_UP = new Vector3(0, 1, 0)

// Camera keyframes, one per section. The model is normalized in JetModel to a
// ~4-unit wingspan centered at origin, so these values are model-independent.
// `up` controls screen-up orientation; it's lerped (and renormalized) too.
export const CAMERA_KEYFRAMES = [
  // 0 — Hero: top-down plan view, nose pointing up the page.
  { position: new Vector3(0, 9, 0), target: new Vector3(0, 0, 0), up: TOPDOWN_UP },
  // 1 — Experience: low, behind/side. Looking up the fuselage.
  { position: new Vector3(-5.5, -1.2, 4.5), target: new Vector3(0, 0.3, 0), up: DEFAULT_UP },
  // 2 — Projects: tight, high front-quarter over the cockpit.
  { position: new Vector3(3.2, 2.6, 3.2), target: new Vector3(0, 0, -1), up: DEFAULT_UP },
  // 3 — Contact: wide pull-back, jet small in frame, drifting off-center.
  { position: new Vector3(-3, 3.5, 13), target: new Vector3(0.5, 0, 0), up: DEFAULT_UP },
]

// scrub per transition: higher = laggier/more cinematic.
const SCRUB = [2.2, 1, 1.4]

/**
 * Drives the camera along CAMERA_KEYFRAMES as the user scrolls each section.
 * Until the first scroll, an idle orbit owns the camera; once scrolling starts
 * the orbit yields and ScrollTrigger takes over.
 */
export function useScrollCamera() {
  const { camera } = useThree()
  const orbiting = useRef(true)
  const t = useRef(0)
  const lookTmp = useRef(new Vector3())
  const upTmp = useRef(new Vector3())

  // Idle hero: hold the top-down plan view, with a subtle breathing drift in
  // altitude and a slow yaw so it reads as "alive" but stays top-down.
  useFrame((_, delta) => {
    if (!orbiting.current) return
    t.current += delta
    const hero = CAMERA_KEYFRAMES[0]
    camera.position.set(0, hero.position.y + Math.sin(t.current * 0.4) * 0.25, 0)
    // Gently rock the up vector so the jet sways a few degrees around the nose axis.
    const sway = Math.sin(t.current * 0.25) * 0.06
    camera.up.set(Math.sin(sway), 0, Math.cos(sway))
    camera.lookAt(0, 0, 0)
  })

  useEffect(() => {
    const killOrbit = () => {
      orbiting.current = false
    }
    // First real scroll kills the orbit.
    window.addEventListener('wheel', killOrbit, { once: true, passive: true })
    window.addEventListener('touchmove', killOrbit, { once: true, passive: true })

    const triggers = []
    for (let i = 0; i < CAMERA_KEYFRAMES.length - 1; i++) {
      const from = CAMERA_KEYFRAMES[i]
      const to = CAMERA_KEYFRAMES[i + 1]
      const t = ScrollTrigger.create({
        trigger: `[data-section="${i}"]`,
        start: 'top top',
        end: 'bottom top',
        scrub: SCRUB[i],
        onUpdate(self) {
          if (orbiting.current) orbiting.current = false
          camera.position.lerpVectors(from.position, to.position, self.progress)
          // Lerp the up vector so the view rolls smoothly out of the top-down
          // plan view into the angled section cameras.
          upTmp.current
            .lerpVectors(from.up || DEFAULT_UP, to.up || DEFAULT_UP, self.progress)
            .normalize()
          camera.up.copy(upTmp.current)
          lookTmp.current.lerpVectors(from.target, to.target, self.progress)
          camera.lookAt(lookTmp.current)
        },
      })
      triggers.push(t)
    }

    // Recompute positions once fonts/layout settle.
    const refresh = () => ScrollTrigger.refresh()
    window.addEventListener('load', refresh)
    const id = setTimeout(refresh, 400)

    return () => {
      window.removeEventListener('wheel', killOrbit)
      window.removeEventListener('touchmove', killOrbit)
      window.removeEventListener('load', refresh)
      clearTimeout(id)
      triggers.forEach((t) => t.kill())
    }
  }, [camera])
}
