import { projects, experience, fmtRange } from '../content'

const SOCIALS = {
  github: 'https://github.com/davidgraymi',
  linkedin: 'https://www.linkedin.com/in/david-gray-mi',
  twitter: 'https://twitter.com/gray_dave_',
}

function SectionTag({ index, label }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="font-mono text-xs text-ice">
        {String(index).padStart(2, '0')}
      </span>
      <span className="h-px w-8 bg-ice/50" />
      <span className="tag">{label}</span>
    </div>
  )
}

/* 0 — HERO */
function Hero() {
  return (
    <section data-section="0" style={{ height: '200vh' }} className="relative">
      <div className="pin px-6 md:px-16">
        <div className="max-w-3xl">
          <SectionTag index={0} label="From the metal to the model" />
          <h1 className="font-display text-6xl font-black leading-[0.95] tracking-tight md:text-8xl">
            DAVID
            <br />
            GRAY
          </h1>
          <p className="mt-6 max-w-xl font-mono text-sm leading-relaxed text-white/70 md:text-base">
            I build software at the bottom of the stack — kernels, schedulers and
            real-time control on bare metal — and I'm climbing toward the top of it:
            the data pipelines and models that make machines intelligent.
          </p>
          <p className="mt-4 font-mono text-xs text-white/40">
            Embedded &amp; weapons systems engineer · MS Computer Science, UIUC
          </p>
          <div className="mt-10 animate-pulse font-mono text-[0.7rem] tracking-[0.3em] text-ice">
            SCROLL ↓
          </div>
        </div>
      </div>
    </section>
  )
}

/* 1 — EXPERIENCE ("Jets") */
function Experience() {
  return (
    <section data-section="1" style={{ height: '120vh' }} className="relative">
      <div className="pin px-6 md:px-16">
        <div className="ml-auto max-w-xl">
          <SectionTag index={1} label="The metal" />
          <h2 className="font-display text-3xl font-extrabold md:text-5xl">
            Real-time at the airframe
          </h2>
          <p className="mt-4 font-mono text-xs leading-relaxed text-white/60 md:text-sm">
            Years spent where latency is measured in microseconds and a missed
            deadline isn't a dropped frame. This is the foundation everything else
            is built on.
          </p>
          <div className="mt-8 max-h-[46vh] space-y-5 overflow-y-auto pr-2">
            {experience.map((e) => (
              <div key={e.slug} className="border-l border-ice/30 pl-4">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <h3 className="font-display text-base font-bold text-white md:text-lg">
                    {e.title}
                  </h3>
                  <span className="font-mono text-[0.65rem] text-ice/80">
                    {fmtRange(e.date, e.endDate)}
                  </span>
                </div>
                <div className="font-mono text-xs text-white/50">{e.company}</div>
                {e.bullets.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {e.bullets.slice(0, 3).map((b, i) => (
                      <li
                        key={i}
                        className="font-mono text-[0.7rem] leading-snug text-white/55 before:mr-2 before:text-ember before:content-['▸']"
                      >
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* 2 — PROJECTS ("Missiles") */
function Projects() {
  return (
    <section data-section="2" style={{ height: '120vh' }} className="relative">
      <div className="pin px-6 md:px-16">
        <div className="max-w-2xl">
          <SectionTag index={2} label="The model" />
          <h2 className="font-display text-3xl font-extrabold md:text-5xl">
            Toward intelligence
          </h2>
          <p className="mt-4 max-w-lg font-mono text-xs leading-relaxed text-white/60 md:text-sm">
            ML, NLP and full-stack work — where the low-level instinct meets models
            that learn. A 98.8%-accurate gesture classifier, embedding-based triage,
            and tools I actually ship.
          </p>
          <div className="mt-8 grid max-h-[46vh] grid-cols-1 gap-3 overflow-y-auto pr-2 sm:grid-cols-2">
            {projects.map((p) => (
              <a
                key={p.slug}
                href={p.link || p.downloads?.[0]?.url || '#'}
                target={p.link || p.downloads?.length ? '_blank' : undefined}
                rel="noreferrer"
                className="group block border border-white/10 bg-white/[0.02] p-4 backdrop-blur-sm transition-colors hover:border-ice/60"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[0.6rem] uppercase tracking-wider text-ember">
                    {p.type}
                  </span>
                  <span className="font-mono text-[0.6rem] text-ice opacity-0 transition-opacity group-hover:opacity-100">
                    {p.link ? 'OPEN ↗' : p.downloads?.length ? 'GET ↓' : ''}
                  </span>
                </div>
                <h3 className="mt-1 font-display text-sm font-bold text-white">
                  {p.title}
                </h3>
                <p className="mt-1 line-clamp-3 font-mono text-[0.68rem] leading-snug text-white/50">
                  {p.body}
                </p>
                {p.downloads?.length > 0 && (
                  <div className="mt-2 flex gap-2">
                    {p.downloads.map((d) => (
                      <span
                        key={d.url}
                        className="font-mono text-[0.6rem] text-ice/70 underline-offset-2 group-hover:underline"
                      >
                        {d.name}
                      </span>
                    ))}
                  </div>
                )}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* 3 — CONTACT */
function Contact() {
  return (
    <section data-section="3" style={{ height: '100vh' }} className="relative">
      <div className="pin items-center px-6 text-center">
        <div>
          <SectionTag index={3} label="Coordinates" />
          <h2 className="font-display text-4xl font-black md:text-6xl">
            Let's build something
          </h2>
          <p className="mx-auto mt-4 max-w-md font-mono text-xs text-white/55 md:text-sm">
            Open to conversations about embedded systems, ML infrastructure, and the
            messy, interesting space between them.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 font-mono text-xs">
            <a className="text-ice hover:text-white" href="mailto:davidgraymi@gmail.com">
              email
            </a>
            <a className="text-ice hover:text-white" href={SOCIALS.github} target="_blank" rel="noreferrer">
              github
            </a>
            <a className="text-ice hover:text-white" href={SOCIALS.linkedin} target="_blank" rel="noreferrer">
              linkedin
            </a>
            <a className="text-ice hover:text-white" href={SOCIALS.twitter} target="_blank" rel="noreferrer">
              twitter
            </a>
            <a className="text-ice hover:text-white" href="/files/Resume.docx">
              resume
            </a>
          </div>
          <div className="mt-16 font-mono text-[0.6rem] text-white/25">
            © {new Date().getFullYear()} David Gray · from the metal to the model
          </div>
        </div>
      </div>
    </section>
  )
}

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
