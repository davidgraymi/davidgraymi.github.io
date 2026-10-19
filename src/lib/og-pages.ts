import { site } from '~/site.config';
import type { Card } from './og';

/**
 * Social cards for the top-level pages, keyed by the card's file name under /og/.
 * BaseHead picks the one matching the current path and falls back to `index`.
 * Posts and projects get their own cards from src/pages/og/[...slug].png.ts.
 */
export const pageCards: Record<string, Card> = {
  index: {
    kicker: 'Product security',
    title: 'Engineer. Scientist. Occasionally underwater.',
    description: 'Securing Kubernetes and Azure delivery, from threat model to release. Machine learning and side projects after hours.',
    path: '/',
    meta: site.location,
  },
  work: {
    kicker: 'Work',
    title: "Things I've built, and what each one taught me",
    description: 'Cloud security, real-time embedded systems, applied machine learning, and side projects that got out of hand.',
    path: '/work',
  },
  blog: {
    kicker: 'Writing',
    title: 'Notes from the workbench',
    description: 'Security, performance measurements, and what I learned building things.',
    path: '/blog',
  },
  about: {
    kicker: 'About',
    title: "Hi, I'm David. I got into this to find out how the magic worked.",
    path: '/about',
    meta: site.location,
  },
  resume: {
    kicker: 'Résumé',
    title: 'David Gray',
    description: site.role,
    path: '/resume',
    meta: 'Web · PDF',
  },
  contact: {
    kicker: 'Contact',
    title: 'Have something hard that has to work?',
    description: 'Contract work, a full-time role, or a problem you want a second opinion on.',
    path: '/contact',
  },
};

/** `/blog/` -> `blog`, `/` -> `index`; anything without its own card gets the homepage's. */
export function pageCardFor(pathname: string) {
  const key = pathname.replace(/^\/|\/$/g, '') || 'index';
  return `/og/${key in pageCards ? key : 'index'}.png`;
}
