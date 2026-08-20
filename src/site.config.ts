/**
 * Everything about "who I am and where to find me" lives here.
 * Change it once, it changes everywhere on the site.
 */
export const site = {
  name: 'David Gray',
  shortName: 'David',
  url: 'https://davidmgray.com',
  /** Shown under the name in the header and in metadata. */
  role: 'Software engineer — real-time systems & applied AI',
  location: 'St. Louis, Missouri',
  email: 'davidgraymi@gmail.com',
  /** The one-line pitch used for <meta description> and social cards. */
  tagline:
    'I build software for systems that are not allowed to fail — embedded, real-time, and increasingly intelligent.',
  /** Set to false to hide the "available for work" pill site-wide. */
  availableForWork: true,
  availabilityNote: 'Open to consulting and interesting problems',
} as const;

export type SocialLink = {
  label: string;
  href: string;
  /** Short handle shown next to the label. */
  handle?: string;
  /** Key into src/components/Icon.astro */
  icon: 'github' | 'linkedin' | 'mail' | 'file' | 'rss' | 'globe';
};

export const socials: SocialLink[] = [
  { label: 'GitHub', href: 'https://github.com/davidgraymi', handle: '@davidgraymi', icon: 'github' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/david-gray-mi/', handle: 'david-gray-mi', icon: 'linkedin' },
  { label: 'Email', href: `mailto:${site.email}`, handle: site.email, icon: 'mail' },
  { label: 'Résumé', href: '/files/Resume.docx', handle: 'Download (.docx)', icon: 'file' },
];

export const nav = [
  { label: 'Work', href: '/work' },
  { label: 'Writing', href: '/blog' },
  { label: 'Photos', href: '/photos' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];
