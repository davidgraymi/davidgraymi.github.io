import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// Camera keyframes, one per section. The model is normalized in JetModel to a
// ~4-unit wingspan centered at origin, so these values are model-independent.
export const CAMERA_KEYFRAMES = [
  // 0 — Hero: wide, slightly above. Idle orbit plays here before scroll.
  { position: new Vector3(0, 1.4, 8), target: new Vector3(0, 0, 0) },
  // 1 — Experience: low, behind/side. Looking up the fuselage.
  { position: new Vector3(-5.5, -1.2, 4.5), target: new Vector3(0, 0.3, 0) },
  // 2 — Projects: tight, high front-quarter over the cockpit.
  { position: new Vector3(3.2, 2.6, 3.2), target: new Vector3(0, 0, -1) },
  // 3 — Contact: wide pull-back, jet small in frame, drifting off-center.
  { position: new Vector3(-3, 3.5, 13), target: new Vector3(0.5, 0, 0) },
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
  const angle = useRef(0)
  const lookTmp = useRef(new Vector3())

  // Idle cinematic orbit on the hero, before any scroll input.
  useFrame((_, delta) => {
    if (!orbiting.current) return
    angle.current += delta * 0.16
    const r = 8
    camera.position.set(
      Math.sin(angle.current) * r,
      1.4 + Math.sin(angle.current * 0.5) * 0.4,
      Math.cos(angle.current) * r,
    )
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
