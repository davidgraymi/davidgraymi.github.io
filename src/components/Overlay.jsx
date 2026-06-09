import { useEffect, useLayoutEffect, useRef, forwardRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { projects, experience, fmtRange } from '../content'

gsap.registerPlugin(ScrollTrigger)

/* ─────────────────────────────────────────────────────────────────
   Shared primitives
   The HUD aesthetic stays — but Outfit handles headings/body and
   JetBrains Mono is reserved for technical labels, tags, and codes.
   Brand colors: teal (#5EEAD4) = infra/systems, violet (#A78BFA) = AI
───────────────────────────────────────────────────────────────── */

function Brackets() {
  return (
    <>
      <span className="pointer-events-none absolute left-0 top-0 block h-3 w-3 border-l border-t border-teal/40" />
      <span className="pointer-events-none absolute right-0 top-0 block h-3 w-3 border-r border-t border-teal/40" />
      <span className="pointer-events-none absolute bottom-0 left-0 block h-3 w-3 border-b border-l border-teal/40" />
      <span className="pointer-events-none absolute bottom-0 right-0 block h-3 w-3 border-b border-r border-teal/40" />
    </>
  )
}

const HudPanel = forwardRef(({ children, className = '' }, ref) => (
  <div
    ref={ref}
    className={`relative border border-white/10 bg-[#0B0F17]/80 p-6 backdrop-blur-md ${className}`}
  >
    <Brackets />
    {children}
  </div>
))
HudPanel.displayName = 'HudPanel'

// Section label: mono code + Outfit heading side by side
function SectionLabel({ code, label }) {
  return (
    <div className="mb-5 flex items-center gap-3 border-b border-white/[0.07] pb-3">
      <span className="font-mono text-[0.5rem] tracking-[0.3em] text-teal/70">{code}</span>
      <span className="h-px flex-1 bg-white/[0.06]" />
      <span className="font-display text-[0.7rem] font-semibold tracking-[0.18em] uppercase text-white/50">
        {label}
      </span>
    </div>
  )
}

// Data row: mono for technical key/value pairs (IDs, stats, tags)
function HudRow({ label, value, accent = false, className = '' }) {
  return (
    <div
      className={`hud-row grid items-baseline font-mono text-[0.62rem] ${className}`}
      style={{ gridTemplateColumns: 'auto 1fr auto', columnGap: '0.5rem' }}
    >
      <span className="whitespace-nowrap uppercase tracking-[0.16em] text-white/40">{label}</span>
      <span
        className="min-w-0 overflow-hidden"
        style={{ borderBottom: '1px dotted rgba(94,234,212,0.12)', marginBottom: '0.12em' }}
      />
      <span className={`whitespace-nowrap tracking-[0.08em] ${accent ? 'text-teal' : 'text-white/80'}`}>
        {value}
      </span>
    </div>
  )
}

function StatusLine({ children }) {
  return (
    <div className="mt-4 flex items-center gap-1.5 border-t border-white/[0.06] pt-3">
      <span className="font-mono text-[0.5rem] tracking-[0.24em] text-teal">▸</span>
      <span className="font-mono text-[0.5rem] tracking-[0.2em] text-white/35">{children}</span>
      <span className="animate-pulse font-mono text-[0.5rem] text-teal/50">▮</span>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 0 — HERO
───────────────────────────────────────────────────────────────── */

function Hero() {
  const headingRef = useRef(null)
  const panelRef   = useRef(null)
  const taglineRef = useRef(null)

  useLayoutEffect(() => {
    const heading = headingRef.current
    const panel   = panelRef.current
    const tagline = taglineRef.current
    if (!heading || !panel || !tagline) return

    gsap.set([heading, tagline, panel], { opacity: 0 })
    gsap.set(heading, { y: 14 })
    gsap.set(tagline, { y: 8 })
    gsap.set(panel,   { y: 18 })

    const rows = panel.querySelectorAll('.hud-row')
    gsap.set(rows, { opacity: 0, x: -8 })

    const tl = gsap.timeline({ delay: 0.6 })
    tl.to(heading, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' })
      .to(tagline, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' }, '-=0.3')
      .to(panel,   { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' }, '-=0.25')
      .to(rows,    { opacity: 1, x: 0, duration: 0.25, stagger: 0.06, ease: 'power2.out' }, '-=0.2')

    return () => tl.kill()
  }, [])

  return (
    <section data-section="0" style={{ height: '200vh' }} className="relative">
      <div className="pin justify-end pb-16 px-6 md:px-16">
        <div className="flex flex-col items-end gap-5 max-w-sm ml-auto">

          {/* Name + tagline — Outfit display, the primary signal */}
          <div className="text-right">
            <h1
              ref={headingRef}
              className="font-display font-extrabold leading-none text-white"
              style={{ fontSize: 'clamp(2.2rem, 5vw, 3.2rem)', letterSpacing: '-0.02em' }}
            >
              David Gray
            </h1>
            <p
              ref={taglineRef}
              className="font-display font-light mt-2 text-white/55"
              style={{ fontSize: 'clamp(0.85rem, 1.8vw, 1.05rem)', letterSpacing: '0.01em' }}
            >
              From the metal to the model.
            </p>
          </div>

          {/* HUD data panel */}
          <HudPanel ref={panelRef} className="w-full">
            <SectionLabel code="SYS.0001" label="Identification" />
            <div className="space-y-[0.5rem]">
              <HudRow label="Role"     value="Software Engineer" />
              <HudRow label="Now"      value="Cloud Infrastructure" accent />
              <HudRow label="Building" value="ML / AI Infrastructure" />
              <HudRow label="Depth"    value="Kernels → Cloud" />
              <HudRow label="Degree"   value="M.S. CS · UIUC" />
              <HudRow label="Base"     value="Michigan / Remote" />
            </div>
            <StatusLine>Systems nominal — scroll to explore</StatusLine>
            <div className="mt-3 text-right font-mono text-[0.48rem] tracking-[0.35em] text-white/20 animate-pulse">
              ↓ SCROLL
            </div>
          </HudPanel>

        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 1 — EXPERIENCE
───────────────────────────────────────────────────────────────── */

function Experience() {
  const headingRef = useRef(null)
  const panelRef   = useRef(null)

  useEffect(() => {
    const heading = headingRef.current
    const panel   = panelRef.current
    if (!heading || !panel) return

    gsap.set([heading, panel], { opacity: 0 })
    gsap.set(heading, { x: -16 })
    gsap.set(panel,   { x: 20 })

    const entries = panel.querySelectorAll('.hud-entry')
    gsap.set(entries, { opacity: 0, y: 10 })

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '[data-section="1"]',
        start: 'top 72%',
        once: true,
      },
    })
    tl.to(heading, { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out' })
      .to(panel,   { opacity: 1, x: 0, duration: 0.45, ease: 'power2.out' }, '-=0.3')
      .to(entries, { opacity: 1, y: 0, duration: 0.25, stagger: 0.07, ease: 'power2.out' }, '-=0.2')

    return () => tl.kill()
  }, [])

  return (
    <section data-section="1" style={{ height: '120vh' }} className="relative">
      <div className="pin justify-center px-6 md:px-16">
        <div className="ml-auto w-full max-w-lg">

          {/* Section heading — Outfit, outside the panel */}
          <div ref={headingRef} className="mb-4">
            <p className="font-mono text-[0.5rem] tracking-[0.28em] text-teal/60 mb-1">
              SYS.0002
            </p>
            <h2 className="section-heading">
              The Foundation
            </h2>
            <p className="font-display text-[0.85rem] text-white/40 mt-1 font-light">
              Metal to cloud — building the depth that AI infrastructure demands.
            </p>
          </div>

          <HudPanel ref={panelRef}>
            <div className="max-h-[52vh] space-y-5 overflow-y-auto pr-1">
              {experience.map((e) => (
                <div key={e.slug} className="hud-entry border-l-2 border-teal/20 pl-4">
                  <div className="flex items-baseline justify-between gap-3 mb-1">
                    {/* Job title in Outfit */}
                    <span className="font-display font-semibold text-[0.9rem] text-white/90 leading-tight">
                      {e.title}
                    </span>
                    <span className="shrink-0 font-mono text-[0.5rem] tracking-wider text-teal/70">
                      {fmtRange(e.date, e.endDate)}
                    </span>
                  </div>
                  {/* Company in mono */}
                  <div className="font-mono text-[0.56rem] tracking-wider text-white/40 mb-2">
                    {e.company}
                  </div>
                  {/* Bullets in Outfit — prose, readable */}
                  {e.bullets.slice(0, 2).map((b, i) => (
                    <div key={i} className="flex gap-2 text-[0.78rem] font-display leading-snug text-white/50 mb-1">
                      <span className="shrink-0 text-teal/60 mt-0.5">›</span>
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <StatusLine>Career arc loaded</StatusLine>
          </HudPanel>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 2 — PROJECTS
───────────────────────────────────────────────────────────────── */

const ML_SLUGS = new Set([
  'patient-care', 'sign-language', 'handwriting', 'id3-mushroom',
  'healthcare-stay', 'tetris-ai',
])

function Projects() {
  const headingRef = useRef(null)
  const panelRef   = useRef(null)

  const personal = projects.filter((p) => p.type === 'Personal')
  const ml       = projects.filter((p) => p.type !== 'Personal')

  useEffect(() => {
    const heading = headingRef.current
    const panel   = panelRef.current
    if (!heading || !panel) return

    gsap.set([heading, panel], { opacity: 0 })
    gsap.set(heading, { x: 16 })
    gsap.set(panel,   { y: 16 })

    const items = panel.querySelectorAll('.hud-item')
    gsap.set(items, { opacity: 0, y: 8 })

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '[data-section="2"]',
        start: 'top 72%',
        once: true,
      },
    })
    tl.to(heading, { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out' })
      .to(panel,   { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' }, '-=0.3')
      .to(items,   { opacity: 1, y: 0, duration: 0.22, stagger: 0.05, ease: 'power2.out' }, '-=0.2')

    return () => tl.kill()
  }, [])

  const ProjectCard = ({ p }) => {
    const isML = ML_SLUGS.has(p.slug)
    return (
      <a
        href={p.link || p.downloads?.[0]?.url || '#'}
        target={p.link || p.downloads?.length ? '_blank' : undefined}
        rel="noreferrer"
        className="hud-item block border border-white/[0.08] p-4 transition-all duration-200 hover:border-teal/30 hover:bg-white/[0.02] group"
      >
        <div className="flex items-center justify-between mb-2">
          <span
            className={`font-mono text-[0.47rem] tracking-[0.26em] uppercase ${
              isML ? 'text-violet/70' : 'text-teal/70'
            }`}
          >
            {isML ? 'ML · AI' : p.type}
          </span>
          <span className="font-mono text-[0.47rem] tracking-wider text-white/20 opacity-0 transition-opacity group-hover:opacity-100">
            {p.link ? 'OPEN ↗' : p.downloads?.length ? 'GET ↓' : ''}
          </span>
        </div>
        <div className="font-display font-semibold text-[0.88rem] text-white/88 leading-snug mb-1.5">
          {p.title}
        </div>
        <div className="font-display text-[0.75rem] text-white/38 leading-snug line-clamp-2">
          {p.body}
        </div>
      </a>
    )
  }

  return (
    <section data-section="2" style={{ height: '120vh' }} className="relative">
      <div className="pin justify-center px-6 md:px-16">
        <div className="mr-auto w-full max-w-xl">

          <div ref={headingRef} className="mb-4">
            <p className="font-mono text-[0.5rem] tracking-[0.28em] text-violet/60 mb-1">
              SYS.0003
            </p>
            <h2 className="section-heading">
              The Proof
            </h2>
            <p className="font-display text-[0.85rem] text-white/40 mt-1 font-light">
              Live work and ML projects — where the depth becomes evidence.
            </p>
          </div>

          <HudPanel ref={panelRef}>
            {personal.length > 0 && (
              <div className="mb-4">
                <div className="font-mono text-[0.47rem] tracking-[0.26em] text-teal/50 mb-2 uppercase">
                  Live Projects
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {personal.map((p) => <ProjectCard key={p.slug} p={p} />)}
                </div>
              </div>
            )}
            {ml.length > 0 && (
              <div>
                <div className="font-mono text-[0.47rem] tracking-[0.26em] text-violet/50 mb-2 uppercase">
                  ML · AI Research
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {ml.map((p) => <ProjectCard key={p.slug} p={p} />)}
                </div>
              </div>
            )}
            <StatusLine>Evidence loaded</StatusLine>
          </HudPanel>

        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────────────
   SECTION 3 — CONTACT
───────────────────────────────────────────────────────────────── */

const SOCIALS = {
  github:   'https://github.com/davidgraymi',
  linkedin: 'https://www.linkedin.com/in/david-gray-mi',
  twitter:  'https://twitter.com/gray_dave_',
}

function Contact() {
  const headingRef = useRef(null)
  const panelRef   = useRef(null)

  useEffect(() => {
    const heading = headingRef.current
    const panel   = panelRef.current
    if (!heading || !panel) return

    gsap.set([heading, panel], { opacity: 0, scale: 0.98 })

    const rows = panel.querySelectorAll('.hud-row')
    gsap.set(rows, { opacity: 0, y: 6 })

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '[data-section="3"]',
        start: 'top 72%',
        once: true,
      },
    })
    tl.to(heading, { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out' })
      .to(panel,   { opacity: 1, scale: 1, duration: 0.45, ease: 'power2.out' }, '-=0.3')
      .to(rows,    { opacity: 1, y: 0, duration: 0.25, stagger: 0.07, ease: 'power2.out' }, '-=0.2')

    return () => tl.kill()
  }, [])

  return (
    <section data-section="3" style={{ height: '100vh' }} className="relative">
      <div className="pin items-center px-6">
        <div className="mx-auto w-full max-w-sm">

          <div ref={headingRef} className="mb-4 text-center">
            <p className="font-mono text-[0.5rem] tracking-[0.28em] text-violet/60 mb-1">
              SYS.0004
            </p>
            <h2 className="section-heading text-center">
              Let's build something.
            </h2>
            <p className="font-display text-[0.82rem] text-white/40 mt-2 font-light leading-relaxed">
              Open to cloud-infrastructure and ML-platform roles.<br />
              Cloud infra is the craft today — AI infra is the direction.
            </p>
          </div>

          <HudPanel ref={panelRef}>
            <SectionLabel code="SYS.0004" label="Contact" />
            <div className="space-y-[0.5rem]">
              <HudRow label="Email"    value="davidgraymi@gmail.com" />
              <HudRow label="GitHub"   value="/davidgraymi" />
              <HudRow label="LinkedIn" value="/in/david-gray-mi" />
              <HudRow label="X"        value="@gray_dave_" />
            </div>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/[0.06] pt-4">
              {[
                ['Email',    'mailto:davidgraymi@gmail.com', false],
                ['GitHub',   SOCIALS.github,                 true],
                ['LinkedIn', SOCIALS.linkedin,               true],
                ['X',        SOCIALS.twitter,                true],
                ['Resume',   '/files/Resume.docx',           false],
              ].map(([label, href, ext]) => (
                <a
                  key={label}
                  href={href}
                  target={ext ? '_blank' : undefined}
                  rel={ext ? 'noreferrer' : undefined}
                  className="font-display font-semibold text-[0.8rem] text-white/50 transition-colors hover:text-teal"
                >
                  {label}
                </a>
              ))}
            </div>
            <StatusLine>Signal open</StatusLine>
            <div className="mt-2 text-center font-mono text-[0.44rem] tracking-[0.2em] text-white/15">
              © {new Date().getFullYear()} DAVID GRAY · FROM THE METAL TO THE MODEL
            </div>
          </HudPanel>

        </div>
      </div>
    </section>
  )
}

/* ── Root ──────────────────────────────────────────────────────── */

export default function Overlay() {
  return (
    <div className="relative z-10">
      <Hero />
      <Experience />
      <Projects />
      <Contact />
    </div>
  )
}
