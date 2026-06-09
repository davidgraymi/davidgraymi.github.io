// Build-time content loader. Reads the markdown in /content as raw strings via
// Vite's import.meta.glob, parses YAML-ish frontmatter, and exposes typed lists.
// Keeps the markdown files as the single source of truth — edit those, not this.

const projectFiles = import.meta.glob('../content/projects/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
})
const experienceFiles = import.meta.glob('../content/experience/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
})

function parse(raw) {
  const m = /^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/.exec(raw)
  if (!m) return { data: {}, body: raw.trim() }
  const body = m[2].trim()
  const data = {}
  const lines = m[1].split('\n')
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const kv = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(line)
    if (!kv) {
      i++
      continue
    }
    const key = kv[1]
    let val = kv[2].trim()
    // Nested list (e.g. downloads:) — collect following indented "- name:/url:" items.
    if (val === '') {
      const items = []
      i++
      let cur = null
      while (i < lines.length && /^\s+/.test(lines[i])) {
        const itemStart = /^\s*-\s*([A-Za-z0-9_]+):\s*(.*)$/.exec(lines[i])
        const itemCont = /^\s+([A-Za-z0-9_]+):\s*(.*)$/.exec(lines[i])
        if (itemStart) {
          if (cur) items.push(cur)
          cur = {}
          cur[itemStart[1]] = strip(itemStart[2])
        } else if (itemCont && cur) {
          cur[itemCont[1]] = strip(itemCont[2])
        }
        i++
      }
      if (cur) items.push(cur)
      data[key] = items
      continue
    }
    data[key] = strip(val)
    i++
  }
  return { data, body }
}

function strip(s) {
  return s.replace(/^["']|["']$/g, '').trim()
}

// download urls in frontmatter are bare filenames; assets now live under /files/.
function fileUrl(u) {
  if (!u) return u
  if (/^https?:\/\//.test(u)) return u
  return `/files/${u.replace(/^\/?(files\/)?/, '')}`
}

function load(files, mapper) {
  return Object.entries(files)
    .map(([path, raw]) => {
      const { data, body } = parse(raw)
      const slug = path.split('/').pop().replace(/\.md$/, '')
      return mapper({ slug, data, body })
    })
}

export const projects = load(projectFiles, ({ slug, data, body }) => ({
  slug,
  title: data.title,
  type: data.type || 'Project',
  link: /^https?:\/\//.test(data.link || '') ? data.link : null,
  downloads: (data.downloads || []).map((d) => ({ name: d.name, url: fileUrl(d.url) })),
  body,
}))
// Stable order: external/live projects first, then schoolwork; alpha within.
projects.sort((a, b) => a.title.localeCompare(b.title))

export const experience = load(experienceFiles, ({ slug, data, body }) => ({
  slug,
  title: data.title,
  company: data.company,
  location: data.location || '',
  date: data.date || '',
  endDate: data.endDate || '',
  body,
  bullets: body
    .split('\n')
    .filter((l) => l.trim().startsWith('-'))
    .map((l) => l.replace(/^\s*-\s*/, '').replace(/\*\*(.*?)\*\*/g, '$1')),
  summary: body
    .split('\n')
    .filter((l) => l.trim() && !l.trim().startsWith('-'))
    .join(' ')
    .trim(),
}))
// Most recent first by start date.
experience.sort((a, b) => (b.date || '').localeCompare(a.date || ''))

export function fmtRange(date, endDate) {
  const fmt = (d) => {
    if (!d) return ''
    const dt = new Date(d)
    if (isNaN(dt)) return d
    return dt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }
  return `${fmt(date)} — ${endDate ? fmt(endDate) : 'Present'}`
}
