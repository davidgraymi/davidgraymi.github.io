import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

/**
 * Adding content is meant to be boring:
 *   a project  -> src/content/work/<slug>.md
 *   a post     -> src/content/blog/<slug>.md
 *   an album   -> src/content/photos/<slug>.md  (+ images in src/assets/photos/<slug>/)
 * See CONTENT.md for the full cheat sheet.
 */

const linkSchema = z.object({
  label: z.string(),
  href: z.string(),
});

const work = defineCollection({
  loader: glob({ base: './src/content/work', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      /** One sentence. Shows up on cards and in search results. */
      blurb: z.string(),
      /** Free-form badge: "Professional", "Personal", "Research", ... */
      kind: z.string().default('Personal'),
      year: z.string(),
      /** Ordered most-important-first; the first four show on cards. */
      stack: z.array(z.string()).default([]),
      /** The one number or fact worth remembering about this project. */
      highlight: z.string().optional(),
      links: z.array(linkSchema).default([]),
      cover: image().optional(),
      coverAlt: z.string().default(''),
      /** Featured projects lead the /work page and appear on the homepage. */
      featured: z.boolean().default(false),
      /** Lower sorts first within featured / non-featured groups. */
      order: z.number().default(100),
      draft: z.boolean().default(false),
    }),
});

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      tags: z.array(z.string()).default([]),
      cover: image().optional(),
      coverAlt: z.string().default(''),
      draft: z.boolean().default(false),
    }),
});

const photos = defineCollection({
  loader: glob({ base: './src/content/photos', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      location: z.string().optional(),
      /** Defaults to the first image in the album. */
      cover: image().optional(),
      images: z
        .array(
          z.object({
            src: image(),
            alt: z.string(),
            caption: z.string().optional(),
          }),
        )
        .default([]),
      draft: z.boolean().default(false),
    }),
});

export const collections = { work, blog, photos };
