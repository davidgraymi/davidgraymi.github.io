/**
 * Things people can use today. Rendered as product cards on the homepage,
 * above Selected work, so they don't hide among projects.
 *
 * Each card leads with the problem, then the thing, then one action.
 * `slug` is the /work write-up; the homepage leaves these out of Selected work.
 */

export type ProductStatus = 'live' | 'beta' | 'research' | 'archived';

export type Product = {
  slug: string;
  name: string;
  status: ProductStatus;
  /** One sentence, the user's problem, in their terms. */
  problem: string;
  /** One sentence, what the thing does about it. */
  summary: string;
  /** Short mono line top-right: price, licence, platform. */
  meta: string;
  action: { label: string; href: string };
};

export const products: Product[] = [
  {
    slug: 'bindersnap',
    name: 'Bindersnap',
    status: 'live',
    problem: 'Small clinics have to prove who approved which version of a policy, and when.',
    summary:
      'Policy and procedure management where every approved version carries a permanent, exportable sign-off record.',
    meta: '$39 / writer / mo',
    action: { label: 'Start a free trial', href: 'https://app.bindersnap.com/-/signup' },
  },
  {
    slug: 'neural-cost',
    name: 'neural-cost',
    status: 'live',
    problem: "A timer tells you how fast a model runs. It doesn't tell you whether that's good.",
    summary:
      'A Python library that works out how fast a neural network should run: FLOPs, tensor traffic and a roofline model across PyTorch, JAX and TensorFlow.',
    meta: 'pip install neural-cost',
    action: { label: 'Get it on PyPI', href: 'https://pypi.org/project/neural-cost/' },
  },
];

export const statusLabel: Record<ProductStatus, string> = {
  live: 'Live',
  beta: 'Beta',
  research: 'Research',
  archived: 'Archived',
};
