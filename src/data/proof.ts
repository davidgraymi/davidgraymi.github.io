/**
 * Things other people have said, and claims with a source you can check.
 * Rendered by the "What it's like to work with me" section on the homepage.
 *
 * Rules (see DESIGN.md → Trust & product components):
 * - Quotes are verbatim. Trim whole sentences or paragraphs only, never reword.
 * - Every quote needs a name, a role, and how we worked together.
 * - Link to where the reader can see the original.
 */

export type Quote = {
  /** Verbatim paragraphs, in order. */
  paragraphs: string[];
  name: string;
  /** Their own headline or job title. */
  role: string;
  /** How we know each other, in plain words. */
  relationship: string;
  initials: string;
  source: { label: string; href: string };
};

export const quotes: Quote[] = [
  {
    paragraphs: [
      'He has a tremendous "go getter" attitude, has a lot of energy, and produces a ton of awesome work. In addition to that, he\'s a real joy to be around. He\'s serious when it\'s time to be serious and yet simultaneously can laugh and really enjoy deep friendship with his teammates.',
      "I'm really happy to be working with him now and would enjoy any chance in the future of doing so again!",
    ],
    name: 'Jonathan McCluskey',
    role: 'Continuously Growing into a Master Craftsman',
    relationship: 'Senior teammate at Boeing for 4 years',
    initials: 'JM',
    source: {
      label: 'Full recommendation on LinkedIn',
      href: 'https://www.linkedin.com/in/david-gray-mi/details/recommendations/',
    },
  },
];

export type Receipt = { value: string; label: string; source: { label: string; href: string } };

export const receipts: Receipt[] = [
  {
    value: '11 citations',
    label: 'for an undergraduate sign-language project, years after it shipped',
    source: { label: 'The story', href: '/blog/an-unexpected-email-and-11-citations' },
  },
];
