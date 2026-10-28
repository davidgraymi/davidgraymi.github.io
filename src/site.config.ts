/**
 * Everything about "who I am and where to find me" lives here.
 * Change it once, it changes everywhere on the site.
 */
export const site = {
  name: 'David Gray',
  shortName: 'David',
  url: 'https://davidmgray.com',
  /** Shown under the name in the header and in metadata. */
  role: 'Software Engineer — machine learning, ML performance & secure cloud systems',
  /** The homepage <title> after the name; keep the whole thing under 70 characters. */
  titleRole: 'Software Engineer, ML Performance & Secure Cloud',
  location: 'St. Louis, Missouri',
  email: 'davidgraymi@gmail.com',
  /** The one-line pitch used for <meta description> and social cards. */
  tagline:
    'I build machine learning systems and measure how fast they really run, backed by five years at Boeing, first in real-time embedded software and now in product security, and a data science master\'s in progress at Illinois.',
  /** Set to false to hide the "available for work" pill site-wide. */
  availableForWork: true,
  availabilityNote: 'Open to consulting and interesting problems',
  /** Google Analytics 4 measurement ID. Empty string turns analytics off. */
  analyticsId: 'G-YZG66591CH',
} as const;

export type SocialLink = {
  label: string;
  href: string;
  /** Short handle shown next to the label. */
  handle?: string;
  /** Key into src/components/Icon.astro */
  icon: 'github' | 'linkedin' | 'huggingface' | 'scholar' | 'mail' | 'file' | 'rss' | 'globe';
};

export const socials: SocialLink[] = [
  { label: 'GitHub', href: 'https://github.com/davidgraymi', handle: '@davidgraymi', icon: 'github' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/david-gray-mi/', handle: 'david-gray-mi', icon: 'linkedin' },
  { label: 'Email', href: `mailto:${site.email}`, handle: site.email, icon: 'mail' },
  { label: 'Hugging Face', href: 'https://huggingface.co/davidgray', handle: 'davidgray', icon: 'huggingface' },
  { label: 'Google Scholar', href: 'https://scholar.google.com/citations?hl=en&user=gRrZp_AAAAAJ', handle: 'David Gray', icon: 'scholar' },
  { label: 'Resume', href: '/resume', handle: 'Web or PDF', icon: 'file' },
];

export const nav = [
  { label: 'Work', href: '/work' },
  { label: 'Writing', href: '/blog' },
  { label: 'Games', href: '/play' },
  { label: 'Photos', href: '/photos' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];
