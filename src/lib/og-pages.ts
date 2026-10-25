import { site } from '~/site.config';
import type { Card } from './og';

/**
 * Social cards for the top-level pages, keyed by the card's file name under /og/.
 * BaseHead picks the one matching the current path and falls back to `index`.
 * Posts and projects get their own cards from src/pages/og/[...slug].png.ts.
 */
export const pageCards: Record<string, Card> = {
  index: {
    kicker: 'Machine learning',
    title: site.name,
    description: 'Machine learning · ML performance · Secure cloud',
    path: '/',
    portrait: true,
  },
  work: {
    kicker: 'Work',
    title: "Things I've built, and what each one taught me",
    description: 'Applied machine learning, cloud security, real-time embedded systems, and side projects that got out of hand.',
    path: '/work',
  },
  blog: {
    kicker: 'Writing',
    title: 'Notes from the workbench',
    description: 'ML performance measurements, security, and what I learned building things.',
    path: '/blog',
  },
  play: {
    kicker: 'Games',
    title: 'Play against the models',
    description: 'Tetris against a value network, digits against KNN, mushrooms against a decision tree, and a few quick ones.',
    path: '/play',
  },
  about: {
    kicker: 'About',
    title: site.name,
    description: `Software engineer · ${site.location}`,
    path: '/about',
    portrait: true,
  },
  resume: {
    kicker: 'Resume',
    title: site.name,
    description: 'Resume · Machine learning · Secure cloud',
    path: '/resume',
    portrait: true,
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
